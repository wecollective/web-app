/* eslint-disable no-nested-ternary */
import PostCard from '@components/cards/PostCard/PostCard'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import PostListPlaceholder from '@components/PostListPlaceholder'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/components/PostList.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function PostList(props: {
    location: 'space-posts' | 'user-posts'
    posts: any[]
    totalPosts: number
    loading: boolean
    nextPostsLoading: boolean
    className?: string
    styling?: boolean
    style?: any
}): JSX.Element {
    const { location, posts, totalPosts, loading, nextPostsLoading, className, styling, style } =
        props
    const { dragItemRef, setDropLocation, setDropModalOpen } = useContext(AccountContext)
    const { spaceData, resetSpacePosts } = useContext(SpaceContext)
    const { resetUserPosts } = useContext(UserContext)
    const mobileView = document.documentElement.clientWidth < 900
    const l = useLocation()
    const spaceHandle = l.pathname.split('/')[2]

    useEffect(() => {
        if (spaceHandle === spaceData.handle && location === 'space-posts') {
            const postList = document.getElementById('space-posts')
            postList?.addEventListener('dragover', (e) => e.preventDefault())
            postList?.addEventListener('drop', () => {
                const { type } = dragItemRef.current
                if (type === 'post') {
                    setDropLocation({ type: 'space', data: spaceData })
                    setDropModalOpen(true)
                }
            })
        }
    }, [spaceData.id])

    useEffect(
        () => () => {
            if (location === 'space-posts') resetSpacePosts()
            if (location === 'user-posts') resetUserPosts()
        },
        []
    )

    return (
        <Column id='space-posts' className={`${styles.wrapper} ${className}`} style={style}>
            {loading ? (
                <PostListPlaceholder />
            ) : (
                <Column>
                    {!posts.length ? (
                        <Column centerY centerX className={styles.noResults}>
                            {totalPosts ? (
                                <p>No posts found that match those settings...</p>
                            ) : (
                                <p>No posts created...</p>
                            )}
                        </Column>
                    ) : (
                        <Column className={styles.posts}>
                            {posts.map((post) => (
                                <PostCard
                                    post={post}
                                    key={post.id}
                                    location={location}
                                    styling={styling}
                                    collapse
                                />
                            ))}
                            {nextPostsLoading && (
                                <Row centerX style={{ marginTop: mobileView ? 15 : 0 }}>
                                    <LoadingWheel />
                                </Row>
                            )}
                        </Column>
                    )}
                </Column>
            )}
        </Column>
    )
}

PostList.defaultProps = {
    className: null,
    styling: false,
    style: null,
}

export default PostList
