import React from 'react'
import PostCardPlaceholder from '@components/Cards/PostCard/PostCardPlaceholder'
// import { SpaceContext } from '../../contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePagePostsPlaceholder.module.scss'

const SpacePagePostsPlaceholder = (): JSX.Element => {
    return (
        <div className={styles.PHWall}>
            <div className={styles.PHWallGradientWrapper} />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
            <PostCardPlaceholder />
        </div>
    )
}

export default SpacePagePostsPlaceholder
