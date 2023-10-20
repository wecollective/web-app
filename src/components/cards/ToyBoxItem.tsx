import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { getDraftPlainText, postTypeIcons, trimText } from '@src/Helpers'
import styles from '@styles/components/cards/ToyBoxItem.module.scss'
import { CommentIcon, PostIcon, SpacesIcon, UserIcon } from '@svgs/all'
import React, { useContext, useEffect } from 'react'

function ToyBoxItem(props: {
    type: 'space' | 'user' | 'post' | 'bead' | 'comment'
    data: any
    style?: any
    className?: string
}): JSX.Element {
    const { type, data, style, className } = props
    const { dragItemRef, setDragItem } = useContext(AccountContext)
    const itemId = `${type}-${data.id}`
    let text = ''
    if (data.title) text = trimText(data.title, 20)
    else if (data.text) text = trimText(getDraftPlainText(data.text), 20)
    let image = ''
    if (!text && ['post', 'bead'].includes(type)) {
        if (data.type.includes('image')) image = data.Images[0].url
        if (data.type.includes('url')) image = data.Urls[0].image
    }

    const backgroundImage = data.coverImagePath
        ? `url(${data.coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'
    function findTypeIcon(option) {
        return postTypeIcons[option] || null
    }

    useEffect(() => {
        const beadCard = document.getElementById(itemId)
        if (beadCard) {
            beadCard.addEventListener('dragover', (e) => e.preventDefault())
            beadCard.addEventListener('dragstart', (e) => {
                beadCard.classList.add(styles.dragging)
                setDragItem({ type, data })
                dragItemRef.current = { type, data }
                const dragItem = document.getElementById('drag-item')
                e.dataTransfer?.setDragImage(dragItem!, 50, 50)
            })
            beadCard.addEventListener('dragend', () => {
                beadCard.classList.remove(styles.dragging)
            })
        }
    }, [])

    return (
        <Column id={itemId} className={`${styles.wrapper} ${className}`} style={style} draggable>
            {['post', 'bead', 'comment'].includes(type) ? (
                <Column className={styles.item}>
                    <Row spaceBetween centerY>
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
                        {image && <img src={image} alt='' />}
                    </Column>
                    <Row spaceBetween>
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
        </Column>
    )
}

ToyBoxItem.defaultProps = {
    style: null,
    className: '',
}

export default ToyBoxItem
