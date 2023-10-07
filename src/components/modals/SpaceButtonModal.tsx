import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import styles from '@styles/components/modals/ButtonModal.module.scss'
import { CommentIcon, LikeIcon, PostIcon, UsersIcon } from '@svgs/all'
import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

function SpaceButtonModal(props: { space: any; transparent: boolean }): JSX.Element {
    const { space, transparent } = props
    const {
        handle,
        name,
        description,
        flagImagePath,
        coverImagePath,
        totalPostLikes,
        totalPosts,
        totalComments,
        totalFollowers,
    } = space
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
                    type='space'
                    imagePath={flagImagePath}
                    outline
                    shadow
                />
                <h1>{name}</h1>
                <h2>s/{handle}</h2>
                <Row centerY centerX style={{ marginBottom: 15 }}>
                    <Row className={styles.stat}>
                        <PostIcon />
                        <p>{totalPosts}</p>
                    </Row>
                    <Row className={styles.stat}>
                        <CommentIcon />
                        <p>{totalComments}</p>
                    </Row>
                    <Row className={styles.stat}>
                        <LikeIcon />
                        <p>{totalPostLikes}</p>
                    </Row>
                    <Row className={styles.stat}>
                        <UsersIcon />
                        <p>{totalFollowers}</p>
                    </Row>
                </Row>
            </Column>
        </Column>
    )
}

export default SpaceButtonModal
