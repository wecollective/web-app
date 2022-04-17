import React from 'react'
import styles from '@styles/components/ListPlaceholder.module.scss'
import Column from '@components/Column'
import PostCardPlaceholder from '@components/Cards/PostCard/PostCardPlaceholder'

const PostListPlaceholder = (): JSX.Element => {
    return (
        <Column>
            <div className={styles.gradient} />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
        </Column>
    )
}

export default PostListPlaceholder
