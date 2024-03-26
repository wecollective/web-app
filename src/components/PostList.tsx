/* eslint-disable no-nested-ternary */
import Column from '@components/Column'
import PostListPlaceholder from '@components/PostListPlaceholder'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import PostCard from '@components/cards/PostCard/PostCard'
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
    const { spaceData, spacePosts, setSpacePosts, resetSpacePosts } = useContext(SpaceContext)
    const { userData, userPosts, setUserPosts, resetUserPosts } = useContext(UserContext)
    const mobileView = document.documentElement.clientWidth < 900
    const l = useLocation()
    const handle = l.pathname.split('/')[2]

    useEffect(() => {
        if (location === 'space-posts' && handle === spaceData.handle) {
            const postList = document.getElementById('post-list')
            postList?.addEventListener('dragover', (e) => e.preventDefault())
            postList?.addEventListener('drop', () => {
                const { data, fromToyBox } = dragItemRef.current
                if (data.type === 'post' && data.state === 'active' && fromToyBox) {
                    setDropLocation({ type: 'space', data: spaceData })
                    setDropModalOpen(true)
                }
            })
        }
    }, [spaceData.id])

    useEffect(() => {
        const postList = document.getElementById('placeholder') as any
        const samePage =
            location === 'space-posts' ? handle === spaceData.handle : handle === userData.handle
        if (loading) {
            postList.style.visibility = 'visible'
        } else if (samePage) {
            postList.style.opacity = 0
            setTimeout(() => {
                postList.style.visibility = 'hidden'
                postList.style.opacity = 1
            }, 500)
        }
    }, [loading])

    useEffect(
        () => () => {
            if (location === 'space-posts') resetSpacePosts()
            if (location === 'user-posts') resetUserPosts()
        },
        []
    )

    return (
        <Column id='post-list' className={`${styles.wrapper} ${className}`} style={style}>
            <PostListPlaceholder id='placeholder' />
            {!loading && (
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
                                    onDelete={(id: number) => {
                                        switch (location) {
                                            case 'space-posts':
                                                setSpacePosts(spacePosts.filter((p) => p.id !== id))
                                                break
                                            case 'user-posts':
                                                setUserPosts(userPosts.filter((p) => p.id !== id))
                                                break
                                            default: {
                                                const exhaustiveCheck: never = location
                                                throw exhaustiveCheck
                                            }
                                        }
                                    }}
                                    setPost={(newPost) => {
                                        switch (location) {
                                            case 'space-posts':
                                                setSpacePosts(
                                                    spacePosts.map((p) =>
                                                        p.id === newPost.id ? newPost : p
                                                    )
                                                )
                                                break
                                            default:
                                                console.error('TODO')
                                        }
                                    }}
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
