import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { ISpaceContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useContext, useState } from 'react'

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
        Creator: {
            id: null,
            handle: null,
            name: null,
            flagImagePath: null,
        },
        DirectChildHolons: [],
        DirectParentHolons: [],
        HolonHandles: [],
    },
    postFilters: {
        type: 'All Types',
        sortBy: 'Date',
        sortOrder: 'Descending',
        timeRange: 'All Time',
        depth: 'All Contained Posts',
        view: 'List',
    },
    spaceFilters: {
        type: 'All Types',
        sortBy: 'Likes',
        sortOrder: 'Descending',
        timeRange: 'All Time',
        depth: 'Only Direct Descendants',
        view: 'Map',
    },
    peopleFilters: {
        sortBy: 'Date',
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

    const [spacePosts, setSpacePosts] = useState<any[]>([])
    const [totalMatchingPosts, setTotalMatchingPosts] = useState(0)
    const [spacePostsFilters, setSpacePostsFilters] = useState(defaults.postFilters)
    const [spacePostsPaginationLimit, setSpacePostsPaginationLimit] = useState(10)
    const [spacePostsPaginationOffset, setSpacePostsPaginationOffset] = useState(0)
    const [spacePostsPaginationHasMore, setSpacePostsPaginationHasMore] = useState(true)
    const [postMapData, setPostMapData] = useState<any>({})

    const [spaceSpaces, setSpaceSpaces] = useState<any[]>([])
    const [spaceSpacesFilters, setSpaceSpacesFilters] = useState(defaults.spaceFilters)
    const [spaceSpacesPaginationLimit, setSpaceSpacesPaginationLimit] = useState(10)
    const [spaceSpacesPaginationOffset, setSpaceSpacesPaginationOffset] = useState(0)
    const [spaceSpacesPaginationHasMore, setSpaceSpacesPaginationHasMore] = useState(true)
    const [spaceMapData, setSpaceMapData] = useState<any>({})

    const [spacePeople, setSpacePeople] = useState<any[]>([])
    const [defaultPeopleFilters, setDefaultPeopleFilters] = useState(defaults.peopleFilters)
    const [spacePeoplePaginationLimit, setSpacePeoplePaginationLimit] = useState(20)
    const [spacePeoplePaginationOffset, setSpacePeoplePaginationOffset] = useState(0)
    const [spacePeoplePaginationHasMore, setSpacePeoplePaginationHasMore] = useState(true)

    function getSpaceData(handle: string) {
        console.log(`SpaceContext: getSpaceData (${handle})`)
        setSpaceNotFound(false)
        axios
            .get(`${config.apiURL}/space-data?handle=${handle}`)
            .then((res) => {
                if (loggedIn) {
                    setIsFollowing(accountData.FollowedHolons.some((s) => s.id === res.data.id))
                    setIsModerator(accountData.ModeratedHolons.some((s) => s.id === res.data.id))
                }
                // todo: apply default people filters when set up
                // setSpacePostsFilters()
                // setDefaultPeopleFilters()
                setSpaceData(res.data)
            })
            .catch((error) => {
                if (error.response.status === 404) setSpaceNotFound(true)
            })
    }

    function getSpacePosts(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpacePosts (${offset + 1} to ${offset + limit})`)
        const firstLoad = offset === 0
        if (firstLoad) setSpacePostsLoading(true)
        else setNextSpacePostsLoading(true)
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-posts?accountId=${accountData.id
                }&spaceId=${spaceId
                }&postType=${params.type
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''
                }&limit=${limit
                }&offset=${offset}`
            )
            .then((res) => {
                setSpacePosts(firstLoad ? res.data.posts : [...spacePosts, ...res.data.posts])
                setTotalMatchingPosts(res.data.totalMatchingPosts)
                // use total matching posts to work out if definitely more
                setSpacePostsPaginationHasMore(res.data.posts.length === spacePostsPaginationLimit)
                setSpacePostsPaginationOffset(offset + spacePostsPaginationLimit)
                if (firstLoad) setSpacePostsLoading(false)
                else setNextSpacePostsLoading(false)
            })
    }

    function getPostMapData(spaceId, params, limit) {
        console.log(`SpaceContext: getPostMapData`, spaceId, params, limit)
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/post-map-data?accountId=${accountData.id
                }&spaceId=${spaceId
                }&postType=${params.type
                }&offset=${0
                }&limit=${limit
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''}`
            )
            .then((res) => setPostMapData(res.data))
    }

    function getSpaceSpaces(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpaceSpaces (${offset + 1} to ${offset + limit})`)
        const firstLoad = offset === 0
        if (firstLoad) setSpaceSpacesLoading(true)
        else setNextSpaceSpacesLoading(true)
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-spaces?accountId=${accountData.id
                }&spaceId=${spaceId
                }&timeRange=${params.timeRange
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''
                }&limit=${limit
                }&offset=${offset}`
            )
            .then((res) => {
                setSpaceSpaces(firstLoad ? res.data : [...spaceSpaces, ...res.data])
                setSpaceSpacesPaginationHasMore(res.data.length === spaceSpacesPaginationLimit)
                setSpaceSpacesPaginationOffset(offset + spaceSpacesPaginationLimit)
                if (firstLoad) setSpaceSpacesLoading(false)
                else setNextSpaceSpacesLoading(false)
            })
    }

    function getSpaceMapData(spaceId, params) {
        console.log(`SpaceContext: getSpaceMapData`, params)
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-map-data?spaceId=${spaceId
                }&offset=${0
                }&sortBy=${params.sortBy
                }&sortOrder=${params.sortOrder
                }&timeRange=${params.timeRange
                }&depth=${params.depth
                }&searchQuery=${params.searchQuery || ''}`
            )
            .then((res) => setSpaceMapData(res.data))
    }

    function getSpacePeople(spaceId, offset, limit, params) {
        console.log(`SpaceContext: getSpacePeople (${offset + 1} to ${offset + limit})`)
        const firstLoad = offset === 0
        if (firstLoad) setSpacePeopleLoading(true)
        else setNextSpacePeopleLoading(true)
        const isRootSpace = spaceId === 1
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
                }&offset=${offset}`
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

    function resetSpaceSpaces() {
        setSpaceSpaces([])
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

                spaceSpaces,
                setSpaceSpaces,
                spaceSpacesFilters,
                spaceSpacesPaginationLimit,
                spaceSpacesPaginationOffset,
                spaceSpacesPaginationHasMore,
                spaceMapData,
                setSpaceMapData,

                spacePeople,
                defaultPeopleFilters,
                spacePeoplePaginationLimit,
                spacePeoplePaginationOffset,
                spacePeoplePaginationHasMore,

                getSpaceData,
                getSpacePosts,
                getPostMapData,
                getSpaceSpaces,
                getSpaceMapData,
                getSpacePeople,

                resetSpaceData,
                resetSpacePosts,
                resetSpaceSpaces,
                resetSpacePeople,
            }}
        >
            {children}
        </SpaceContext.Provider>
    )
}

export default SpaceContextProvider
