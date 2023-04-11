/* eslint-disable prefer-destructuring */
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { ISpaceContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

export const SpaceContext = createContext<ISpaceContext>({} as ISpaceContext)

const defaults = {
    spaceData: {
        id: null,
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
        UsersWithAccess: [],
    },
    postFilters: {
        type: 'All Types',
        sortBy: 'Recent Activity',
        sortOrder: 'Descending',
        timeRange: 'All Time',
        depth: 'All Contained Posts',
        lens: 'List',
    },
    spaceFilters: {
        type: 'All Types',
        sortBy: 'Likes',
        sortOrder: 'Descending',
        timeRange: 'All Time',
        depth: 'Only Direct Descendants',
        lens: 'Circles',
    },
    peopleFilters: {
        sortBy: 'Date Created',
        sortOrder: 'Descending',
        timeRange: 'All Time',
    },
}

function SpaceContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const { accountData, loggedIn } = useContext(AccountContext)
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
    // space posts
    const [spacePosts, setSpacePosts] = useState<any[]>([])
    const [totalMatchingPosts, setTotalMatchingPosts] = useState(0)
    const [spacePostsFilters, setSpacePostsFilters] = useState(defaults.postFilters)
    const [spacePostsPaginationLimit, setSpacePostsPaginationLimit] = useState(10)
    const [spacePostsPaginationOffset, setSpacePostsPaginationOffset] = useState(0)
    const [spacePostsPaginationHasMore, setSpacePostsPaginationHasMore] = useState(true)
    const [postMapData, setPostMapData] = useState<any>({})
    // space spaces
    const [spaceCircleData, setSpaceCircleData] = useState<any>({})
    const [spaceTreeData, setSpaceTreeData] = useState<any>({})
    const [spaceListData, setSpaceListData] = useState<any[]>([])
    const [spaceSpacesFilters, setSpaceSpacesFilters] = useState(defaults.spaceFilters)
    const [spaceSpacesPaginationLimit, setSpaceSpacesPaginationLimit] = useState(10)
    const [spaceSpacesPaginationOffset, setSpaceSpacesPaginationOffset] = useState(0)
    const [spaceSpacesPaginationHasMore, setSpaceSpacesPaginationHasMore] = useState(true)
    // space people
    const [spacePeople, setSpacePeople] = useState<any[]>([])
    const [defaultPeopleFilters, setDefaultPeopleFilters] = useState(defaults.peopleFilters)
    const [spacePeoplePaginationLimit, setSpacePeoplePaginationLimit] = useState(20)
    const [spacePeoplePaginationOffset, setSpacePeoplePaginationOffset] = useState(0)
    const [spacePeoplePaginationHasMore, setSpacePeoplePaginationHasMore] = useState(true)

    const currentSpaceHandleRef = useRef('')
    const cookies = new Cookies()
    const location = useLocation()

    function updateSpaceUserStatus(space) {
        if (loggedIn) {
            setIsFollowing(space.isFollowing)
            setIsModerator(space.isModerator)
        } else {
            setIsFollowing(false)
            setIsModerator(false)
        }
    }

    // todo: use authenticate token to grab space data and posts when logged in
    function getSpaceData(handle: string) {
        console.log(`SpaceContext: getSpaceData (${handle})`)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        setSpaceNotFound(false)
        axios
            .get(`${config.apiURL}/space-data?handle=${handle}`, options)
            .then((res) => {
                // console.log('space-data: ', res.data)
                // todo: apply default people filters when set up
                // setSpacePostsFilters()
                // setDefaultPeopleFilters()
                updateSpaceUserStatus(res.data)
                setSpaceData(res.data)
            })
            .catch((error) => {
                if (error.response) {
                    if (error.response.status === 404) setSpaceNotFound(true)
                }
                console.log(error)
            })
    }

    function getSpacePosts(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpacePosts (${offset + 1} to ${offset + limit})`)
        setSpacePostsFilters(params)
        const firstLoad = offset === 0
        if (firstLoad) setSpacePostsLoading(true)
        else setNextSpacePostsLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-posts?spaceId=${spaceId
                }&postType=${params.type
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''
                }&limit=${limit
                }&offset=${offset}`,
                options
            )
            .then((res) => {
                if (currentSpaceHandleRef.current === spaceData.handle) {
                    setSpacePosts(firstLoad ? res.data : [...spacePosts, ...res.data])
                    setSpacePostsPaginationHasMore(res.data.length === spacePostsPaginationLimit)
                    setSpacePostsPaginationOffset(offset + spacePostsPaginationLimit)
                    if (firstLoad) setSpacePostsLoading(false)
                    else setNextSpacePostsLoading(false)
                }
            })
    }

    function getPostMapData(spaceId, params, limit) {
        console.log(`SpaceContext: getPostMapData`, spaceId, params, limit)
        setSpacePostsFilters(params)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/post-map-data?spaceId=${spaceId
                }&postType=${params.type
                }&offset=${0
                }&limit=${limit
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''}`,
                options
            )
            .then((res) => setPostMapData(res.data))
    }

    function getSpaceListData(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpaceListData (${offset + 1} to ${offset + limit})`)
        setSpaceSpacesFilters(params)
        const firstLoad = offset === 0
        if (firstLoad) setSpaceSpacesLoading(true)
        else setNextSpaceSpacesLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-spaces?spaceId=${spaceId
                }&timeRange=${params.timeRange
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''
                }&limit=${limit
                }&offset=${offset}`,
                options
            )
            .then((res) => {
                setSpaceListData(firstLoad ? res.data : [...spaceListData, ...res.data])
                setSpaceSpacesPaginationHasMore(res.data.length === spaceSpacesPaginationLimit)
                setSpaceSpacesPaginationOffset(offset + spaceSpacesPaginationLimit)
                if (firstLoad) setSpaceSpacesLoading(false)
                else setNextSpaceSpacesLoading(false)
            })
    }

    // todo: consider merging getSpaceMapData and getSpaceMapChildren as both use the same space-map-data route
    // todo: use post request and pass in params as object
    function getSpaceMapData(spaceId, params) {
        console.log(`SpaceContext: getSpaceMapData`)
        setSpaceSpacesFilters(params)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-map-data?spaceId=${spaceId
                }&lens=${params.lens
                }&offset=${0
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''
                }&isParent=${true}`,
                options
            )
            .then((res) => {
                if (params.lens === 'Tree') setSpaceTreeData(res.data)
                if (params.lens === 'Circles') setSpaceCircleData(res.data)
            })
            .catch((error) => console.log(error))
    }

    function getSpaceMapChildren(spaceId, offset, params, isParent) {
        setSpaceSpacesFilters(params)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        return axios.get(
            /* prettier-ignore */
            `${config.apiURL}/space-map-data?spaceId=${spaceId
                }&lens=${params.lens
                }&offset=${offset
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''
                }&isParent=${isParent}`,
            options
        )
    }

    function getSpacePeople(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpacePeople (${offset + 1} to ${offset + limit})`)
        const firstLoad = offset === 0
        if (firstLoad) setSpacePeopleLoading(true)
        else setNextSpacePeopleLoading(true)
        const isRootSpace = spaceId === 1
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/${isRootSpace ? 'all-users' : 'space-people'
                }?accountId=${accountData.id
                }&spaceId=${spaceId
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&searchQuery=${params.searchQuery || ''
                }&limit=${limit
                }&offset=${offset}`,
                options
            )
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
    }

    function resetSpaceListData() {
        setSpaceListData([])
        setSpaceSpacesPaginationLimit(10)
        setSpaceSpacesPaginationOffset(0)
        setSpaceSpacesPaginationHasMore(true)
    }

    function resetSpacePeople() {
        setSpacePeople([])
        setSpacePeoplePaginationLimit(20)
        setSpacePeoplePaginationOffset(0)
        setSpacePeoplePaginationHasMore(true)
    }

    useEffect(() => updateSpaceUserStatus(spaceData), [loggedIn])

    useEffect(() => {
        currentSpaceHandleRef.current = location.pathname.split('/')[2]
    }, [location])

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
                spacePostsFilters,
                spacePostsPaginationLimit,
                spacePostsPaginationOffset,
                spacePostsPaginationHasMore,
                postMapData,
                setPostMapData,

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
                defaultPeopleFilters,
                spacePeoplePaginationLimit,
                spacePeoplePaginationOffset,
                spacePeoplePaginationHasMore,

                getSpaceData,
                getSpacePosts,
                getPostMapData,
                getSpaceListData,
                getSpaceMapData,
                getSpaceMapChildren,
                getSpacePeople,

                resetSpaceData,
                resetSpacePosts,
                resetSpaceListData,
                resetSpacePeople,
            }}
        >
            {children}
        </SpaceContext.Provider>
    )
}

export default SpaceContextProvider
