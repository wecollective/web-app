import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import Audios from '@components/cards/PostCard/Audios'
import Images from '@components/cards/PostCard/Images'
import Urls from '@components/cards/PostCard/Urls'
import DraftText from '@components/draft-js/DraftText'
import DeletePostModal from '@components/modals/DeletePostModal'
import EditPostModal from '@components/modals/EditPostModal'
import LikeModal from '@components/modals/LikeModal'
import RatingModal from '@components/modals/RatingModal'
import UserButtonModal from '@components/modals/UserButtonModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { dateCreated, getTextSelection, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/Comments/MessageCard.module.scss'
import {
    DeleteIcon,
    EditIcon,
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

function MessageCard(props: {
    message: any
    highlighted?: boolean
    removeMessage: (message: any) => void
}): JSX.Element {
    const { message: messageData, highlighted, removeMessage } = props
    const { loggedIn, accountData, updateDragItem, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [message, setMessage] = useState(messageData)
    const {
        id,
        rootId,
        text,
        mediaTypes,
        state,
        totalLikes,
        totalRatings,
        totalLinks,
        totalChildComments,
        createdAt,
        updatedAt,
        Creator,
        UrlBlocks,
        ImageBlocks,
        AudioBlocks,
    } = message
    const [visible, setVisible] = useState(false)
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
    const fullWidth = mediaTypes.includes('audio') || mediaTypes.includes('url')

    function getAccountReactions() {
        // only request values if reactions present
        const types = [] as string[]
        if (totalLikes) types.push('like')
        if (totalRatings) types.push('rating')
        if (totalLinks) types.push('link')
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(
                `${config.apiURL}/account-reactions?postType=post&postId=${id}&types=${types.join(
                    ','
                )}`,
                options
            )
            .then((res) => {
                setAccountReactions(res.data)
                setButtonsDisabled(false)
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
            setAlertMessage(`Log in to like messages`)
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

    function addSelectionEvents() {
        // toggle selected on header clicks
        const header = document.getElementById(`message-${id}-header`)
        header?.addEventListener('click', () => toggleSelected())
        // toggle selected on text clicks if no text selection
        const messageText = document.getElementById(`message-${id}-text`)
        messageText?.addEventListener('click', () => {
            // todo: check if reply input empty
            const textSelection = getTextSelection()
            if (state !== 'deleted' && !textSelection) toggleSelected()
        })
        // add drag disabled regions
        const dragDisabledRegions = Array.from(
            document.getElementsByClassName(`message-${id}-drag-disabled`)
        )
        dragDisabledRegions.forEach((region) => {
            region.addEventListener('mouseenter', () => setDraggable(false))
            region.addEventListener('mouseleave', () => setDraggable(true))
        })
    }

    useEffect(() => {
        setVisible(true)
        addDragEvents()
    }, [])

    useEffect(() => {
        if (!collapsed) addSelectionEvents()
    }, [collapsed])

    useEffect(() => {
        if (showMutedComment) addSelectionEvents()
    }, [showMutedComment])

    useEffect(() => {
        if (selected && loggedIn) getAccountReactions()
        else setButtonsDisabled(false)
    }, [selected])

    return (
        <Row
            className={`${styles.wrapper} ${visible && styles.visible} ${
                Creator.id === accountData.id && styles.isOwnComment
            }`}
            style={{ width: fullWidth ? 'calc(100% - 100px)' : 'auto', maxWidth: 900 }}
        >
            <Column style={{ marginRight: 10 }}>
                <FlagImage type='user' size={30} imagePath={Creator.flagImagePath} />
            </Column>
            <Column className={styles.message}>
                <Row spaceBetween className={styles.header}>
                    <Row id={`message-${id}-header`} style={{ width: '100%' }}>
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
                        <Row style={{ marginLeft: 10, flexShrink: 0 }}>
                            <Link to={`/p/${id}`} className={styles.id} title='Open post page'>
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
                <Column className={styles.content}>
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
                            urlBlocks={
                                UrlBlocks
                                    ? UrlBlocks.map((block) => {
                                          return { ...block.Post, Url: block.Post.MediaLink.Url }
                                      })
                                    : null
                            }
                            style={{ margin: '10px 0' }}
                        />
                    )}

                    {mediaTypes.includes('image') && (
                        <Images
                            postId={id}
                            imageBlocks={
                                ImageBlocks
                                    ? ImageBlocks.map((block) => {
                                          return {
                                              ...block.Post,
                                              Image: block.Post.MediaLink.Image,
                                          }
                                      })
                                    : null
                            }
                            style={{ margin: '10px 0' }}
                        />
                    )}
                    {mediaTypes.includes('audio') && (
                        <Audios
                            postId={id}
                            audioBlocks={
                                AudioBlocks
                                    ? AudioBlocks.map((block) => {
                                          return {
                                              ...block.Post,
                                              Audio: block.Post.MediaLink.Audio,
                                          }
                                      })
                                    : null
                            }
                            style={{ margin: '10px 0', width: '100%' }}
                        />
                    )}
                </Column>
                {selected && state === 'active' && (
                    <Row className={styles.footer}>
                        <Row centerY className={`${styles.stat} ${liked && styles.blue}`}>
                            {likeLoading ? (
                                <LoadingWheel size={18} style={{ marginRight: 5 }} />
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
                                onClick={() => (totalLikes ? setLikeModalOpen(true) : toggleLike())}
                                disabled={buttonsDisabled || likeLoading}
                            >
                                <p>{totalLikes}</p>
                            </button>
                        </Row>
                        <button
                            type='button'
                            className={`${styles.stat} ${linked && styles.blue}`}
                            disabled={buttonsDisabled}
                            onClick={() => history(`/linkmap?item=message&id=${id}`)}
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
            </Column>
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
                {showUserModal && (
                    <UserButtonModal
                        user={{ ...Creator, ...userModalData }}
                        transparent={userModalTransparent}
                    />
                )}
            </Column>
        </Row>
    )
}

MessageCard.defaultProps = {
    highlighted: false,
}

export default MessageCard
