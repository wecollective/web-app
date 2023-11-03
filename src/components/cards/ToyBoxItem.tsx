/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import MediumSquareCard from '@components/cards/MediumSquareCard'
import BeadCard from '@components/cards/PostCard/BeadCard'
import { AccountContext } from '@contexts/AccountContext'
import { getDraftPlainText, postTypeIcons, trimText } from '@src/Helpers'
import styles from '@styles/components/cards/ToyBoxItem.module.scss'
import { AudioWaveIcon, CommentIcon, PostIcon, SpacesIcon, UserIcon } from '@svgs/all'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ToyBoxItem(props: {
    type: 'space' | 'user' | 'post' | 'comment'
    data: any
    dragImage?: boolean
    style?: any
    className?: string
}): JSX.Element {
    const { type, data, dragImage, style, className } = props
    const { updateDragItem } = useContext(AccountContext)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalPosition, setModalPosition] = useState<any>(null)
    const history = useNavigate()
    const id = `${type}-${data.id}`
    const itemId = `${dragImage ? 'drag-image' : 'tbi'}-${id}`
    let text = ''
    if (data.title) text = trimText(data.title, 20)
    else if (data.text) text = trimText(getDraftPlainText(data.text), 20)
    let image = ''
    if (!text && type === 'post') {
        if (data.type.includes('image')) image = data.Images[0].url
        if (data.type.includes('url')) image = data.Urls[0].image
    }

    const backgroundImage = data.coverImagePath
        ? `url(${data.coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    const cardImage = data.type === 'card' && data.CardSides[0].Images[0]

    function findTypeIcon(option) {
        return postTypeIcons[option] || null
    }

    useEffect(() => {
        const toyboxItem = document.getElementById(itemId)
        if (toyboxItem) {
            toyboxItem.addEventListener('dragover', (e) => e.preventDefault())
            toyboxItem.addEventListener('dragstart', (e) => {
                toyboxItem.classList.add(styles.dragging)
                updateDragItem({ type, data, fromToyBox: true })
                const dragItem = document.getElementById('drag-item')
                e.dataTransfer?.setDragImage(dragItem!, 50, 50)
            })
            toyboxItem.addEventListener('dragend', () => {
                toyboxItem.classList.remove(styles.dragging)
            })
        }
    }, [])

    useEffect(() => {
        if (modalOpen) {
            // find fixed position for modal to avoid overflow hidden
            const element = document.getElementById(itemId)
            if (element) {
                const position = element.getBoundingClientRect()
                setModalPosition({ top: position.top - 320, left: position.left - 100 })
            }
        } else setModalPosition(null)
    }, [modalOpen])

    if (data.state === 'deleted' || data.state === 'removed-by-mod')
        return (
            <Column
                id={itemId}
                className={`${styles.wrapper} ${styles.deleted}`}
                style={style}
                centerX
                centerY
                draggable
            >
                <p>[{type} deleted]</p>
            </Column>
        )
    return (
        <CloseOnClickOutside onClick={() => setModalOpen(false)}>
            <Column
                id={itemId}
                className={`${styles.wrapper} ${className}`}
                style={style}
                draggable
            >
                <div className={styles.overlay} />
                <div
                    role='button'
                    className={styles.button}
                    onClick={() => setModalOpen(!modalOpen)}
                    aria-label={`Navigate to ${type}`}
                />
                {['post', 'comment'].includes(type) ? (
                    <Column className={styles.item}>
                        <Row spaceBetween centerY className={styles.header}>
                            {type === 'comment' ? <CommentIcon /> : <PostIcon />}
                            <FlagImage
                                type='user'
                                imagePath={data.Creator.flagImagePath}
                                size={18}
                                style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
                            />
                        </Row>
                        <Column centerX centerY className={styles.center}>
                            {text && <p>{text}</p>}
                            {image && <div style={{ backgroundImage: `url(${image})` }} />}
                            {data.type === 'audio' && !text && <AudioWaveIcon />}
                            {data.type === 'card' && !text && cardImage && (
                                <img src={cardImage.url} alt='card front' />
                            )}
                        </Column>
                        <Row spaceBetween className={styles.footer}>
                            {findTypeIcon(data.type)}
                            <div />
                        </Row>
                    </Column>
                ) : (
                    <Column centerX className={styles.agent}>
                        <div className={styles.coverImage} style={{ backgroundImage }} />
                        <FlagImage
                            className={styles.flagImage}
                            type='user'
                            imagePath={data.flagImagePath}
                            size={60}
                            outline={3}
                            style={{ boxShadow: `0 0 10px rgba(0, 0, 0, 0.2)` }}
                        />
                        <Row centerY className={styles.footer}>
                            {type === 'space' ? <SpacesIcon /> : <UserIcon />}
                            <p>{trimText(data.handle, 8)}</p>
                        </Row>
                    </Column>
                )}
                {modalPosition && (
                    <Column
                        className={styles.modal}
                        style={{ top: modalPosition.top, left: modalPosition.left }}
                    >
                        {['post'].includes(type) && (
                            <BeadCard bead={data} location='link-modal' className={styles.bead} />
                        )}
                        {['user', 'space'].includes(type) && (
                            <MediumSquareCard
                                type={type}
                                data={data}
                                onClick={() => {
                                    history(`/${type[0]}/${data.handle}`)
                                    setModalOpen(false)
                                }}
                            />
                        )}
                    </Column>
                )}
            </Column>
        </CloseOnClickOutside>
    )
}

ToyBoxItem.defaultProps = {
    dragImage: false,
    style: null,
    className: '',
}

export default ToyBoxItem
