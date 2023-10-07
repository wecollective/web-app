import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import styles from '@styles/components/modals/UserButtonModal.module.scss'
import { CommentIcon, PostIcon } from '@svgs/all'
import React from 'react'

function UserButtonModal(props: { user: any; transparent: boolean }): JSX.Element {
    const { user, transparent } = props
    const { handle, name, bio, flagImagePath, coverImagePath, totalPosts, totalComments } = user
    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    return (
        <Column centerX className={`${styles.modal} ${transparent && styles.transparent}`}>
            <div className={styles.coverImage} style={{ backgroundImage }} />
            <FlagImage
                className={styles.flagImage}
                size={80}
                type='user'
                imagePath={flagImagePath}
                outline
                shadow
            />
            <h1>{name}</h1>
            <h2>u/{handle}</h2>
            <Row centerY centerX style={{ marginBottom: 15 }}>
                <Row className={styles.stat}>
                    <PostIcon />
                    <p>{totalPosts}</p>
                </Row>
                <Row className={styles.stat}>
                    <CommentIcon />
                    <p>{totalComments}</p>
                </Row>
            </Row>
        </Column>
    )
}

export default UserButtonModal
