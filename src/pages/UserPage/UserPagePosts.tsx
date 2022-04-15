import React, { useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/UserPagePosts.module.scss'
import SearchBar from '@components/SearchBar'
import UserPagePostsFilters from '@pages/UserPage/UserPagePostsFilters'
import PostCard from '@components/Cards/PostCard/PostCard'
import SpacePagePostsPlaceholder from '@pages/SpacePage/SpacePagePostsPlaceholder'
import Scrollbars from '@src/components/Scrollbars'
import Row from '@components/Row'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'

const UserPagePosts = ({ match }: { match: { params: { userHandle: string } } }): JSX.Element => {
    const { params } = match
    const { userHandle } = params
    const { accountDataLoading } = useContext(AccountContext)
    const {
        userData,
        getUserData,
        userPosts,
        userPostsLoading,
        nextUserPostsLoading,
        userPostsFilters,
        userPostsFiltersOpen,
        userPostsPaginationOffset,
        userPostsPaginationHasMore,
        setSelectedUserSubPage,
        setUserPostsFiltersOpen,
        getUserPosts,
        resetUserPosts,
        updateUserPostsFilter,
    } = useContext(UserContext)
    const location = useLocation()

    function onScrollBottom() {
        if (!userPostsLoading && !nextUserPostsLoading && userPostsPaginationHasMore)
            getUserPosts(userData.id, userPostsPaginationOffset)
    }

    useEffect(() => {
        if (!accountDataLoading) {
            if (userHandle !== userData.handle) {
                getUserData(userHandle, (user) => getUserPosts(user.id, 0))
            } else getUserPosts(userData.id, 0)
        }
    }, [accountDataLoading, location, userPostsFilters])

    useEffect(() => {
        setSelectedUserSubPage('posts')
        return () => resetUserPosts()
    }, [])

    return (
        <Column className={styles.wrapper}>
            <Row centerY className={styles.header}>
                <SearchBar
                    setSearchFilter={(payload) => updateUserPostsFilter('searchQuery', payload)}
                    placeholder='Search posts...'
                    style={{ marginRight: 10 }}
                />
                <UserPagePostsFilters />
            </Row>
            <Row className={styles.content}>
                <Scrollbars
                    id='user-posts-scrollbars'
                    className={styles.posts}
                    onScrollBottom={onScrollBottom}
                >
                    {userPostsLoading ? (
                        <SpacePagePostsPlaceholder />
                    ) : (
                        <>
                            {userPosts.length ? (
                                <>
                                    {userPosts.map((post) => (
                                        <PostCard
                                            post={post}
                                            key={post.id}
                                            location='user-posts'
                                            style={{ marginBottom: 15 }}
                                        />
                                    ))}
                                    {nextUserPostsLoading && (
                                        <Row centerX>
                                            <LoadingWheel />
                                        </Row>
                                    )}
                                </>
                            ) : (
                                <div className='wecoNoContentPlaceholder'>
                                    No posts yet that match those settings...
                                </div>
                            )}
                        </>
                    )}
                </Scrollbars>
            </Row>
        </Column>
    )
}

export default UserPagePosts
