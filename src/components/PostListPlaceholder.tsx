import React from 'react'
import styles from '@styles/components/ListPlaceholder.module.scss'
import Column from '@components/Column'
import PostCardPlaceholder from '@components/cards/PostCard/PostCardPlaceholder'

const PostListPlaceholder = (): JSX.Element => {
    return (
        <Column className={styles.wrapper}>
            <div className={styles.gradient} />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
        </Column>
    )
}

export default PostListPlaceholder
