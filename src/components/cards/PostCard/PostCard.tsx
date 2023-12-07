import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import UserButton from '@components/UserButton'
import LoadingWheel from '@components/animations/LoadingWheel'
import Comments from '@components/cards/Comments/Comments'
import Audio from '@components/cards/PostCard/Audio'
import Card from '@components/cards/PostCard/Card'
import EventCard from '@components/cards/PostCard/EventCard'
import GlassBeadGame from '@components/cards/PostCard/GlassBeadGame'
import Images from '@components/cards/PostCard/Images'
import PollCard from '@components/cards/PostCard/PollCard'
import PostSpaces from '@components/cards/PostCard/PostSpaces'
import Urls from '@components/cards/PostCard/Urls'
import DraftText from '@components/draft-js/DraftText'
import DeletePostModal from '@components/modals/DeletePostModal'
import EditPostModal from '@components/modals/EditPostModal'
import LikeModal from '@components/modals/LikeModal'
import RatingModal from '@components/modals/RatingModal'
import RemovePostModal from '@components/modals/RemovePostModal'
import RepostModal from '@components/modals/RepostModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { dateCreated, timeSinceCreated, timeSinceCreatedShort } from '@src/Helpers'
import {
    CommentIcon,
    DeleteIcon,
    EditIcon,
    LikeIcon,
    NeuronIcon,
    RepostIcon,
    SynapseIcon,
    VerticalEllipsisIcon,
    ZapIcon,
} from '@src/svgs/all'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function PostCard(props: {
    post: any
    index?: number
    location:
        | 'post-page'
        | 'space-posts'
        | 'space-post-map'
        | 'space-governance'
        | 'user-posts'
        | 'link-modal'
        | 'preview'
    collapse?: boolean
    styling?: boolean
    style?: any
}): JSX.Element {
    const { post, index, location, collapse, styling, style } = props
    const {
        accountData,
        loggedIn,
        updateDragItem,
        setAlertModalOpen,
        setAlertMessage,
        setCreatePostModalSettings,
        setCreatePostModalOpen,
    } = useContext(AccountContext)
    const { spaceData, postFilters } = useContext(SpaceContext)
    const [postData, setPostData] = useState(post)
    const {
        id,
        mediaTypes,
        title,
        text,
        createdAt,
        updatedAt,
        totalComments,
        totalLikes,
        totalRatings,
        totalReposts,
        totalLinks,
        accountLike,
        accountComment,
        accountLink,
        accountRating,
        accountRepost,
        sourcePostId,
        Creator,
        DirectSpaces,
    } = postData
    const [likeLoading, setLikeLoading] = useState(false)
    const [draggable, setDraggable] = useState(true)
    const [topicImage, setTopicImage] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [repostModalOpen, setRepostModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(location === 'post-page')
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
    const [editPostModalOpen, setEditPostModalOpen] = useState(false)
    const [removePostModalOpen, setRemovePostModalOpen] = useState(false)
    const mobileView = document.documentElement.clientWidth < 900
    const cookies = new Cookies()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    const showFooter = true // location !== 'link-modal'
    const isMod =
        location.includes('space') && spaceData.Moderators.find((m) => m.id === accountData.id)
    const showDropDown = location !== 'preview' && (isOwnPost || isMod)

    const history = useNavigate()
    const urlParams = Object.fromEntries(new URLSearchParams(useLocation().search))
    const params = { ...postFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function toggleLike() {
        setLikeLoading(true)
        const addingLike = !postData.accountLike
        const accessToken = cookies.get('accessToken')
        if (loggedIn && accessToken) {
            const data = { itemType: 'post', itemId: postData.id } as any
            if (addingLike) {
                data.accountHandle = accountData.handle
                data.accountName = accountData.name
                data.spaceId = window.location.pathname.includes('/s/') ? spaceData.id : null
            }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/${addingLike ? 'add' : 'remove'}-like`, data, authHeader)
                .then(() => {
                    setPostData({
                        ...postData,
                        totalLikes: postData.totalLikes + (addingLike ? 1 : -1),
                        accountLike: addingLike,
                    })
                    setLikeLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setLikeLoading(false)
            setAlertMessage(`Log in to like posts`)
            setAlertModalOpen(true)
        }
    }

    function linkNewPost() {
        if (loggedIn) {
            setCreatePostModalSettings({ sourceType: 'post', sourceId: id })
            setCreatePostModalOpen(true)
        } else {
            setAlertMessage('Log in to link posts')
            setAlertModalOpen(true)
        }
    }

    // todo: remove this useEffect all together if everything handled from props...?
    useEffect(() => setPostData(post), [post])

    useEffect(() => {
        const postCard = document.getElementById(`post-${id}`)
        if (postCard) {
            postCard.addEventListener('dragstart', (e) => {
                postCard.classList.add(styles.dragging)
                updateDragItem({ type: 'post', data: postData })
                const dragItem = document.getElementById('drag-item')
                e.dataTransfer?.setDragImage(dragItem!, 50, 50)
            })
            postCard.addEventListener('dragend', () => {
                postCard.classList.remove(styles.dragging)
            })
        }
    }, [])

    return (
        <Column
            key={id}
            id={`post-${id}`}
            className={`${styles.post} ${styles[location]} ${styling && styles.styling}`}
            style={style}
            draggable={draggable}
        >
            <Row spaceBetween className={styles.header}>
                <Row centerY>
                    <UserButton
                        user={Creator}
                        imageSize={32}
                        fontSize={15}
                        style={{ marginRight: 5 }}
                    />
                    <PostSpaces spaces={DirectSpaces} />
                    <Row style={{ marginLeft: 2 }}>
                        <p className='grey' title={`Posted at ${dateCreated(createdAt)}`}>
                            {mobileView
                                ? timeSinceCreatedShort(createdAt)
                                : timeSinceCreated(createdAt)}
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
                    </Row>
                </Row>
                <Row centerY>
                    <Link to={`/p/${id}`} className={styles.id} title='Open post page'>
                        <p className='grey'>ID:</p>
                        <p style={{ marginLeft: 5 }}>{id}</p>
                    </Link>
                    {showDropDown && (
                        <Column>
                            <button
                                type='button'
                                className={styles.menuButton}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                <VerticalEllipsisIcon />
                            </button>
                            {menuOpen && (
                                <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                                    <Column className={styles.menu}>
                                        <Column>
                                            {isOwnPost && (
                                                <button
                                                    type='button'
                                                    onClick={() => setEditPostModalOpen(true)}
                                                >
                                                    <EditIcon />
                                                    Edit text
                                                </button>
                                            )}
                                            {isOwnPost && (
                                                <button
                                                    type='button'
                                                    onClick={() => setDeletePostModalOpen(true)}
                                                >
                                                    <DeleteIcon />
                                                    Delete post
                                                </button>
                                            )}
                                            {isMod && (
                                                <button
                                                    type='button'
                                                    onClick={() => setRemovePostModalOpen(true)}
                                                >
                                                    <DeleteIcon />
                                                    Remove from s/{spaceData.handle}
                                                </button>
                                            )}
                                        </Column>
                                    </Column>
                                </CloseOnClickOutside>
                            )}
                        </Column>
                    )}
                </Row>
            </Row>
            <Column className={styles.content}>
                {sourcePostId && (
                    <Row centerX className={styles.sourcePostId}>
                        <Link to={`/p/${sourcePostId}`} title='Click to open source post'>
                            <span>Source post:</span>
                            <p>{sourcePostId}</p>
                        </Link>
                    </Row>
                )}
                {(title || text) && (
                    <div
                        onMouseEnter={() => setDraggable(false)}
                        onMouseLeave={() => setDraggable(true)}
                        style={{ cursor: 'text' }}
                    >
                        {title && (
                            <>
                                {mediaTypes.includes('glass-bead-game') ? (
                                    <Row centerY className={styles.topic}>
                                        {topicImage && <img src={topicImage} alt='' />}
                                        <h1>{title}</h1>
                                    </Row>
                                ) : (
                                    <h1 className={styles.title}>{title}</h1>
                                )}
                            </>
                        )}
                        {text && (
                            <>
                                {collapse ? (
                                    <ShowMoreLess height={700} gradientColor='white'>
                                        <DraftText text={text} style={{ marginBottom: 10 }} />
                                    </ShowMoreLess>
                                ) : (
                                    <DraftText text={text} style={{ marginBottom: 10 }} />
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* {todo: startTime && } */}
                {postData.Event && (
                    <EventCard postData={postData} setPostData={setPostData} location={location} />
                )}
                {mediaTypes.includes('poll') && (
                    <PollCard postData={postData} location={location} />
                )}
                {mediaTypes.includes('glass-bead-game') && (
                    <GlassBeadGame
                        postId={id}
                        setTopicImage={setTopicImage}
                        isOwnPost={Creator.id === accountData.id}
                    />
                )}
                {mediaTypes.includes('card') && <Card postId={id} />}
                {mediaTypes.includes('url') && <Urls postId={id} style={{ marginBottom: 10 }} />}
                {mediaTypes.includes('image') && (
                    <Images postId={id} style={{ marginBottom: 10 }} />
                )}
                {mediaTypes.includes('audio') && <Audio postId={id} style={{ marginBottom: 10 }} />}
            </Column>
            {showFooter && (
                <Column className={styles.footer}>
                    <Row spaceBetween centerY>
                        <Row centerY wrap className={styles.reactions}>
                            <Row
                                centerY
                                className={`${styles.like} ${
                                    accountLike ? styles.highlighted : ''
                                }`}
                            >
                                {likeLoading ? (
                                    <LoadingWheel size={22} style={{ margin: '0 8px 0 7px' }} />
                                ) : (
                                    <button type='button' onClick={toggleLike}>
                                        <LikeIcon />
                                    </button>
                                )}
                                <button type='button' onClick={() => setLikeModalOpen(true)}>
                                    <p>{totalLikes}</p>
                                </button>
                            </Row>
                            <button
                                type='button'
                                className={`${styles.comment} ${
                                    accountComment ? styles.highlighted : ''
                                }`}
                                onClick={() => {
                                    if (loggedIn || totalComments) setCommentsOpen(!commentsOpen)
                                    else {
                                        setAlertMessage('Log in to comment on posts')
                                        setAlertModalOpen(true)
                                    }
                                }}
                            >
                                <Column centerX centerY>
                                    <CommentIcon />
                                </Column>
                                <p>{totalComments}</p>
                            </button>
                            <button
                                type='button'
                                className={`${styles.link} ${
                                    accountLink ? styles.highlighted : ''
                                }`}
                                onClick={() => history(`/linkmap?item=post&id=${id}`)}
                            >
                                <Column centerX centerY>
                                    <NeuronIcon />
                                </Column>
                                <p>{totalLinks}</p>
                            </button>
                            <button
                                type='button'
                                className={`${styles.rating} ${
                                    accountRating ? styles.highlighted : ''
                                }`}
                                onClick={() => setRatingModalOpen(true)}
                            >
                                <Column centerX centerY>
                                    <ZapIcon />
                                </Column>
                                <p>{totalRatings}</p>
                            </button>
                            <button
                                type='button'
                                className={`${styles.repost} ${
                                    accountRepost ? styles.highlighted : ''
                                }`}
                                onClick={() => setRepostModalOpen(true)}
                            >
                                <Column centerX centerY>
                                    <RepostIcon />
                                </Column>
                                <p>{totalReposts}</p>
                            </button>
                        </Row>
                        {/* Hide link post button on Pronoia posts */}
                        {!DirectSpaces.find((s) => s.id === 616) && (
                            <button type='button' className={styles.linkPost} onClick={linkNewPost}>
                                <Column centerX centerY>
                                    <SynapseIcon />
                                </Column>
                            </button>
                        )}
                    </Row>
                    {commentsOpen && (
                        <Comments
                            postId={postData.id}
                            location={location}
                            totalComments={totalComments}
                            incrementTotalComments={(value) =>
                                setPostData({ ...postData, totalComments: totalComments + value })
                            }
                            setPostDraggable={setDraggable}
                            style={{ marginTop: 10 }}
                        />
                    )}
                </Column>
            )}
            {likeModalOpen && (
                <LikeModal
                    itemType='post'
                    itemData={postData}
                    updateItem={() =>
                        setPostData({
                            ...postData,
                            totalLikes: totalLikes + (accountLike ? -1 : 1),
                            accountLike: !accountLike,
                        })
                    }
                    close={() => setLikeModalOpen(false)}
                />
            )}
            {repostModalOpen && (
                <RepostModal
                    postData={postData}
                    setPostData={setPostData}
                    close={() => setRepostModalOpen(false)}
                />
            )}
            {ratingModalOpen && (
                <RatingModal
                    itemType='post'
                    itemData={postData}
                    updateItem={() => {
                        setPostData({
                            ...postData,
                            totalRatings: totalRatings + (accountRating ? -1 : 1),
                            accountRating: !accountRating,
                        })
                    }}
                    close={() => setRatingModalOpen(false)}
                />
            )}
            {editPostModalOpen && (
                <EditPostModal
                    postData={postData}
                    setPostData={setPostData}
                    close={() => setEditPostModalOpen(false)}
                />
            )}
            {deletePostModalOpen && (
                <DeletePostModal
                    postId={postData.id}
                    location={location}
                    close={() => setDeletePostModalOpen(false)}
                />
            )}
            {removePostModalOpen && (
                <RemovePostModal
                    postId={postData.id}
                    location={location}
                    close={() => setRemovePostModalOpen(false)}
                />
            )}
        </Column>
    )
}

PostCard.defaultProps = {
    index: null,
    collapse: false,
    styling: false,
    style: null,
}

export default PostCard

/* {location !== 'post-page' && (
    <Link
        to={`/p/${id}`}
        className={styles.link}
        title='Open post page'
        style={location === 'preview' ? { pointerEvents: 'none' } : {}}
    >
        <ExpandIcon />
    </Link>
)} */

/* <Row className={styles.otherButtons}>
    {['text', 'url', 'audio', 'image'].includes(type) && (
        <button
            type='button'
            title='Create string from post'
            disabled={location === 'preview'}
            onClick={() => {
                if (loggedIn) {
                    setCreatePostModalSettings({
                        type: 'string-from-post',
                        source: postData,
                    })
                    setCreatePostModalOpen(true)
                } else {
                    setAlertMessage('Log in to create strings from posts')
                    setAlertModalOpen(true)
                }
            }}
        >
            <StringIcon />
        </button>
    )}
</Row> */

/* {['prism', 'decision-tree'].includes(type) && (
    <StatButton
        icon={<ArrowRightIcon />}
        iconSize={20}
        text='Open game room'
        disabled={location === 'preview'}
        onClick={() => history(`/p/${id}`)}
    />
)} */

/* <button
    className={styles.gbgFromPostButton}
    type='button'
    title='Create GBG from post'
    // disabled={location === 'preview'}
    onClick={startNewGbgFromPost}
>
    <CastaliaIcon />
</button> */
