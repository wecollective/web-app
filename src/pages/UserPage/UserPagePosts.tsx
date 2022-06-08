import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { AccountContext } from '@src/contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import { getNewParams } from '@src/Helpers'
import styles from '@styles/pages/UserPage/UserPagePosts.module.scss'
import UserPagePostsFilters from '@pages/UserPage/UserPagePostsFilters'
import Row from '@components/Row'
import Column from '@components/Column'
import PostList from '@components/PostList'
import UserPagePostsHeader from '@pages/UserPage/UserPagePostsHeader'
import UserNotFound from '@pages/SpaceNotFound'

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
    const history = useHistory()
    const userHandle = location.pathname.split('/')[2]
    const [filtersOpen, setFiltersOpen] = useState(false)

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...userPostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function applyParam(type, value) {
        history.push({
            pathname: location.pathname,
            search: getNewParams(params, type, value),
        })
    }

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
            <UserPagePostsHeader
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                params={params}
                applyParam={applyParam}
            />
            {filtersOpen && <UserPagePostsFilters params={params} applyParam={applyParam} />}
            <Column className={styles.content}>
                {params.view === 'List' && (
                    <Row className={styles.postListView}>
                        <Column style={{ width: '100%' }}>
                            <PostList
                                location='user-posts'
                                posts={userPosts}
                                firstPostsloading={userPostsLoading}
                                nextPostsLoading={nextUserPostsLoading}
                            />
                        </Column>
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
