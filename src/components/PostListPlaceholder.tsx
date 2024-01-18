import Column from '@components/Column'
import Placeholder from '@components/cards/PostCard/Placeholder'
import styles from '@styles/components/ListPlaceholder.module.scss'
import React from 'react'

function PostListPlaceholder(props: { id: string }): JSX.Element {
    const { id } = props
    return (
        <Column className={styles.wrapper} id={id}>
            {/* <div className={styles.gradient} /> */}
            <Placeholder />
            <Placeholder />
            <Placeholder />
            <Placeholder />
            <Placeholder />
            <Placeholder />
        </Column>
    )
}

export default PostListPlaceholder
