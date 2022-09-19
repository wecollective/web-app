/* eslint-disable no-nested-ternary */
import PostCard from '@components/cards/PostCard/PostCard'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import PostListPlaceholder from '@components/PostListPlaceholder'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/components/PostList.module.scss'
import React, { useContext, useEffect } from 'react'

const PostList = (props: {
    location: 'space-posts' | 'user-posts'
    posts: any[]
    firstPostsloading: boolean
    nextPostsLoading: boolean
    style?: any
}): JSX.Element => {
    const { location, posts, firstPostsloading, nextPostsLoading, style } = props
    const { resetSpacePosts } = useContext(SpaceContext)
    const { resetUserPosts } = useContext(UserContext)

    useEffect(
        () => () => {
            if (location === 'space-posts') resetSpacePosts()
            if (location === 'user-posts') resetUserPosts()
        },
        []
    )

    return (
        <Column className={styles.wrapper} style={style}>
            {firstPostsloading ? (
                <PostListPlaceholder />
            ) : posts.length ? (
                <Column className={styles.posts}>
                    {posts.map((post) => (
                        <PostCard post={post} key={post.id} location={location} />
                    ))}
                    {nextPostsLoading && (
                        <Row centerX style={{ marginBottom: 70 }}>
                            <LoadingWheel />
                        </Row>
                    )}
                </Column>
            ) : (
                <Row className={styles.noResults}>
                    <p>No posts found that match those settings...</p>
                </Row>
            )}
        </Column>
    )
}

PostList.defaultProps = {
    style: null,
}

export default PostList
