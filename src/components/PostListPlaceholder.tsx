import PostCardPlaceholder from '@components/cards/PostCard/PostCardPlaceholder'
import Column from '@components/Column'
import styles from '@styles/components/ListPlaceholder.module.scss'
import React from 'react'

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
