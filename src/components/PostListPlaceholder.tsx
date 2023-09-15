import Column from '@components/Column'
import Placeholder from '@components/cards/PostCard/Placeholder'
import styles from '@styles/components/ListPlaceholder.module.scss'
import React from 'react'

function PostListPlaceholder(): JSX.Element {
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
