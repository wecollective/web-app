import Column from '@components/Column'
import Placeholder from '@src/components/cards/PostCard/Placeholder'
import styles from '@styles/components/ListPlaceholder.module.scss'
import React from 'react'

const PostListPlaceholder = (): JSX.Element => {
    return (
        <Column className={styles.wrapper}>
            <div className={styles.gradient} />
            <Placeholder />
            <Placeholder />
            <Placeholder />
        </Column>
    )
}

export default PostListPlaceholder
