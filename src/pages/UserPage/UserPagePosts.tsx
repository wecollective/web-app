import Column from '@components/Column'
import PostList from '@components/PostList'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/SpaceNotFound'
import UserPagePostsHeader from '@pages/UserPage/UserPagePostsHeader'
import styles from '@styles/pages/UserPage/UserPagePosts.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const UserPagePosts = (): JSX.Element => {
    const { pageBottomReached } = useContext(AccountContext)
    const {
        userData,
        userNotFound,
        userPosts,
        userPostsLoading,
        setUserPostsLoading,
        nextUserPostsLoading,
        userPostsFilters,
        userPostsPaginationLimit,
        userPostsPaginationOffset,
        userPostsPaginationHasMore,
        getUserPosts,
    } = useContext(UserContext)
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...userPostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    useEffect(() => {
        if (userData.handle !== userHandle) setUserPostsLoading(true)
        else {
            if (params.view === 'List')
                getUserPosts(userData.id, 0, userPostsPaginationLimit, params)
            if (params.view === 'Map') {
                // getPostMapData(spaceData.id, params)
            }
        }
    }, [userData.handle, location])

    useEffect(() => {
        if (!userPostsLoading && !nextUserPostsLoading && userPostsPaginationHasMore)
            getUserPosts(userData.id, userPostsPaginationOffset, userPostsPaginationLimit, params)
    }, [pageBottomReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <UserPagePostsHeader params={params} />
            <Column className={styles.content}>
                {params.view === 'List' && (
                    <Row className={styles.postListView}>
                        <PostList
                            location='user-posts'
                            posts={userPosts}
                            firstPostsloading={userPostsLoading}
                            nextPostsLoading={nextUserPostsLoading}
                        />
                    </Row>
                )}
                {/* {params.view === 'Map' && (
                    <Column className={styles.postMapView}>
                        <UserPagePostMap />
                    </Column>
                )} */}
            </Column>
        </Column>
    )
}

export default UserPagePosts
