import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import styles from '@styles/components/modals/ButtonModal.module.scss'
import { CommentIcon, PostIcon } from '@svgs/all'
import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

function UserButtonModal(props: { user: any; transparent: boolean }): JSX.Element {
    const { user, transparent } = props
    const { handle, name, bio, flagImagePath, coverImagePath, totalPosts, totalComments } = user
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const { top, left } = position
    const id = uuidv4()
    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    useEffect(() => {
        // find fixed position for modal to avoid overflow hidden
        const element = document.getElementById(id)
        if (element) setPosition(element.getBoundingClientRect())
    }, [])

    return (
        <Column id={id} className={`${styles.wrapper} ${transparent && styles.transparent}`}>
            <Column centerX className={styles.modal} style={{ top, left }}>
                <div className={styles.coverImage} style={{ backgroundImage }} />
                <FlagImage
                    className={styles.flagImage}
                    size={80}
                    type='user'
                    imagePath={flagImagePath}
                    outline={4}
                    style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
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
        </Column>
    )
}

export default UserButtonModal
