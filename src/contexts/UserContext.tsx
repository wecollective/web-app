/* eslint-disable prefer-destructuring */
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { IPost, IUserContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

export const UserContext = createContext<IUserContext>({} as IUserContext)

const defaults = {
    userData: {
        id: null,
        handle: null,
        name: null,
        bio: null,
        flagImagePath: null,
        coverImagePath: null,
        createdAt: null,
        followedSpaces: [],
        moderatedSpaces: [],
    },
    postFilters: {
        filter: 'New',
        type: 'All Types',
        sortBy: '',
        timeRange: '',
        searchQuery: '',
        lens: 'List',
    },
}

function UserContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const { loggedIn, accountData } = useContext(AccountContext)
    const [isOwnAccount, setIsOwnAccount] = useState(false)
    const [selectedUserSubPage, setSelectedUserSubPage] = useState('')
    const [userData, setUserData] = useState(defaults.userData)
    const [userNotFound, setUserNotFound] = useState(false)
    const [userPosts, setUserPosts] = useState<IPost[]>([])
    const [userPostsLoading, setUserPostsLoading] = useState(true)
    const [nextUserPostsLoading, setNextUserPostsLoading] = useState(false)
    const [userPostsFilters, setUserPostsFilters] = useState(defaults.postFilters)
    const [userPostsFiltersOpen, setUserPostsFiltersOpen] = useState(false)
    const [userPostsPaginationLimit, setUserPostsPaginationLimit] = useState(10)
    const [userPostsPaginationOffset, setUserPostsPaginationOffset] = useState(0)
    const [userPostsPaginationHasMore, setUserPostsPaginationHasMore] = useState(false)
    const cookies = new Cookies()
    const location = useLocation()
    const currentUserHandle = useRef('')

    function getUserData(userHandle, returnFunction) {
        console.log('UserContext: getUserData')
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/user-data?userHandle=${userHandle}`, options)
            .then((res) => {
                setUserData(res.data || defaults.userData)
                if (returnFunction) returnFunction(res.data)
            })
            .catch((error) => {
                if (error.statusCode === 404) setUserNotFound(true)
                else console.log('error: ', error)
            })
    }

    function getUserPosts(userId, offset, limit, params) {
        console.log(`UserContext: getUserPosts (${offset} to ${offset + userPostsPaginationLimit})`)
        const firstLoad = offset === 0
        if (firstLoad) setUserPostsLoading(true)
        else setNextUserPostsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = { userId, offset, limit, params }
        axios
            .post(`${config.apiURL}/user-posts`, data, options)
            .then((res) => {
                // console.log('user-posts: ', res.data)
                if (currentUserHandle.current === userData.handle) {
                    setUserPosts(firstLoad ? res.data : [...userPosts, ...res.data])
                    setUserPostsPaginationHasMore(res.data.length === userPostsPaginationLimit)
                    setUserPostsPaginationOffset(offset + userPostsPaginationLimit)
                    if (firstLoad) setUserPostsLoading(false)
                    else setNextUserPostsLoading(false)
                }
            })
            .catch((error) => console.log('GET user-posts error: ', error))
    }

    function updateUserPostsFilter(key, payload) {
        console.log(`UserContext: updateUserPostsFilter (${key}: ${payload})`)
        setUserPostsFilters({ ...userPostsFilters, [key]: payload })
    }

    function resetUserData() {
        console.log('UserContext: resetUserData')
        setUserData(defaults.userData)
    }

    function resetUserPosts() {
        console.log('UserContext: resetUserPosts')
        setUserPosts([])
        setUserPostsFilters(defaults.postFilters)
    }

    // determine if user is owned by account
    useEffect(() => {
        if (loggedIn && userData.id === accountData.id) setIsOwnAccount(true)
        else setIsOwnAccount(false)
    }, [userData.id, loggedIn])

    useEffect(() => {
        currentUserHandle.current = location.pathname.split('/')[2]
    }, [location])

    return (
        <UserContext.Provider
            value={{
                isOwnAccount,
                selectedUserSubPage,
                setSelectedUserSubPage,
                userData,
                setUserData,
                userNotFound,
                userPosts,
                setUserPosts,
                userPostsLoading,
                setUserPostsLoading,
                nextUserPostsLoading,
                userPostsFilters,
                userPostsFiltersOpen,
                setUserPostsFiltersOpen,
                userPostsPaginationLimit,
                userPostsPaginationOffset,
                userPostsPaginationHasMore,
                // functions
                getUserData,
                getUserPosts,
                updateUserPostsFilter,
                resetUserData,
                resetUserPosts,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

export default UserContextProvider
