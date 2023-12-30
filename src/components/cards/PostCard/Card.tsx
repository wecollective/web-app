import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import DraftText from '@components/draft-js/DraftText'
import LikeModal from '@components/modals/LikeModal'
import config from '@src/Config'
import styles from '@styles/components/cards/PostCard/Card.module.scss'
import { LikeIcon, LinkIcon, RepostIcon } from '@svgs/all'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// todo: handle like updates
function Card(props: { postId: any; style?: any }): JSX.Element {
    const { postId, style } = props
    const [loading, setLoading] = useState(true)
    const [blocks, setBlocks] = useState<any[]>([])
    const [cardFocused, setCardFocused] = useState(false)
    const [cardRotating, setCardRotating] = useState(false)
    const [cardFlipped, setCardFlipped] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const cardFront = blocks.find((b) => b.Link.index === 0) || { id: 0 }
    const cardBack = blocks.find((b) => b.Link.index === 1) || { id: 0 }
    const card = cardFlipped ? cardBack : cardFront
    const history = useNavigate()

    function getCardFaces() {
        axios
            .get(`${config.apiURL}/card-faces?postId=${postId}`)
            .then((res) => {
                console.log('card-faces: ', res.data)
                setBlocks(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function rotateCard() {
        setCardRotating(true)
        setTimeout(() => {
            setCardFlipped(!cardFlipped)
            setCardRotating(false)
        }, 500)
    }

    // function setCardData(newCardData) {
    //     const newPostData = { ...postData }
    //     newPostData.CardSides = newPostData.CardSides.filter(
    //         (s) => s.type !== `card-${cardFlipped ? 'back' : 'front'}`
    //     )
    //     newPostData.CardSides.push(newCardData)
    //     setPostData(newPostData)
    // }

    function renderCardFace(side) {
        const data = side === 'front' ? cardFront : cardBack
        const faceUp = side === 'front' ? !cardFlipped : cardFlipped
        return (
            <Column centerY className={`${styles.cardContent} ${faceUp && styles.visible}`}>
                {data.Blocks[0] && data.Blocks[0].Image && (
                    <img
                        src={data.Blocks[0].Image.url}
                        alt='background'
                        style={{ opacity: data.watermark ? 0.3 : 1 }}
                    />
                )}
                <button
                    type='button'
                    aria-label='click to focus'
                    onClick={() => setCardFocused(!cardFocused)}
                />
                {data.text && <DraftText text={data.text} />}
            </Column>
        )
    }

    useEffect(() => getCardFaces(), [])

    if (loading)
        return (
            <Column centerX style={style}>
                <LoadingWheel size={30} style={{ margin: 20 }} />
            </Column>
        )

    return (
        <Column centerX className={styles.wrapper}>
            <Row centerY className={styles.smallScreenHeader} style={{ marginBottom: 10 }}>
                <Link to={`/p/${card.id}`} title='Open post page' style={{ marginRight: 20 }}>
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
            </Row>
            <Column
                centerX
                className={`${styles.card} ${cardRotating && styles.rotating} ${
                    cardFocused && styles.focused
                }`}
            >
                {renderCardFace('front')}
                {renderCardFace('back')}
            </Column>
            <Column spaceBetween className={styles.largeScreenIcons}>
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
                    onClick={() => history(`/linkmap?item=post&id=${card.id}`)}
                >
                    <Row centerY>
                        <LinkIcon />
                        <p>{card.totalLinks}</p>
                    </Row>
                </button>
            </Column>
            <Row className={styles.smallScreenIcons} style={{ marginTop: 10 }}>
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
                    onClick={() => history(`/linkmap?item=post&id=${card.id}`)}
                >
                    <Row centerY>
                        <LinkIcon />
                        <p>{card.totalLinks}</p>
                    </Row>
                </button>
            </Row>
            {likeModalOpen && (
                <LikeModal
                    itemType='post'
                    itemData={card}
                    updateItem={() => {
                        // setCardData({
                        //     ...card,
                        //     totalLikes: card.totalLikes + (card.accountLike ? -1 : 1),
                        //     accountLike: !card.accountLike,
                        // })
                    }}
                    close={() => setLikeModalOpen(false)}
                />
            )}
        </Column>
    )
}

Card.defaultProps = {
    style: null,
}

export default Card
