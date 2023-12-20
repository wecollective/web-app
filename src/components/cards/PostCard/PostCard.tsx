import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import UserButton from '@components/UserButton'
import LoadingWheel from '@components/animations/LoadingWheel'
import Comments from '@components/cards/Comments/Comments'
import AudioCard from '@components/cards/PostCard/AudioCard'
import Audios from '@components/cards/PostCard/Audios'
import Card from '@components/cards/PostCard/Card'
import EventCard from '@components/cards/PostCard/EventCard'
import GlassBeadGame from '@components/cards/PostCard/GlassBeadGame'
import Images from '@components/cards/PostCard/Images'
import PollCard from '@components/cards/PostCard/PollCard'
import PostSpaces from '@components/cards/PostCard/PostSpaces'
import UrlCard from '@components/cards/PostCard/UrlCard'
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
    AngleUpIcon,
    AnglesUpIcon,
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
    const { index, post: postData, location, collapse, styling, style } = props
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
    const [post, setPost] = useState(postData)
    const {
        id,
        type,
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
        sourcePostId,
        Creator,
        DirectSpaces,
        Event,
        Image,
        Audio,
        Url,
    } = post
    const [buttonsDisabled, setButtonsDisabled] = useState(true)
    const [accountReactions, setAccountReactions] = useState<any>({})
    const { liked, rated, reposted, commented, linked } = accountReactions
    const [commentLinks, setCommentLinks] = useState<any>(null)
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
    const isBlock = ['url', 'image', 'audio'].includes(type)
    const mobileView = document.documentElement.clientWidth < 900
    const cookies = new Cookies()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    const showFooter = location !== 'link-modal'
    const isMod =
        location.includes('space') && spaceData.Moderators.find((m) => m.id === accountData.id)
    const showDropDown = location !== 'preview' && (isOwnPost || isMod)
    const history = useNavigate()
    const urlParams = Object.fromEntries(new URLSearchParams(useLocation().search))
    const params = { ...postFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function getAccountReactions() {
        // only request values if reactions present
        const types = [] as string[]
        if (totalLikes) types.push('like')
        if (totalRatings) types.push('rating')
        if (totalReposts) types.push('repost')
        if (totalComments) types.push('comment')
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

    function getAccountCommented() {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/account-reactions?postId=${id}&types=comment`, options)
            .then((res) =>
                setAccountReactions({ ...accountReactions, commented: res.data.commented })
            )
            .catch((error) => console.log(error))
    }

    function getCommentLinks() {
        axios
            .get(`${config.apiURL}/comment-links?postId=${id}`)
            .then((res) => {
                console.log('comment-links: ', res.data)
                setCommentLinks(res.data)
            })
            .catch((error) => console.log(error))
    }

    function addDragEvents() {
        const postCard = document.getElementById(`post-${id}`)
        if (postCard) {
            postCard.addEventListener('dragstart', (e) => {
                postCard.classList.add(styles.dragging)
                updateDragItem({ type: 'post', data: post })
                const dragItem = document.getElementById('drag-item')
                e.dataTransfer?.setDragImage(dragItem!, 50, 50)
            })
            postCard.addEventListener('dragend', () => {
                postCard.classList.remove(styles.dragging)
            })
        }
    }

    function toggleLike() {
        setLikeLoading(true)
        if (loggedIn) {
            const data = { type: 'post', id } as any
            if (!liked) data.spaceId = location.includes('space') ? spaceData.id : null
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/${liked ? 'remove' : 'add'}-like`, data, options)
                .then(() => {
                    setPost({ ...post, totalLikes: totalLikes + (liked ? -1 : 1) })
                    setAccountReactions({ ...accountReactions, liked: !liked })
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

    useEffect(() => {
        if (loggedIn) getAccountReactions()
        if (type === 'comment') getCommentLinks()
        addDragEvents()
    }, [])

    return (
        <Column
            key={id}
            id={`post-${id}`}
            className={`${styles.post} ${styles[location]} ${styling && styles.styling}`}
            style={style}
            draggable={draggable}
        >
            {commentLinks && (
                <Row centerX>
                    {commentLinks.rootId && (
                        <Link to={`/p/${commentLinks.rootId}`} className={styles.rootLink}>
                            <AnglesUpIcon />
                            <p style={{ marginLeft: 5 }}>Root</p>
                        </Link>
                    )}
                    <Link to={`/p/${commentLinks.parentId}`} className={styles.parentLink}>
                        <AngleUpIcon />
                        <p style={{ marginLeft: 5 }}>Parent</p>
                    </Link>
                </Row>
            )}
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
                {!isBlock && mediaTypes.includes('url') && (
                    <Urls postId={id} style={{ marginBottom: 10 }} />
                )}
                {!isBlock && mediaTypes.includes('image') && (
                    <Images postId={id} style={{ marginBottom: 10 }} />
                )}
                {!isBlock && mediaTypes.includes('audio') && (
                    <Audios postId={id} style={{ marginBottom: 10 }} />
                )}
                {Event && <EventCard postData={post} setPostData={setPost} location={location} />}
                {mediaTypes.includes('poll') && <PollCard postData={post} location={location} />}
                {mediaTypes.includes('glass-bead-game') && (
                    <GlassBeadGame
                        postId={id}
                        setTopicImage={setTopicImage}
                        isOwnPost={Creator.id === accountData.id}
                    />
                )}
                {mediaTypes.includes('card') && <Card postId={id} />}
                {/* block posts */}
                {type === 'image' && <img className={styles.image} src={Image.url} alt='block' />}
                {type === 'audio' && (
                    <AudioCard
                        id={Audio.id}
                        url={Audio.url}
                        staticBars={250}
                        location='post'
                        style={{ height: 160, width: '100%' }}
                    />
                )}
                {type === 'url' && <UrlCard key={Url.id} type='post' urlData={Url} />}
            </Column>
            {showFooter && (
                <Row spaceBetween className={styles.footer}>
                    <Row centerY wrap className={styles.reactions}>
                        <Row centerY className={`${styles.like} ${liked && styles.highlighted}`}>
                            {likeLoading ? (
                                <LoadingWheel size={22} style={{ margin: '0 8px 0 7px' }} />
                            ) : (
                                <button
                                    disabled={buttonsDisabled}
                                    type='button'
                                    onClick={toggleLike}
                                >
                                    <LikeIcon />
                                </button>
                            )}
                            <button type='button' onClick={() => setLikeModalOpen(true)}>
                                <p>{totalLikes}</p>
                            </button>
                        </Row>
                        <button
                            type='button'
                            className={`${styles.comment} ${commented && styles.highlighted}`}
                            disabled={buttonsDisabled}
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
                            className={`${styles.link} ${linked ? styles.highlighted : ''}`}
                            disabled={buttonsDisabled}
                            onClick={() => history(`/linkmap?item=post&id=${id}`)}
                        >
                            <Column centerX centerY>
                                <NeuronIcon />
                            </Column>
                            <p>{totalLinks}</p>
                        </button>
                        <button
                            type='button'
                            className={`${styles.rating} ${rated && styles.highlighted}`}
                            disabled={buttonsDisabled}
                            onClick={() => setRatingModalOpen(true)}
                        >
                            <Column centerX centerY>
                                <ZapIcon />
                            </Column>
                            <p>{totalRatings}</p>
                        </button>
                        <button
                            type='button'
                            className={`${styles.repost} ${reposted && styles.highlighted}`}
                            disabled={buttonsDisabled}
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
            )}
            {commentsOpen && (
                <Comments
                    postId={id}
                    location={location}
                    totalComments={totalComments}
                    incrementTotalComments={(value) => {
                        setPost({ ...post, totalComments: totalComments + value })
                        getAccountCommented()
                    }}
                    setPostDraggable={setDraggable}
                    style={{ margin: '10px -8px 0 -8px' }}
                />
            )}
            {likeModalOpen && (
                <LikeModal
                    itemType='post'
                    itemData={post}
                    updateItem={() => {
                        setPost({ ...post, totalLikes: totalLikes + (liked ? -1 : 1) })
                        setAccountReactions({ ...accountReactions, liked: !liked })
                    }}
                    close={() => setLikeModalOpen(false)}
                />
            )}
            {repostModalOpen && (
                <RepostModal
                    postData={post}
                    setPostData={setPost}
                    close={() => setRepostModalOpen(false)}
                />
            )}
            {ratingModalOpen && (
                <RatingModal
                    itemType='post'
                    itemData={post}
                    updateItem={() => {
                        setPost({ ...post, totalRatings: totalRatings + (rated ? -1 : 1) })
                        setAccountReactions({ ...accountReactions, rated: !rated })
                    }}
                    close={() => setRatingModalOpen(false)}
                />
            )}
            {editPostModalOpen && (
                <EditPostModal
                    postData={post}
                    setPostData={setPost}
                    close={() => setEditPostModalOpen(false)}
                />
            )}
            {deletePostModalOpen && (
                <DeletePostModal
                    postId={id}
                    location={location}
                    close={() => setDeletePostModalOpen(false)}
                />
            )}
            {removePostModalOpen && (
                <RemovePostModal
                    postId={id}
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
