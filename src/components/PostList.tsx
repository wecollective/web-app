/* eslint-disable no-nested-ternary */
import React from 'react'
import styles from '@styles/components/PostList.module.scss'
import PostCard from '@components/Cards/PostCard/PostCard'
import PostListPlaceholder from '@components/PostListPlaceholder'
import Row from '@components/Row'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Scrollbars from '@src/components/Scrollbars'

const PostList = (props: {
    location: 'space-posts'
    posts: any[]
    firstPostsloading: boolean
    nextPostsLoading: boolean
    onScrollBottom: () => void
}): JSX.Element => {
    const { location, posts, firstPostsloading, nextPostsLoading, onScrollBottom } = props

    return (
        <Scrollbars
            id={`${location}-scrollbars`}
            className={styles.wrapper}
            onScrollBottom={onScrollBottom}
        >
            {firstPostsloading ? (
                <PostListPlaceholder />
            ) : posts.length ? (
                <Column>
                    {posts.map((post) => (
                        <PostCard
                            post={post}
                            key={post.id}
                            location={location}
                            style={{ marginBottom: 15 }}
                        />
                    ))}
                    {nextPostsLoading && (
                        <Row centerX>
                            <LoadingWheel />
                        </Row>
                    )}
                </Column>
            ) : (
                <Row className={styles.noResults}>
                    <p>No posts found that match those settings...</p>
                </Row>
            )}
        </Scrollbars>
    )
}

export default PostList
