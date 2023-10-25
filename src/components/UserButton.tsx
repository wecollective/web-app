import FlagImage from '@components/FlagImage'
import UserButtonModal from '@components/modals/UserButtonModal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { trimText } from '@src/Helpers'
import styles from '@styles/components/UserButton.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

function UserButton(props: {
    user: any
    imageSize?: number
    fontSize?: number
    maxChars?: number
    style?: any
    className?: any
}): JSX.Element {
    const { user, imageSize, fontSize, maxChars, style, className } = props
    const { id, handle, name, flagImagePath, coverImagePath, state } = user
    const { updateDragItem } = useContext(AccountContext)
    const [showModal, setShowModal] = useState(false)
    const [transparent, setTransparent] = useState(true)
    const [modalData, setModalData] = useState({
        bio: '',
        totalPosts: 0,
        totalComments: 0,
    })
    const mouseOver = useRef(false)
    const buttonId = uuidv4()
    const hoverDelay = 500
    const text = state === 'deleted' ? `[user deleted]` : name
    const color = state === 'deleted' ? '#acacae' : ''

    function onMouseEnter() {
        updateDragItem({ type: 'user', data: user })
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

    useEffect(() => {
        // attach dragstart listener
        const button = document.getElementById(buttonId)
        if (button) {
            button.addEventListener('dragstart', (e) => {
                e.stopPropagation()
                const dragItem = document.getElementById('drag-item')
                e.dataTransfer?.setDragImage(dragItem!, 50, 50)
                onMouseLeave()
            })
        }
        // preload cover image
        if (coverImagePath) {
            const imageId = `preload-cover-user-${id}`
            if (!document.getElementById(imageId)) {
                const div = document.createElement('div')
                div.id = imageId
                div.style.background = `url(${coverImagePath})`
                div.style.width = '20px'
                div.style.height = '20px'
                const container = document.getElementById('preloaded-images')
                container?.appendChild(div)
            }
        }
    }, [])

    return (
        <Link
            to={`/u/${handle}`}
            id={buttonId}
            className={`${styles.wrapper} ${className}`}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            draggable
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
