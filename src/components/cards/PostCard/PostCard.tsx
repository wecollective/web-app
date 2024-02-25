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
import Game from '@components/cards/PostCard/Game'
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
import {
    Post,
    dateCreated,
    getGameType,
    includesGame,
    timeSinceCreated,
    timeSinceCreatedShort,
} from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
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
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

// todo: try firing off account reactions request before post block reuest for all media here
function PostCard(props: {
    post: Post
    setPost: (post: Post) => void
    onDelete: (id: number) => void
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
    const { post, setPost, location, collapse, styling, style, onDelete } = props
    const { accountData, loggedIn, updateDragItem, alert, setCreatePostModalSettings } =
        useContext(AccountContext)
    const { spaceData, postFilters } = useContext(SpaceContext)
    const {
        id,
        type,
        mediaTypes,
        title,
        text,
        createdAt,
        updatedAt,
        totalLinks,
        Creator,
        DirectSpaces,
        UrlBlocks,
        ImageBlocks,
        AudioBlocks,
        Event,
        Image,
        Audio,
        Url,
    } = post
    const [totalLikes, setTotalLikes] = useState(post.totalLikes)
    const [totalComments, setTotalComments] = useState(post.totalComments)
    const [totalRatings, setTotalRatings] = useState(post.totalRatings)
    const [totalReposts, setTotalReposts] = useState(post.totalReposts)
    const [visible, setVisible] = useState(false)
    const [buttonsDisabled, setButtonsDisabled] = useState(true)
    const [accountReactions, setAccountReactions] = useState<any>({})
    const { liked, rated, reposted, commented, linked } = accountReactions
    const [parentLinks, setParentLinks] = useState<any>(null)
    const [likeLoading, setLikeLoading] = useState(false)
    const [draggable, setDraggable] = useState(['post', 'comment', 'bead'].includes(type))
    const [topicImage, setTopicImage] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [repostModalOpen, setRepostModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(location === 'post-page')
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
    const [editPostModalOpen, setEditPostModalOpen] = useState(false)
    const [removePostModalOpen, setRemovePostModalOpen] = useState(false)
    const isBlock = type.includes('block')
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
        if (types.length) {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .get(
                    `${
                        config.apiURL
                    }/account-reactions?postType=post&postId=${id}&types=${types.join(',')}`,
                    options
                )
                .then((res) => {
                    setAccountReactions(res.data)
                    setButtonsDisabled(false)
                })
                .catch((error) => console.log(error))
        } else {
            setAccountReactions({ liked: 0, rated: 0, reposted: 0, commented: 0, linked: 0 })
            setButtonsDisabled(false)
        }
    }

    function getAccountReaction(reaction: string) {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        setTimeout(() => {
            axios
                .get(`${config.apiURL}/account-reactions?postId=${id}&types=${reaction}`, options)
                .then((res) =>
                    setAccountReactions({
                        ...accountReactions,
                        [reaction]: res.data[`${reaction}ed`],
                    })
                )
                .catch((error) => console.log(error))
        }, 2000)
    }

    function getParentLinks() {
        axios
            .get(`${config.apiURL}/parent-links?postId=${id}`)
            .then((res) => setParentLinks(res.data))
            .catch((error) => console.log(error))
    }

    function addDragEvents() {
        // todo: fix mouseenter not firing when leaving bead back to post
        const postCard = document.getElementById(`post-${id}`)
        postCard?.addEventListener('mouseenter', () => {
            // todo: add image
            // let image = ''
            // if (type === 'url' && urlBlocks[0]) image = urlBlocks[0].Url.image
            // if (type === 'image' && imageBlocks[0]) image = imageBlocks[0].Image.url
            updateDragItem({ type: 'post', data: post })
        })
        postCard?.addEventListener('dragstart', (e) => {
            postCard.classList.add(styles.dragging)
            // updateDragItem({ type: 'post', data: post })
            const dragItem = document.getElementById('drag-item')
            e.dataTransfer?.setDragImage(dragItem!, 50, 50)
        })
        postCard?.addEventListener('dragend', () => {
            postCard.classList.remove(styles.dragging)
        })
        // add drag disabled regions
        const dragDisabledRegions = Array.from(
            document.getElementsByClassName(`post-${id}-drag-disabled`)
        )
        dragDisabledRegions.forEach((region) => {
            region.addEventListener('mouseenter', () => setDraggable(false))
            region.addEventListener('mouseleave', () => setDraggable(true))
        })
    }

    function toggleLike() {
        setLikeLoading(true)
        if (loggedIn) {
            const data = { type, id } as any
            if (!liked) data.spaceId = location.includes('space') ? spaceData.id : null
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/${liked ? 'remove' : 'add'}-like`, data, options)
                .then(() => {
                    setTotalLikes(totalLikes + (liked ? -1 : 1))
                    setAccountReactions({ ...accountReactions, liked: !liked })
                    setLikeLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setLikeLoading(false)
            alert(`Log in to like posts`)
        }
    }

    function linkNewPost() {
        if (loggedIn) {
            setCreatePostModalSettings({ type: 'post', source: { type: 'post', id } })
        } else {
            alert('Log in to link posts')
        }
    }

    useEffect(() => {
        setVisible(true)
        if (loggedIn) getAccountReactions()
        else setButtonsDisabled(false)
        if (!['post', 'chat-message'].includes(type)) getParentLinks()
        if (['post', 'comment', 'bead'].includes(type)) addDragEvents()
    }, [])

    return (
        <Column
            key={id}
            id={`post-${id}`}
            className={`${styles.post} ${visible && styles.visible} ${styles[location]} ${
                styling && styles.styling
            }`}
            style={style}
            // style={{ ...style, backgroundColor: color }}
            draggable={draggable}
        >
            {/* <div className={styles.watermark} /> */}
            {parentLinks && (
                <Row centerX>
                    {parentLinks.rootId && (
                        <Link to={`/p/${parentLinks.rootId}`} className={styles.rootLink}>
                            <AnglesUpIcon />
                            <p style={{ marginLeft: 5 }}>Root</p>
                        </Link>
                    )}
                    <Link to={`/p/${parentLinks.parentId}`} className={styles.parentLink}>
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
                    {showDropDown && !isBlock && (
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
                {(title || text) && (
                    <Column className={`post-${id}-drag-disabled`} style={{ cursor: 'text' }}>
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
                                    <ShowMoreLess
                                        height={500}
                                        gradientColor='white'
                                        style={{ marginBottom: 10 }}
                                    >
                                        <DraftText text={text} />
                                    </ShowMoreLess>
                                ) : (
                                    <DraftText text={text} style={{ marginBottom: 10 }} />
                                )}
                            </>
                        )}
                    </Column>
                )}
                {!isBlock && mediaTypes.includes('url') && (
                    <Urls
                        key={updatedAt}
                        postId={id}
                        urlBlocks={UrlBlocks?.map((block) => {
                            return { ...block.Post, Url: block.Post.MediaLink.Url }
                        })}
                        style={{ marginBottom: 10 }}
                    />
                )}
                {!isBlock && mediaTypes.includes('image') && (
                    <Images
                        postId={id}
                        imageBlocks={ImageBlocks?.map((block) => {
                            return { ...block.Post, Image: block.Post.MediaLink.Image }
                        })}
                        style={{ marginBottom: 10 }}
                    />
                )}
                {!isBlock && mediaTypes.includes('audio') && (
                    <Audios
                        postId={id}
                        audioBlocks={AudioBlocks?.map((block) => {
                            return { ...block.Post, Audio: block.Post.MediaLink.Audio }
                        })}
                        style={{ marginBottom: 10 }}
                    />
                )}
                {Event && <EventCard post={post} location={location} />}
                {mediaTypes.includes('poll') && <PollCard postData={post} location={location} />}
                {includesGame(mediaTypes) && (
                    <Game
                        type={getGameType(mediaTypes)}
                        postId={id}
                        setTopicImage={setTopicImage}
                        isOwnPost={Creator.id === accountData.id}
                    />
                )}
                {mediaTypes.includes('card') && <Card postId={id} />}
                {/* block posts */}
                {type === 'url-block' && (
                    <UrlCard type='post' urlData={Url} style={{ marginBottom: 10 }} />
                )}
                {type === 'image-block' && (
                    <img
                        className={styles.image}
                        src={Image.url}
                        alt='block'
                        style={{ marginBottom: 10 }}
                    />
                )}
                {type === 'audio-block' && (
                    <AudioCard
                        id={Audio.id}
                        url={Audio.url}
                        staticBars={250}
                        location='post'
                        style={{ height: 160, width: '100%', marginBottom: 10 }}
                    />
                )}
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
                                    alert('Log in to comment on posts')
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
                            onClick={() =>
                                history(
                                    `/linkmap?item=${
                                        type === 'comment' ? 'comment' : 'post'
                                    }&id=${id}`
                                )
                            }
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
                        {type === 'post' && (
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
                        )}
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
            <Column className={`post-${id}-drag-disabled`} style={{ cursor: 'default' }}>
                {commentsOpen && (
                    <Comments
                        post={post}
                        location={location}
                        totalComments={totalComments}
                        incrementTotalComments={(value) => {
                            setTotalComments(totalComments + value)
                            if (value < 1) getAccountReaction('comment')
                            else setAccountReactions({ ...accountReactions, commented: true })
                        }}
                        style={{ margin: '10px -8px 0 -8px' }}
                    />
                )}
                {likeModalOpen && (
                    <LikeModal
                        itemType={type}
                        itemData={{ ...post, liked: accountReactions.liked }}
                        updateItem={() => {
                            setTotalLikes(totalLikes + (liked ? -1 : 1))
                            setAccountReactions({ ...accountReactions, liked: !liked })
                        }}
                        close={() => setLikeModalOpen(false)}
                    />
                )}
                {repostModalOpen && (
                    <RepostModal
                        post={post}
                        updatePost={(newReposts) => {
                            setTotalReposts(totalReposts + newReposts)
                            setAccountReactions({ ...accountReactions, reposted: true })
                        }}
                        close={() => setRepostModalOpen(false)}
                    />
                )}
                {ratingModalOpen && (
                    <RatingModal
                        itemType={type}
                        itemData={{ ...post, rated: accountReactions.rated }}
                        updateItem={() => {
                            setTotalRatings(totalRatings + (rated ? -1 : 1))
                            setAccountReactions({ ...accountReactions, rated: !rated })
                        }}
                        close={() => setRatingModalOpen(false)}
                    />
                )}
                {editPostModalOpen && (
                    <EditPostModal
                        post={post}
                        setPost={setPost}
                        close={() => setEditPostModalOpen(false)}
                    />
                )}
                {deletePostModalOpen && (
                    <DeletePostModal
                        post={post}
                        onDelete={onDelete}
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
        </Column>
    )
}

PostCard.defaultProps = {
    collapse: false,
    styling: false,
    style: null,
}

export default PostCard
