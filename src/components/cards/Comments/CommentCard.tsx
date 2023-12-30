import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import EditCommentModal from '@components/cards/Comments/EditCommentModal'
import Audios from '@components/cards/PostCard/Audios'
import Images from '@components/cards/PostCard/Images'
import Urls from '@components/cards/PostCard/Urls'
import CommentInput from '@components/draft-js/CommentInput'
import DraftText from '@components/draft-js/DraftText'
import DeleteCommentModal from '@components/modals/DeleteCommentModal'
import LikeModal from '@components/modals/LikeModal'
import RatingModal from '@components/modals/RatingModal'
import UserButtonModal from '@components/modals/UserButtonModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { dateCreated, getTextSelection, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/Comments/CommentCard.module.scss'
import {
    CollapseIcon,
    DeleteIcon,
    EditIcon,
    ExpandIcon,
    EyeClosedIcon,
    LikeIcon,
    NeuronIcon,
    VerticalEllipsisIcon,
    ZapIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

// todo: set up total children and total descendents stats and handle pagination using these values
function CommentCard(props: {
    depth: number
    comment: any
    postId: number
    highlighted?: boolean
    location: string
    filter: string
    addComment: (comment: any) => void
    removeComment: (comment: any) => void
    editComment: (comment: any, newText: string) => void
    setPostDraggable?: (state: boolean) => void
}): JSX.Element {
    const {
        depth,
        comment: commentData,
        postId,
        highlighted,
        location,
        filter,
        addComment,
        removeComment,
        editComment, // todo: remove (done locally)
        setPostDraggable,
    } = props

    const { loggedIn, accountData, updateDragItem, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [comment, setComment] = useState(commentData)
    const {
        id,
        rootId,
        text,
        mediaTypes,
        state,
        totalLikes,
        totalRatings,
        totalLinks,
        totalComments,
        totalChildComments,
        createdAt,
        updatedAt,
        Creator,
        Comments,
    } = comment
    const [loading, setLoading] = useState(false)
    const [remainingComments, setRemainingComments] = useState(totalChildComments - Comments.length)
    const [collapsed, setCollapsed] = useState(false)
    const [buttonsDisabled, setButtonsDisabled] = useState(true)
    const [accountReactions, setAccountReactions] = useState<any>({})
    const { liked, rated, linked } = accountReactions
    const [draggable, setDraggable] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [showMutedComment, setShowMutedComment] = useState(false)
    const [showUserModal, setShowUserModal] = useState(false)
    const [userModalTransparent, setUserModalTransparent] = useState(true)
    const [userModalData, setUserModalData] = useState({
        bio: '',
        coverImagePath: '',
        totalPosts: 0,
        totalComments: 0,
    })
    const [selected, setSelected] = useState(false)
    const selectedRef = useRef(false)
    const mouseOver = useRef(false)
    const hoverDelay = 500
    const isOwnComment = Creator.id === accountData.id
    const muted = accountData.id && accountData.mutedUsers.includes(Creator.id)
    const edited = createdAt !== updatedAt
    const cookies = new Cookies()
    const history = useNavigate()

    function getAccountReactions() {
        // only request values if reactions present
        const types = [] as string[]
        if (totalLikes) types.push('like')
        if (totalRatings) types.push('rating')
        if (totalLinks) types.push('link')
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(
                `${
                    config.apiURL
                }/account-reactions?postType=comment&postId=${id}&types=${types.join(',')}`,
                options
            )
            .then((res) => {
                setAccountReactions(res.data)
                setButtonsDisabled(false)
            })
            .catch((error) => console.log(error))
    }

    function getComments(commentId, offset?) {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(
                `${config.apiURL}/post-comments?postId=${commentId}&offset=${
                    offset || 0
                }&filter=${filter}`,
                options
            )
            .then((res) => {
                const newComments = offset ? [...Comments, ...res.data.comments] : res.data.comments
                setComment({ ...comment, Comments: newComments })
                setRemainingComments(res.data.totalChildren - newComments.length)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function toggleSelected() {
        setSelected(!selectedRef.current)
        selectedRef.current = !selectedRef.current
    }

    function toggleLike() {
        setLikeLoading(true)
        if (loggedIn) {
            const data = { type: 'comment', id } as any
            if (!liked) {
                data.rootId = rootId
                data.spaceId = window.location.pathname.includes('/s/') ? spaceData.id : null
            }
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/${liked ? 'remove' : 'add'}-like`, data, options)
                .then(() => {
                    setComment({ ...comment, totalLikes: totalLikes + (liked ? -1 : 1) })
                    setAccountReactions({ ...accountReactions, liked: !liked })
                    setLikeLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setLikeLoading(false)
            setAlertMessage(`Log in to like comments`)
            setAlertModalOpen(true)
        }
    }

    // todo: refactor? (used for user hover)
    function onMouseEnter() {
        // start hover delay
        mouseOver.current = true
        setTimeout(() => {
            if (mouseOver.current) {
                setShowUserModal(true)
                setTimeout(() => {
                    if (mouseOver.current) setUserModalTransparent(false)
                }, 200)
            }
        }, hoverDelay)
        // get modal data
        axios
            .get(`${config.apiURL}/user-modal-data?userId=${Creator.id}`)
            .then((res) => setUserModalData(res.data))
            .catch((error) => console.log(error))
    }

    function onMouseLeave() {
        mouseOver.current = false
        setUserModalTransparent(true)
        setTimeout(() => {
            if (!mouseOver.current) setShowUserModal(false)
        }, hoverDelay)
    }

    function addDragEvents() {
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
    }

    function addSelectionEvents() {
        const commentText = document.getElementById(`comment-text-${comment.id}`)
        if (commentText) {
            commentText.addEventListener('click', () => {
                // todo: check if reply input empty
                if (!getTextSelection()) toggleSelected()
            })
            commentText.addEventListener('mouseenter', () => {
                setDraggable(false)
                if (setPostDraggable) setPostDraggable(false)
            })
            commentText.addEventListener('mouseleave', () => {
                setDraggable(true)
                if (setPostDraggable) setPostDraggable(true)
            })
        }
    }

    useEffect(() => {
        addDragEvents()
    }, [])

    useEffect(() => {
        if (!collapsed) addSelectionEvents()
    }, [collapsed])

    useEffect(() => {
        if (selected && loggedIn) getAccountReactions()
    }, [selected])

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
        <Row>
            {depth > 0 && <div className={styles.indentation} />}
            <Column style={{ width: depth ? 'calc(100% - 26px)' : '100%' }}>
                <Column
                    id={`comment-${comment.id}`}
                    className={`${styles.wrapper} ${highlighted && styles.highlighted} ${
                        location === 'link-map' && styles.linkMap
                    }`}
                    draggable={draggable}
                >
                    <Row style={{ marginBottom: collapsed ? 20 : 10 }}>
                        <Column>
                            <button
                                className={styles.userImage}
                                type='button'
                                onClick={() => setCollapsed(!collapsed)}
                            >
                                <Column
                                    centerY
                                    centerX
                                    className={`${styles.collapse} ${
                                        collapsed && styles.collapsed
                                    }`}
                                >
                                    {collapsed ? <ExpandIcon /> : <CollapseIcon />}
                                </Column>
                                <FlagImage
                                    type='user'
                                    size={30}
                                    imagePath={Creator.flagImagePath}
                                />
                            </button>
                            {!collapsed && (
                                <div className={`${styles.line} ${selected && styles.blue}`} />
                            )}
                        </Column>
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
                                    <p
                                        className='grey'
                                        title={`${dateCreated(createdAt)} ${
                                            edited ? `(edited: ${dateCreated(updatedAt)})` : ''
                                        }`}
                                    >
                                        {timeSinceCreated(createdAt)}
                                    </p>
                                    {edited && <p className='grey'>*</p>}
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
                                {selected && (
                                    <Row>
                                        <Link
                                            // to={`/p/${rootId}?commentId=${id}`}
                                            to={`/p/${id}`}
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
                                                            onClick={() => setEditModalOpen(true)}
                                                        >
                                                            <EditIcon />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => setDeleteModalOpen(true)}
                                                        >
                                                            <DeleteIcon />
                                                            Delete
                                                        </button>
                                                    </Column>
                                                </Column>
                                            </CloseOnClickOutside>
                                        )}
                                    </Row>
                                )}
                            </Row>
                            {!collapsed && (
                                <>
                                    {state !== 'account-deleted' && (
                                        <div
                                            id={`comment-text-${comment.id}`}
                                            style={{ cursor: 'text' }}
                                        >
                                            <DraftText
                                                text={
                                                    state === 'deleted' ? '[comment deleted]' : text
                                                }
                                                markdownStyles={`${styles.markdown} ${
                                                    state === 'deleted' && styles.deleted
                                                }`}
                                            />
                                            {mediaTypes.includes('url') && (
                                                <Urls postId={id} style={{ margin: '10px 0' }} />
                                            )}
                                            {mediaTypes.includes('image') && (
                                                <Images postId={id} style={{ margin: '10px 0' }} />
                                            )}
                                            {mediaTypes.includes('audio') && (
                                                <Audios postId={id} style={{ margin: '10px 0' }} />
                                            )}
                                        </div>
                                    )}
                                    {selected && state === 'active' && (
                                        <Row className={styles.footer}>
                                            <Row
                                                centerY
                                                className={`${styles.stat} ${liked && styles.blue}`}
                                            >
                                                {likeLoading ? (
                                                    <LoadingWheel
                                                        size={15}
                                                        style={{ marginRight: 5 }}
                                                    />
                                                ) : (
                                                    <button
                                                        type='button'
                                                        disabled={buttonsDisabled || likeLoading}
                                                        onClick={toggleLike}
                                                    >
                                                        <LikeIcon />
                                                    </button>
                                                )}
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        totalLikes
                                                            ? setLikeModalOpen(true)
                                                            : toggleLike()
                                                    }
                                                    disabled={buttonsDisabled || likeLoading}
                                                >
                                                    <p>{totalLikes}</p>
                                                </button>
                                            </Row>
                                            <button
                                                type='button'
                                                className={`${styles.stat} ${
                                                    linked && styles.blue
                                                }`}
                                                disabled={buttonsDisabled}
                                                onClick={() =>
                                                    history(`/linkmap?item=comment&id=${id}`)
                                                }
                                            >
                                                <NeuronIcon />
                                                <p>{totalLinks}</p>
                                            </button>
                                            <button
                                                type='button'
                                                className={`${styles.stat} ${rated && styles.blue}`}
                                                disabled={buttonsDisabled}
                                                onClick={() => setRatingModalOpen(true)}
                                            >
                                                <ZapIcon />
                                                <p>{totalRatings}</p>
                                            </button>
                                        </Row>
                                    )}
                                </>
                            )}
                        </Column>
                    </Row>
                    {selected && !collapsed && (
                        <CommentInput
                            type='comment'
                            placeholder='Reply...'
                            parent={{ type: 'comment', id }}
                            onSave={(newComment) => {
                                addComment(newComment)
                                toggleSelected()
                            }}
                            style={{
                                marginBottom: 10,
                                // marginLeft: -depth * 24,
                                // width: `calc(100% + ${depth * 24}px)`,
                                zIndex: 5,
                            }}
                        />
                    )}
                    {likeModalOpen && (
                        <LikeModal
                            itemType='comment'
                            itemData={comment}
                            updateItem={() => {
                                setComment({
                                    ...comment,
                                    totalLikes: totalLikes + (liked ? -1 : 1),
                                })
                                setAccountReactions({ ...accountReactions, liked: !liked })
                            }}
                            close={() => setLikeModalOpen(false)}
                        />
                    )}
                    {ratingModalOpen && (
                        <RatingModal
                            itemType='comment'
                            itemData={comment}
                            updateItem={() => {
                                setComment({
                                    ...comment,
                                    totalRatings: totalRatings + (rated ? -1 : 1),
                                })
                                setAccountReactions({ ...accountReactions, rated: !rated })
                            }}
                            close={() => setRatingModalOpen(false)}
                        />
                    )}
                    {editModalOpen && (
                        <EditCommentModal
                            comment={comment}
                            editComment={editComment}
                            close={() => setEditModalOpen(false)}
                        />
                    )}
                    {deleteModalOpen && (
                        <DeleteCommentModal
                            comment={comment}
                            removeComment={removeComment}
                            close={() => setDeleteModalOpen(false)}
                        />
                    )}
                    {showUserModal && (
                        <UserButtonModal
                            user={{ ...Creator, ...userModalData }}
                            transparent={userModalTransparent}
                        />
                    )}
                </Column>
                {!collapsed && (
                    <Column>
                        {Comments.map((reply) => (
                            <CommentCard
                                key={reply.id}
                                depth={depth + 1}
                                comment={reply}
                                postId={postId}
                                // highlighted={false} // highlightedCommentId === comment.id
                                filter={filter}
                                addComment={addComment}
                                removeComment={removeComment}
                                editComment={editComment}
                                setPostDraggable={setPostDraggable}
                                location={location}
                            />
                        ))}
                        {/* {totalComments > 0 && !Comments.length && (
                            <button
                                className={styles.loadMore}
                                type='button'
                                onClick={() => getComments(id)}
                            >
                                Load more →
                            </button>
                        )} */}
                        {remainingComments > 0 && (
                            <button
                                className={styles.loadMore}
                                type='button'
                                onClick={() => getComments(id, Comments.length)}
                            >
                                Load more ({remainingComments})
                            </button>
                        )}
                    </Column>
                )}
            </Column>
        </Row>
    )
}

CommentCard.defaultProps = {
    setPostDraggable: null,
    highlighted: false,
}

export default CommentCard
