import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import config from '@src/Config'
import styles from '@styles/components/UserButton.module.scss'
import { CommentIcon, PostIcon } from '@svgs/all'
import axios from 'axios'
import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function UserButton(props: {
    user: any
    imageSize?: number
    fontSize?: number
    style?: any
    className?: any
}): JSX.Element {
    const { user, imageSize, fontSize, style, className } = props
    const { id, handle, name, flagImagePath, state } = user
    const [showModal, setShowModal] = useState(false)
    const [transparent, setTransparent] = useState(true)
    const [modalData, setModalData] = useState({
        coverImagePath: '',
        totalPosts: 0,
        totalComments: 0,
    })
    const { coverImagePath, totalPosts, totalComments } = modalData
    const mouseOver = useRef(false)
    const hoverDelay = 500
    const text = state === 'deleted' ? `[user deleted]` : name
    const color = state === 'deleted' ? '#acacae' : ''
    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    function onMouseEnter() {
        // start hover delay
        mouseOver.current = true
        setTimeout(() => {
            if (mouseOver.current) {
                setShowModal(true)
                setTimeout(() => {
                    if (mouseOver.current) setTransparent(false)
                }, 200)
            }
        }, hoverDelay)
        // get modal data
        axios
            .get(`${config.apiURL}/user-modal-data?userId=${id}`)
            .then((res) => setModalData(res.data))
            .catch((error) => console.log(error))
    }

    function onMouseLeave() {
        mouseOver.current = false
        setTransparent(true)
        setTimeout(() => {
            if (!mouseOver.current) setShowModal(false)
        }, hoverDelay)
    }

    return (
        <Link
            to={`/u/${handle}`}
            className={`${styles.wrapper} ${className}`}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <FlagImage type='user' size={imageSize!} imagePath={flagImagePath} />
            <p style={{ fontSize, color }}>{text}</p>
            {showModal && (
                <Column centerX className={`${styles.modal} ${transparent && styles.transparent}`}>
                    <div className={styles.coverImage} style={{ backgroundImage }} />
                    <FlagImage
                        className={styles.flagImage}
                        size={80}
                        type='user'
                        imagePath={user.flagImagePath}
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
            )}
        </Link>
    )
}

UserButton.defaultProps = {
    imageSize: 30,
    fontSize: 14,
    style: null,
    className: null,
}

export default UserButton
