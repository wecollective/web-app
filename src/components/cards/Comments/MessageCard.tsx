/* eslint-disable no-nested-ternary */
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import Audios from '@components/cards/PostCard/Audios'
import Card from '@components/cards/PostCard/Card'
import EventCard from '@components/cards/PostCard/EventCard'
import Game from '@components/cards/PostCard/Game'
import Images from '@components/cards/PostCard/Images'
import PollCard from '@components/cards/PostCard/PollCard'
import Urls from '@components/cards/PostCard/Urls'
import DraftText from '@components/draft-js/DraftText'
import DeletePostModal from '@components/modals/DeletePostModal'
import EditPostModal from '@components/modals/EditPostModal'
import LikeModal from '@components/modals/LikeModal'
import RatingModal from '@components/modals/RatingModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import {
    Post,
    dateCreated,
    getDraftPlainText,
    getGameType,
    includesSpecificGame,
    timeSinceCreated,
    trimText,
} from '@src/Helpers'
import styles from '@styles/components/cards/Comments/MessageCard.module.scss'
import {
    DeleteIcon,
    EditIcon,
    LikeIcon,
    NeuronIcon,
    OpenIcon,
    ReplyIcon,
    VerticalEllipsisIcon,
    ZapIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'
import { GameStatusIndicator } from '../GameCard'
import MoveCard from '../MoveCard'

function MessageCard(props: {
    message: Post
    removeMessage: (message: any) => void
    setReplyParent: () => void
    emit: (event: string, data) => void
}): JSX.Element {
    const { message: messageData, emit, setReplyParent, removeMessage } = props
    const { loggedIn, accountData, updateDragItem, alert } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [message, setMessage] = useState(messageData)
    const {
        id,
        rootId,
        title,
        text,
        mediaTypes,
        state,
        totalLikes,
        totalRatings,
        totalLinks,
        createdAt,
        updatedAt,
        Creator,
        UrlBlocks,
        ImageBlocks,
        AudioBlocks,
        Event,
        Reactions = [],
        Parent,
        move,
    } = message
    const [visible, setVisible] = useState(false)
    const [accountReactions, setAccountReactions] = useState<any>({
        liked: !!Reactions.find((r) => r.type === 'like'),
        rated: !!Reactions.find((r) => r.type === 'rating'),
        linked: !!Reactions.find((r) => r.type === 'linked'),
    })
    const { liked, rated, linked } = accountReactions
    const [draggable, setDraggable] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [showMutedComment, setShowMutedComment] = useState(false)
    const isOwnComment = Creator.id === accountData.id
    const muted = accountData.id && accountData.mutedUsers.includes(Creator.id)
    const edited = createdAt !== updatedAt
    const cookies = new Cookies()
    const history = useNavigate()
    const fullWidth = mediaTypes.includes('audio') || mediaTypes.includes('url')
    const hasReactions = totalLikes || totalLinks || totalRatings

    function toggleLike() {
        setLikeLoading(true)
        if (loggedIn) {
            const data = { type: 'message', id } as any
            if (!liked) {
                data.rootId = rootId
                data.spaceId = window.location.pathname.includes('/s/') ? spaceData.id : null
            }
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/${liked ? 'remove' : 'add'}-like`, data, options)
                .then(() => {
                    setMessage({ ...message, totalLikes: totalLikes + (liked ? -1 : 1) })
                    setAccountReactions({ ...accountReactions, liked: !liked })
                    setLikeLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setLikeLoading(false)
            alert(`Log in to like messages`)
        }
    }

    function addDragEvents() {
        const messageCard = document.getElementById(`message-${id}`)
        messageCard?.addEventListener('dragstart', (e) => {
            e.stopPropagation()
            messageCard.classList.add(styles.dragging)
            updateDragItem({ type: 'message', data: message })
            const dragItem = document.getElementById('drag-item')
            e.dataTransfer?.setDragImage(dragItem!, 50, 50)
        })
        messageCard?.addEventListener('dragend', () => {
            messageCard.classList.remove(styles.dragging)
        })
    }

    function renderButtons() {
        return (
            <Row centerY className={styles.buttons}>
                <button type='button' onClick={() => setReplyParent()}>
                    <ReplyIcon style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button
                    type='button'
                    className={liked ? styles.red : ''}
                    disabled={likeLoading}
                    onClick={toggleLike}
                >
                    {likeLoading ? <LoadingWheel size={18} /> : <LikeIcon />}
                </button>
                <button
                    type='button'
                    className={linked ? styles.purple : ''}
                    onClick={() => history(`/linkmap?item=comment&id=${id}`)}
                >
                    <NeuronIcon />
                </button>
                <button
                    type='button'
                    className={rated ? styles.orange : ''}
                    onClick={() => setRatingModalOpen(true)}
                >
                    <ZapIcon />
                </button>
                <Link to={`/p/${id}`} title='Open post page'>
                    <OpenIcon style={{ width: 16, height: 16 }} />
                </Link>
                {isOwnComment && (
                    <button
                        type='button'
                        style={{ margin: 0 }}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <VerticalEllipsisIcon />
                    </button>
                )}
                {menuOpen && (
                    <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                        <Column className={styles.menu}>
                            <Column>
                                <button type='button' onClick={() => setEditModalOpen(true)}>
                                    <EditIcon />
                                    Edit
                                </button>
                                <button type='button' onClick={() => setDeleteModalOpen(true)}>
                                    <DeleteIcon />
                                    Delete
                                </button>
                            </Column>
                        </Column>
                    </CloseOnClickOutside>
                )}
            </Row>
        )
    }

    useEffect(() => setMessage(messageData), [messageData])

    useEffect(() => {
        setVisible(true)
        // addDragEvents()
    }, [])

    return (
        <Row
            className={`${styles.wrapper} ${visible && styles.visible} ${
                Creator.id === accountData.id && styles.isOwnComment
            } ${move && `${styles.move} ${styles[move.status]}`}`}
            style={{ marginBottom: hasReactions ? 10 : 0 }}
        >
            {isOwnComment && renderButtons()}
            {!isOwnComment && !move && (
                <Column style={{ marginRight: 10 }}>
                    <FlagImage type='user' size={30} imagePath={Creator.flagImagePath} />
                </Column>
            )}
            <Column
                className={styles.message}
                style={{ width: move ? undefined : fullWidth ? 'calc(100% - 100px)' : 'auto' }}
            >
                <Row className={styles.header}>
                    {!isOwnComment && !move && (
                        <>
                            {state === 'account-deleted' ? (
                                <p className='grey' style={{ marginRight: 5 }}>
                                    [Account deleted]
                                </p>
                            ) : (
                                <Link to={`/u/${Creator.handle}`} style={{ marginRight: 5 }}>
                                    <p style={{ fontWeight: 600 }}>{Creator.name}</p>
                                </Link>
                            )}
                        </>
                    )}
                    <p
                        title={`${dateCreated(createdAt)} ${
                            edited ? `(edited: ${dateCreated(updatedAt)})` : ''
                        }`}
                    >
                        {timeSinceCreated(createdAt)}
                    </p>
                    {edited && !move && <p className='grey'>*</p>}
                    {/* {muted && (
                            <button
                                type='button'
                                className={styles.muteButton}
                                title='Click to hide again'
                                onClick={() => setShowMutedComment(false)}
                            >
                                <EyeClosedIcon />
                            </button>
                        )} */}
                    {move && (
                        <>
                            <div style={{ flexGrow: 1 }} />
                            <div style={{ alignSelf: 'flex-end' }}>
                                <GameStatusIndicator
                                    status={move.status}
                                    style={{ marginLeft: 5, fontSize: 12 }}
                                />
                            </div>
                        </>
                    )}
                </Row>
                {Parent && (
                    <Column className={styles.parent}>
                        <h1>{Parent.Creator.name}</h1>
                        {Parent.text && <p>{trimText(getDraftPlainText(Parent.text), 300)}</p>}
                    </Column>
                )}
                <Column className={styles.content}>
                    {title && <h1 style={{ margin: 0 }}>{title}</h1>}
                    <DraftText
                        text={state === 'deleted' ? '[message deleted]' : text}
                        markdownStyles={`${styles.markdown} ${
                            state === 'deleted' && styles.deleted
                        }`}
                    />
                    {mediaTypes.includes('url') && (
                        <Urls
                            key={updatedAt}
                            postId={id}
                            urlBlocks={UrlBlocks?.map((block) => {
                                return { ...block.Post, Url: block.Post.MediaLink.Url }
                            })}
                            style={{ margin: '10px 0' }}
                        />
                    )}
                    {mediaTypes.includes('image') && (
                        <Images
                            postId={id}
                            imageBlocks={ImageBlocks?.map((block) => {
                                return { ...block.Post, Image: block.Post.MediaLink.Image }
                            })}
                            style={{ margin: '10px 0' }}
                        />
                    )}
                    {mediaTypes.includes('audio') && (
                        <Audios
                            postId={id}
                            audioBlocks={AudioBlocks?.map((block) => {
                                return { ...block.Post, Audio: block.Post.MediaLink.Audio }
                            })}
                            style={{ margin: '10px 0' }}
                        />
                    )}
                    {Event && (
                        <EventCard post={message} location='message' style={{ marginTop: 10 }} />
                    )}
                    {mediaTypes.includes('poll') && (
                        <PollCard
                            postData={message}
                            location='message'
                            style={{ minWidth: 600, marginTop: 10 }}
                        />
                    )}
                    {includesSpecificGame(mediaTypes) && (
                        <Game
                            type={getGameType(mediaTypes)}
                            postId={id}
                            setTopicImage={() => null}
                            isOwnPost={Creator.id === accountData.id}
                            style={{ marginTop: 10 }}
                        />
                    )}
                    {mediaTypes.includes('card') && (
                        <Card postId={id} style={{ minWidth: 600, marginTop: 10 }} />
                    )}
                    {move && <MoveCard post={message} emit={emit} />}
                </Column>
                <Row className={styles.reactions}>
                    {totalLikes > 0 && (
                        <button
                            type='button'
                            className={styles.red}
                            onClick={() => setLikeModalOpen(true)}
                        >
                            <LikeIcon />
                            {totalLikes > 1 && <p>{totalLikes}</p>}
                        </button>
                    )}
                    {totalLinks > 0 && (
                        <button
                            type='button'
                            className={styles.purple}
                            onClick={() => history(`/linkmap?item=comment&id=${id}`)}
                        >
                            <NeuronIcon />
                            {totalLinks > 1 && <p>{totalLinks}</p>}
                        </button>
                    )}
                    {totalRatings > 0 && (
                        <button
                            type='button'
                            className={styles.orange}
                            onClick={() => setRatingModalOpen(true)}
                        >
                            <ZapIcon />
                            {totalRatings > 1 && <p>{totalRatings}</p>}
                        </button>
                    )}
                </Row>
            </Column>
            {!isOwnComment && renderButtons()}
            <Column className={`message-${id}-drag-disabled`} style={{ cursor: 'default' }}>
                {likeModalOpen && (
                    <LikeModal
                        itemType='message'
                        itemData={{ ...message, liked: accountReactions.liked }}
                        updateItem={() => {
                            setMessage({
                                ...message,
                                totalLikes: totalLikes + (liked ? -1 : 1),
                            })
                            setAccountReactions({ ...accountReactions, liked: !liked })
                        }}
                        close={() => setLikeModalOpen(false)}
                    />
                )}
                {ratingModalOpen && (
                    <RatingModal
                        itemType='message'
                        itemData={{ ...message, rated: accountReactions.rated }}
                        updateItem={() => {
                            setMessage({
                                ...message,
                                totalRatings: totalRatings + (rated ? -1 : 1),
                            })
                            setAccountReactions({ ...accountReactions, rated: !rated })
                        }}
                        close={() => setRatingModalOpen(false)}
                    />
                )}
                {editModalOpen && (
                    <EditPostModal
                        post={message}
                        setPost={(newComment) => setMessage(newComment)}
                        close={() => setEditModalOpen(false)}
                    />
                )}
                {deleteModalOpen && (
                    <DeletePostModal
                        post={message}
                        onDelete={() => removeMessage(message)}
                        close={() => setDeleteModalOpen(false)}
                    />
                )}
            </Column>
        </Row>
    )
}

// MessageCard.defaultProps = {
//     highlighted: false,
// }

export default MessageCard
