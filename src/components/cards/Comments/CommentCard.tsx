import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import EditCommentModal from '@components/cards/Comments/EditCommentModal'
import DraftText from '@components/draft-js/DraftText'
import DeleteCommentModal from '@components/modals/DeleteCommentModal'
import LikeModal from '@components/modals/LikeModal'
import RatingModal from '@components/modals/RatingModal'
import UserButtonModal from '@components/modals/UserButtonModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/Comments/CommentCard.module.scss'
import {
    DeleteIcon,
    EditIcon,
    EyeClosedIcon,
    LikeIcon,
    LinkIcon,
    ReplyIcon,
    VerticalEllipsisIcon,
    ZapIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function CommentCard(props: {
    comment: any
    highlighted: boolean
    location: string
    toggleReplyInput: () => void
    removeComment: (comment: any) => void
    editComment: (comment: any, newText: string) => void
    updateCommentReactions: (commentId: number, reactionType: string, increment: boolean) => void
}): JSX.Element {
    const {
        comment,
        highlighted,
        location,
        toggleReplyInput,
        removeComment,
        editComment,
        updateCommentReactions,
    } = props
    const {
        id,
        itemId,
        text,
        state,
        totalLikes,
        totalReposts,
        totalRatings,
        totalLinks,
        totalGlassBeadGames,
        accountLike,
        accountRating,
        accountLink,
        createdAt,
        updatedAt,
        Creator,
    } = comment

    const { loggedIn, accountData, updateDragItem, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [menuOpen, setMenuOpen] = useState(false)
    const [editCommentModalOpen, setEditCommentModalOpen] = useState(false)
    const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [showMutedComment, setShowMutedComment] = useState(false)
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
    const isOwnComment = Creator.id === accountData.id
    const muted = accountData.id && accountData.mutedUsers.includes(Creator.id)
    const history = useNavigate()
    const cookies = new Cookies()

    function toggleLike() {
        setLikeLoading(true)
        if (loggedIn) {
            const data = { itemType: 'comment', itemId: id } as any
            if (!accountLike) {
                data.accountHandle = accountData.handle
                data.accountName = accountData.name
                data.parentItemId = itemId
                data.spaceId = window.location.pathname.includes('/s/') ? spaceData.id : null
            }
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/${accountLike ? 'remove' : 'add'}-like`, data, options)
                .then(() => {
                    updateCommentReactions(comment, 'Like', !accountLike)
                    setLikeLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setLikeLoading(false)
            setAlertMessage(`Log in to like comments`)
            setAlertModalOpen(true)
        }
    }

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
            .get(`${config.apiURL}/user-modal-data?userId=${Creator.id}`)
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
        const commentCard = document.getElementById(`comment-${id}`)
        if (commentCard) {
            commentCard.addEventListener('dragstart', (e) => {
                e.stopPropagation()
                commentCard.classList.add(styles.dragging)
                updateDragItem({ type: 'comment', data: comment })
                const dragItem = document.getElementById('drag-item')
                e.dataTransfer?.setDragImage(dragItem!, 50, 50)
            })
            commentCard.addEventListener('dragend', () => {
                commentCard.classList.remove(styles.dragging)
            })
        }
    }, [])

    if (muted && !showMutedComment)
        return (
            <button
                type='button'
                id={`comment-${comment.id}`}
                className={styles.mutedComment}
                onClick={() => setShowMutedComment(true)}
            >
                <EyeClosedIcon />
                <p>muted comment by u/{Creator.handle} (click to reveal)</p>
            </button>
        )
    return (
        <Column
            id={`comment-${comment.id}`}
            className={`${styles.wrapper} ${highlighted && styles.highlighted} ${
                location === 'link-map' && styles.linkMap
            }`}
            draggable
        >
            <Row>
                <Link
                    to={`/u/${Creator.handle}`}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    style={{ pointerEvents: Creator.handle ? 'auto' : 'none' }}
                >
                    <FlagImage type='user' size={30} imagePath={Creator.flagImagePath} />
                </Link>
                <Column className={styles.content}>
                    <Row spaceBetween className={styles.header}>
                        <Row>
                            {state === 'account-deleted' ? (
                                <p className='grey' style={{ marginRight: 5 }}>
                                    [Account deleted]
                                </p>
                            ) : (
                                <Link
                                    to={`/u/${Creator.handle}`}
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}
                                    style={{ marginRight: 5 }}
                                >
                                    <p style={{ fontWeight: 600 }}>{Creator.name}</p>
                                </Link>
                            )}
                            <p className='grey' title={dateCreated(createdAt)}>
                                {`• ${timeSinceCreated(createdAt)}`}
                            </p>
                            {createdAt !== updatedAt && (
                                <p
                                    className='grey'
                                    title={`Edited at ${dateCreated(updatedAt)}`}
                                    style={{ paddingLeft: 5 }}
                                >
                                    *
                                </p>
                            )}
                            {muted && (
                                <button
                                    type='button'
                                    className={styles.muteButton}
                                    title='Click to hide again'
                                    onClick={() => setShowMutedComment(false)}
                                >
                                    <EyeClosedIcon />
                                </button>
                            )}
                        </Row>
                        <Row>
                            <Link
                                to={`/p/${itemId}?commentId=${id}`}
                                className={styles.id}
                                title='Open post page'
                            >
                                <p className='grey'>ID:</p>
                                <p style={{ marginLeft: 5 }}>{id}</p>
                            </Link>
                            {isOwnComment && (
                                <button
                                    type='button'
                                    className={styles.menuButton}
                                    onClick={() => setMenuOpen(!menuOpen)}
                                >
                                    <VerticalEllipsisIcon />
                                </button>
                            )}
                            {menuOpen && (
                                <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                                    <Column className={styles.menu}>
                                        <Column>
                                            <button
                                                type='button'
                                                onClick={() => setEditCommentModalOpen(true)}
                                            >
                                                <EditIcon />
                                                Edit comment
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setDeleteCommentModalOpen(true)}
                                            >
                                                <DeleteIcon />
                                                Delete comment
                                            </button>
                                        </Column>
                                    </Column>
                                </CloseOnClickOutside>
                            )}
                        </Row>
                    </Row>
                    {state !== 'account-deleted' && (
                        <ShowMoreLess height={250} gradientColor={highlighted ? 'blue' : 'grey'}>
                            <DraftText
                                stringifiedDraft={state === 'deleted' ? '[comment deleted]' : text}
                                markdownStyles={`${styles.markdown} ${
                                    state === 'deleted' && styles.deleted
                                }`}
                            />
                        </ShowMoreLess>
                    )}
                </Column>
            </Row>
            {state === 'visible' && (
                <Row className={styles.footer}>
                    <button
                        type='button'
                        className={`${styles.stat} ${styles.reply}`}
                        onClick={() => toggleReplyInput()}
                    >
                        <ReplyIcon />
                    </button>
                    <Row centerY className={`${styles.stat} ${accountLike ? styles.blue : ''}`}>
                        {likeLoading ? (
                            <LoadingWheel size={15} style={{ marginRight: 5 }} />
                        ) : (
                            <button type='button' onClick={toggleLike} disabled={likeLoading}>
                                <LikeIcon />
                            </button>
                        )}
                        <button
                            type='button'
                            onClick={() => (totalLikes ? setLikeModalOpen(true) : toggleLike())}
                            disabled={likeLoading}
                        >
                            <p>{totalLikes}</p>
                        </button>
                    </Row>
                    <button
                        type='button'
                        className={`${styles.stat} ${accountLink ? styles.blue : ''}`}
                        onClick={() => history(`/linkmap?item=comment&id=${id}`)}
                    >
                        <LinkIcon />
                        <p>{totalLinks}</p>
                    </button>
                    <button
                        type='button'
                        className={`${styles.stat} ${accountRating ? styles.blue : ''}`}
                        onClick={() => setRatingModalOpen(true)}
                    >
                        <ZapIcon />
                        <p>{totalRatings}</p>
                    </button>
                </Row>
            )}
            {likeModalOpen && (
                <LikeModal
                    itemType='comment'
                    itemData={comment}
                    updateItem={() => updateCommentReactions(comment, 'Like', !accountLike)}
                    close={() => setLikeModalOpen(false)}
                />
            )}
            {ratingModalOpen && (
                <RatingModal
                    itemType='comment'
                    itemData={comment}
                    updateItem={() => updateCommentReactions(comment, 'Rating', !accountRating)}
                    close={() => setRatingModalOpen(false)}
                />
            )}
            {editCommentModalOpen && (
                <EditCommentModal
                    comment={comment}
                    editComment={editComment}
                    close={() => setEditCommentModalOpen(false)}
                />
            )}
            {deleteCommentModalOpen && (
                <DeleteCommentModal
                    comment={comment}
                    removeComment={removeComment}
                    close={() => setDeleteCommentModalOpen(false)}
                />
            )}
            {showModal && (
                <UserButtonModal user={{ ...Creator, ...modalData }} transparent={transparent} />
            )}
        </Column>
    )
}

export default CommentCard
