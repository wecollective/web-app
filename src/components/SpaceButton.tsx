import FlagImage from '@components/FlagImage'
import SpaceButtonModal from '@components/modals/SpaceButtonModal'
import config from '@src/Config'
import styles from '@styles/components/UserButton.module.scss'
import axios from 'axios'
import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function SpaceButton(props: {
    space: any
    imageSize?: number
    fontSize?: number
    style?: any
    className?: any
    onClick: () => void
}): JSX.Element {
    const { space, imageSize, fontSize, style, className, onClick } = props
    const { id, handle, name, flagImagePath, state } = space
    const [showModal, setShowModal] = useState(false)
    const [transparent, setTransparent] = useState(true)
    const [modalData, setModalData] = useState({
        description: '',
        coverImagePath: '',
        totalPostLikes: 0,
        totalPosts: 0,
        totalComments: 0,
        totalFollowers: 0,
    })
    const mouseOver = useRef(false)
    const hoverDelay = 500
    const text = state === 'deleted' ? `[space deleted]` : name
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

    return (
        <Link
            to={`/s/${handle}`}
            className={`${styles.wrapper} ${className}`}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            <FlagImage type='space' size={imageSize!} imagePath={flagImagePath} />
            <p style={{ fontSize, color }}>{text}</p>
            {showModal && (
                <SpaceButtonModal space={{ ...space, ...modalData }} transparent={transparent} />
            )}
        </Link>
    )
}

SpaceButton.defaultProps = {
    imageSize: 30,
    fontSize: 14,
    style: null,
    className: null,
}

export default SpaceButton
