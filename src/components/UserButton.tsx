import FlagImage from '@components/FlagImage'
import UserButtonModal from '@components/modals/UserButtonModal'
import config from '@src/Config'
import { trimText } from '@src/Helpers'
import styles from '@styles/components/UserButton.module.scss'
import axios from 'axios'
import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function UserButton(props: {
    user: any
    imageSize?: number
    fontSize?: number
    maxChars?: number
    style?: any
    className?: any
}): JSX.Element {
    const { user, imageSize, fontSize, maxChars, style, className } = props
    const { id, handle, name, flagImagePath, state } = user
    const [showModal, setShowModal] = useState(false)
    const [transparent, setTransparent] = useState(true)
    const [modalData, setModalData] = useState({
        bio: '',
        coverImagePath: '',
        totalPosts: 0,
        totalComments: 0,
    })
    const mouseOver = useRef(false)
    const hoverDelay = 500
    const text = state === 'deleted' ? `[user deleted]` : name
    const color = state === 'deleted' ? '#acacae' : ''

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
            <p style={{ fontSize, color }}>{maxChars ? trimText(text, maxChars) : text}</p>
            {showModal && (
                <UserButtonModal user={{ ...user, ...modalData }} transparent={transparent} />
            )}
        </Link>
    )
}

UserButton.defaultProps = {
    imageSize: 30,
    fontSize: 14,
    maxChars: null,
    style: null,
    className: null,
}

export default UserButton
