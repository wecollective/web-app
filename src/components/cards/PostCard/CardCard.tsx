import Column from '@components/Column'
import Row from '@components/Row'
import DraftText from '@components/draft-js/DraftText'
import LinkModal from '@src/components/cards/PostCard/Modals/LinkModal'
import LikeModal from '@src/components/modals/LikeModal'
import styles from '@styles/components/cards/PostCard/CardCard.module.scss'
import { LikeIcon, LinkIcon, RepostIcon } from '@svgs/all'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function CardCard(props: { postData: any; setPostData: (data: any) => void }): JSX.Element {
    const { postData, setPostData } = props
    const [cardFocused, setCardFocused] = useState(false)
    const [cardRotating, setCardRotating] = useState(false)
    const [cardFlipped, setCardFlipped] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const cardFront = postData.CardSides.find((s) => s.type === 'card-front')
    const cardBack = postData.CardSides.find((s) => s.type === 'card-back')
    const card = cardFlipped ? cardBack : cardFront

    function rotateCard() {
        setCardRotating(true)
        setTimeout(() => {
            setCardFlipped(!cardFlipped)
            setCardRotating(false)
        }, 500)
    }

    function setCardData(newCardData) {
        const newPostData = { ...postData }
        newPostData.CardSides = newPostData.CardSides.filter(
            (s) => s.type !== `card-${cardFlipped ? 'back' : 'front'}`
        )
        newPostData.CardSides.push(newCardData)
        setPostData(newPostData)
    }

    function renderCardFace() {
        return (
            <Column centerY className={styles.cardContent}>
                {card.Images[0] && (
                    <img
                        src={card.Images[0].url}
                        alt='background'
                        style={{ opacity: card.watermark ? 0.3 : 1 }}
                    />
                )}
                <button
                    type='button'
                    aria-label='click to focus'
                    onClick={() => setCardFocused(!cardFocused)}
                />
                {card.text && <DraftText stringifiedDraft={card.text} />}
            </Column>
        )
    }

    return (
        <Column centerX className={styles.wrapper}>
            <Column
                centerX
                className={`${styles.card} ${cardRotating && styles.rotating} ${
                    cardFocused && styles.focused
                }`}
            >
                {renderCardFace()}
            </Column>
            <Column spaceBetween className={styles.icons}>
                <Column>
                    <Link to={`/p/${card.id}`} title='Open post page' style={{ marginBottom: 10 }}>
                        <Row centerX>
                            <p className='grey'>ID:</p>
                            <p style={{ marginLeft: 5 }}>{card.id}</p>
                        </Row>
                    </Link>
                    <button type='button' title='Click to rotate' onClick={rotateCard}>
                        <Row centerY>
                            <RepostIcon />
                            <p>Flip</p>
                        </Row>
                    </button>
                </Column>
                <button
                    type='button'
                    className={card.accountLike && styles.blue}
                    onClick={() => setLikeModalOpen(true)}
                >
                    <Row centerY>
                        <LikeIcon />
                        <p>{card.totalLikes}</p>
                    </Row>
                </button>
                <button
                    type='button'
                    className={card.accountLink && styles.blue}
                    onClick={() => setLinkModalOpen(true)}
                >
                    <Row centerY>
                        <LinkIcon />
                        <p>{card.totalLinks}</p>
                    </Row>
                </button>
            </Column>
            {likeModalOpen && (
                <LikeModal
                    itemType='post'
                    itemData={card}
                    updateItem={(addingLike) => {
                        setCardData({
                            ...card,
                            totalLikes: card.totalLikes + (addingLike ? 1 : -1),
                            accountLike: addingLike,
                        })
                    }}
                    close={() => setLikeModalOpen(false)}
                />
            )}
            {linkModalOpen && (
                <LinkModal
                    type='card'
                    location='space-posts'
                    postId={postData.id}
                    postData={card}
                    setPostData={setCardData}
                    close={() => setLinkModalOpen(false)}
                />
            )}
        </Column>
    )
}

export default CardCard
