import FlagImage from '@components/FlagImage'
import SpaceButtonModal from '@components/modals/SpaceButtonModal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { trimText } from '@src/Helpers'
import styles from '@styles/components/UserButton.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

function SpaceButton(props: {
    space: any
    imageSize?: number
    fontSize?: number
    shadow?: boolean
    maxChars?: number
    style?: any
    className?: any
    onClick?: () => void
}): JSX.Element {
    const { space, imageSize, fontSize, shadow, maxChars, style, className, onClick } = props
    const { id, handle, name, flagImagePath, coverImagePath, state } = space
    const { updateDragItem, setDropModalOpen, setDropLocation, dragItemRef } =
        useContext(AccountContext)
    const [showModal, setShowModal] = useState(false)
    const [transparent, setTransparent] = useState(true)
    const [modalData, setModalData] = useState({
        description: '',
        totalPostLikes: 0,
        totalPosts: 0,
        totalComments: 0,
        totalFollowers: 0,
    })
    const buttonId = uuidv4()
    const mouseOver = useRef(false)
    const hoverDelay = 500
    const text = state === 'deleted' ? `[space deleted]` : name
    const color = state === 'deleted' ? '#acacae' : ''
    const location = useLocation()
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const { lens } = urlParams

    function findURL() {
        // include subpage and params if clicked from nav list on space list
        const subPage = location.pathname.split('/')[3]
        const params = subPage === 'spaces' && lens && lens === 'List' ? '/spaces?lens=List' : ''
        return `/s/${handle}${params}`
    }

    function onMouseEnter() {
        updateDragItem({ type: 'space', data: space })
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
            .get(`${config.apiURL}/space-modal-data?spaceId=${id}`)
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
            button.addEventListener('dragover', (e) => e.preventDefault())
            button.addEventListener('drop', (e) => {
                e.stopPropagation()
                const { type, data, fromToyBox } = dragItemRef.current
                if (type === 'post' && data.state === 'visible' && fromToyBox) {
                    setDropLocation({ type: 'space', data: space })
                    setDropModalOpen(true)
                }
            })
        }
        // preload cover image
        if (coverImagePath) {
            const imageId = `preload-cover-space-${id}`
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
            to={findURL()}
            id={buttonId}
            className={`${styles.wrapper} ${className}`}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            <FlagImage
                type='space'
                size={imageSize!}
                imagePath={flagImagePath}
                style={{ boxShadow: shadow ? `0 0 5px rgba(0, 0, 0, 0.1)` : '' }}
            />
            <p style={{ fontSize, color }}>{maxChars ? trimText(text, maxChars) : text}</p>
            {showModal && (
                <SpaceButtonModal space={{ ...space, ...modalData }} transparent={transparent} />
            )}
        </Link>
    )
}

SpaceButton.defaultProps = {
    imageSize: 30,
    fontSize: 14,
    shadow: false,
    maxChars: null,
    style: null,
    className: null,
    onClick: null,
}

export default SpaceButton
