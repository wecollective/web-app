/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable prefer-destructuring */
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { baseUserData } from '@src/Helpers'
import { ISpaceContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

export const SpaceContext = createContext<ISpaceContext>({} as ISpaceContext)

const defaults = {
    spaceData: {
        id: null,
        type: null,
        handle: null,
        name: null,
        description: null,
        flagImagePath: null,
        coverImagePath: null,
        createdAt: null,
        totalPosts: 0,
        totalSpaces: 0,
        totalUsers: 0,
        access: 'granted',
        isModerator: false,
        isFollowing: false,
        Creator: {
            id: null,
            handle: null,
            name: null,
            flagImagePath: null,
        },
        DirectChildSpaces: [],
        DirectParentSpaces: [],
        SpaceAncestors: [],
        Members: [],
    },
    postFilters: {
        filter: 'Active',
        type: 'All Types',
        sortBy: '',
        timeRange: '',
        depth: 'Deep',
        searchQuery: '',
        lens: 'List',
    },
    spaceFilters: {
        filter: 'Top',
        sortBy: 'Likes',
        timeRange: 'All Time',
        depth: 'Shallow',
        lens: 'Tree',
    },
    peopleFilters: {
        filter: 'New',
        sortBy: '',
        timeRange: '',
    },
}

function SpaceContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const { accountData, loggedIn, socket } = useContext(AccountContext)
    const [spaceData, setSpaceData] = useState(defaults.spaceData)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isModerator, setIsModerator] = useState(false)
    const [selectedSpaceSubPage, setSelectedSpaceSubPage] = useState('')
    const [fullScreen, setFullScreen] = useState(true)
    // loading state
    const [spaceNotFound, setSpaceNotFound] = useState(false)
    const [spacePostsLoading, setSpacePostsLoading] = useState(true)
    const [nextSpacePostsLoading, setNextSpacePostsLoading] = useState(false)
    const [spaceSpacesLoading, setSpaceSpacesLoading] = useState(true)
    const [nextSpaceSpacesLoading, setNextSpaceSpacesLoading] = useState(false)
    const [spacePeopleLoading, setSpacePeopleLoading] = useState(true)
    const [nextSpacePeopleLoading, setNextSpacePeopleLoading] = useState(false)
    // posts
    const [spacePosts, setSpacePosts] = useState<any[]>([])
    const [totalMatchingPosts, setTotalMatchingPosts] = useState(0)
    const [postFilters, setPostFilters] = useState(defaults.postFilters)
    const [spacePostsPaginationLimit, setSpacePostsPaginationLimit] = useState(10)
    const [spacePostsPaginationOffset, setSpacePostsPaginationOffset] = useState(0)
    const [spacePostsPaginationHasMore, setSpacePostsPaginationHasMore] = useState(true)
    const [postMapData, setPostMapData] = useState<any>({ totalPosts: 0, posts: [] })
    const [postMapOffset, setPostMapOffset] = useState(0)
    // spaces
    const [spaceCircleData, setSpaceCircleData] = useState<any>({})
    const [spaceTreeData, setSpaceTreeData] = useState<any>({})
    const [spaceListData, setSpaceListData] = useState<any[]>([])
    const [spaceSpacesFilters, setSpaceSpacesFilters] = useState(defaults.spaceFilters)
    const [spaceSpacesPaginationLimit, setSpaceSpacesPaginationLimit] = useState(10)
    const [spaceSpacesPaginationOffset, setSpaceSpacesPaginationOffset] = useState(0)
    const [spaceSpacesPaginationHasMore, setSpaceSpacesPaginationHasMore] = useState(true)
    // people
    const [spacePeople, setSpacePeople] = useState<any[]>([])
    const [spacePeopleFilters, setSpacePeopleFilters] = useState(defaults.peopleFilters)
    const [spacePeoplePaginationLimit, setSpacePeoplePaginationLimit] = useState(20)
    const [spacePeoplePaginationOffset, setSpacePeoplePaginationOffset] = useState(0)
    const [spacePeoplePaginationHasMore, setSpacePeoplePaginationHasMore] = useState(true)
    // governance
    const [governancePolls, setGovernancePolls] = useState<any[]>([])
    // websockets
    const [peopleInRoom, setPeopleInRoom] = useState<any[]>([])

    const spaceHandleRef = useRef('')
    const cookies = new Cookies()
    const location = useLocation()
    const [x, page, spaceHandle] = location.pathname.split('/')

    function updateSpaceUserStatus(space) {
        if (loggedIn) {
            setIsFollowing(space.isFollowing)
            setIsModerator(space.isModerator)
        } else {
            setIsFollowing(false)
            setIsModerator(false)
        }
    }

    function getSpaceData(handle: string) {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        resetSpaceList()
        resetSpacePosts()
        resetSpacePeople()
        setSpaceNotFound(false)
        axios
            .get(`${config.apiURL}/space-data?handle=${handle}`, options)
            .then((res) => {
                // console.log('space-data: ', res.data)
                updateSpaceUserStatus(res.data)
                setSpaceData(res.data)
            })
            .catch((error) => {
                if (error.response) {
                    if (error.statusCode === 404) setSpaceNotFound(true)
                }
                console.log(error)
            })
    }

    function getSpacePosts(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpacePosts (${offset + 1} to ${offset + limit})`, params)
        setPostFilters(params)
        const firstLoad = offset === 0
        if (firstLoad) setSpacePostsLoading(true)
        else setNextSpacePostsLoading(true)
        let postTypes = ['post']
        if (spaceData.type === 'chat') postTypes = ['chat-message']
        const data = {
            spaceId,
            offset,
            limit,
            params,
            mutedUsers: accountData.mutedUsers || [],
            postTypes,
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/space-posts`, data, options)
            .then((res) => {
                // console.log('space-posts: ', res.data)
                if (spaceHandleRef.current === spaceData.handle) {
                    setSpacePosts(firstLoad ? res.data : [...spacePosts, ...res.data])
                    setSpacePostsPaginationHasMore(res.data.length === spacePostsPaginationLimit)
                    setSpacePostsPaginationOffset(offset + spacePostsPaginationLimit)
                    if (firstLoad) setSpacePostsLoading(false)
                    else setNextSpacePostsLoading(false)
                }
            })
            .catch((error) => console.log(error))
    }

    function getPostMapData(spaceId, offset, params) {
        console.log(`SpaceContext: getPostMapData`, spaceId, offset, params)
        setPostFilters(params)
        const data = {
            ...params,
            spaceId,
            offset,
            limit: 50,
            searchQuery: params.searchQuery || '',
            mutedUsers: accountData.mutedUsers || [],
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/post-map-data`, data, options)
            .then((res) => {
                const { totalPosts, posts } = res.data
                setPostMapData({
                    totalPosts,
                    posts: offset === 0 ? posts : [...postMapData.posts, ...posts],
                })
                setPostMapOffset(offset + 50)
            })
            .catch((error) => console.log(error))
    }

    function getSpaceListData(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpaceListData (${offset + 1} to ${offset + limit})`)
        setSpaceSpacesFilters(params)
        const firstLoad = offset === 0
        if (firstLoad) setSpaceSpacesLoading(true)
        else setNextSpaceSpacesLoading(true)
        const data = { spaceId, offset, limit, params }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios.post(`${config.apiURL}/space-spaces`, data, options).then((res) => {
            setSpaceListData(firstLoad ? res.data : [...spaceListData, ...res.data])
            setSpaceSpacesPaginationHasMore(res.data.length === spaceSpacesPaginationLimit)
            setSpaceSpacesPaginationOffset(offset + spaceSpacesPaginationLimit)
            if (firstLoad) setSpaceSpacesLoading(false)
            else setNextSpaceSpacesLoading(false)
        })
    }

    function getSpaceMapData(scenario, spaceId, params, offset) {
        console.log(`SpaceContext: getSpaceMapData`)
        setSpaceSpacesFilters(params)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = { scenario, spaceId, params, offset }
        return axios.post(`${config.apiURL}/space-map-data`, data, options)
    }

    function getSpacePeople(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpacePeople (${offset + 1} to ${offset + limit})`)
        const firstLoad = offset === 0
        if (firstLoad) setSpacePeopleLoading(true)
        else setNextSpacePeopleLoading(true)
        const isRootSpace = spaceId === 1
        const data = { spaceId, offset, limit, params }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/${isRootSpace ? 'all-users' : 'space-people'}`, data, options)
            .then((res) => {
                setSpacePeople(firstLoad ? res.data : [...spacePeople, ...res.data])
                setSpacePeoplePaginationHasMore(res.data.length === spacePeoplePaginationLimit)
                setSpacePeoplePaginationOffset(offset + spacePeoplePaginationLimit)
                if (firstLoad) setSpacePeopleLoading(false)
                else setNextSpacePeopleLoading(false)
            })
    }

    function resetSpaceData() {
        setSpaceData(defaults.spaceData)
    }

    function resetSpacePosts() {
        setSpacePosts([])
        setSpacePostsPaginationLimit(10)
        setSpacePostsPaginationOffset(0)
        setSpacePostsPaginationHasMore(true)
        setPostFilters(defaults.postFilters)
    }

    function resetSpaceList() {
        setSpaceListData([])
        setSpaceSpacesPaginationLimit(10)
        setSpaceSpacesPaginationOffset(0)
        setSpaceSpacesPaginationHasMore(true)
        setSpaceSpacesFilters(defaults.spaceFilters)
    }

    function resetSpacePeople() {
        setSpacePeople([])
        setSpacePeoplePaginationLimit(20)
        setSpacePeoplePaginationOffset(0)
        setSpacePeoplePaginationHasMore(true)
        setSpacePeopleFilters(defaults.peopleFilters)
    }

    useEffect(() => updateSpaceUserStatus(spaceData), [loggedIn])

    useEffect(() => {
        // set new handle
        spaceHandleRef.current = spaceHandle
        // exit old room if leaving
        if (spaceData.id && (page !== 's' || spaceHandle !== spaceData.handle)) {
            socket.emit('exit-room', `space-${spaceData.id}`)
        }
    }, [spaceHandle])

    useEffect(() => {
        if (spaceData.id) {
            // remove old listeners
            const listeners = [
                'room-entered',
                'user-entering',
                'user-exiting',
                'user-logged-in',
                'user-logged-out',
            ]
            listeners.forEach((event) => socket.removeAllListeners(event))
            // enter room
            socket.emit('enter-room', {
                roomId: `space-${spaceData.id}`,
                user: { socketId: socket.id, ...baseUserData(accountData) },
            })
            // listen for new events
            socket.on('room-entered', (usersInRoom) => setPeopleInRoom(usersInRoom))
            socket.on('user-entering', (user) => setPeopleInRoom((people) => [user, ...people]))
            socket.on('user-exiting', (socketId) =>
                setPeopleInRoom((people) => people.filter((u) => u.socketId !== socketId))
            )
            socket.on('user-logged-in', (user) =>
                setPeopleInRoom((people) => {
                    const userIndex = people.findIndex((u) => u.socketId === user.socketId)
                    const newPeople = [...people]
                    newPeople[userIndex] = user
                    return newPeople
                })
            )
            socket.on('user-logged-out', (socketId) =>
                setPeopleInRoom((people) => {
                    const userIndex = people.findIndex((u) => u.socketId === socketId)
                    const newPeople = [...people]
                    newPeople[userIndex] = { socketId, id: null }
                    return newPeople
                })
            )
        }
    }, [spaceData.id])

    return (
        <SpaceContext.Provider
            value={{
                spaceData,
                setSpaceData,
                isFollowing,
                setIsFollowing,
                isModerator,
                selectedSpaceSubPage,
                setSelectedSpaceSubPage,
                fullScreen,
                setFullScreen,

                spaceNotFound,
                spacePostsLoading,
                setSpacePostsLoading,
                nextSpacePostsLoading,
                spaceSpacesLoading,
                setSpaceSpacesLoading,
                nextSpaceSpacesLoading,
                spacePeopleLoading,
                setSpacePeopleLoading,
                nextSpacePeopleLoading,

                spacePosts,
                setSpacePosts,
                totalMatchingPosts,
                postFilters,
                spacePostsPaginationLimit,
                spacePostsPaginationOffset,
                spacePostsPaginationHasMore,
                postMapData,
                setPostMapData,
                postMapOffset,
                setPostMapOffset,

                spaceCircleData,
                setSpaceCircleData,
                spaceTreeData,
                setSpaceTreeData,
                spaceListData,
                setSpaceListData,
                spaceSpacesFilters,
                spaceSpacesPaginationLimit,
                spaceSpacesPaginationOffset,
                spaceSpacesPaginationHasMore,

                spacePeople,
                spacePeopleFilters,
                spacePeoplePaginationLimit,
                spacePeoplePaginationOffset,
                spacePeoplePaginationHasMore,

                governancePolls,
                setGovernancePolls,

                peopleInRoom,

                getSpaceData,
                getSpacePosts,
                getPostMapData,
                getSpaceListData,
                getSpaceMapData,
                getSpacePeople,

                resetSpaceData,
                resetSpacePosts,
                resetSpaceList,
                resetSpacePeople,
            }}
        >
            {children}
        </SpaceContext.Provider>
    )
}

export default SpaceContextProvider
