import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import DraftText from '@components/draft-js/DraftText'
import DeletePostModal from '@components/modals/DeletePostModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { dateCreated, timeSinceCreated, timeSinceCreatedShort } from '@src/Helpers'
import LoadingWheel from '@src/components/LoadingWheel'
import Comments from '@src/components/cards/Comments/Comments'
import AudioCard from '@src/components/cards/PostCard/AudioCard'
import CardCard from '@src/components/cards/PostCard/CardCard'
import EventCard from '@src/components/cards/PostCard/EventCard'
import GlassBeadGameCard from '@src/components/cards/PostCard/GlassBeadGameCard'
import ImagesCard from '@src/components/cards/PostCard/ImagesCard'
import PollCard from '@src/components/cards/PostCard/PollCard'
import PostSpaces from '@src/components/cards/PostCard/PostSpaces'
import UrlCard from '@src/components/cards/PostCard/UrlCard'
import EditPostModal from '@src/components/modals/EditPostModal'
import LikeModal from '@src/components/modals/LikeModal'
import RatingModal from '@src/components/modals/RatingModal'
import RepostModal from '@src/components/modals/RepostModal'
import {
    CommentIcon,
    DeleteIcon,
    EditIcon,
    LikeIcon,
    LinkIcon,
    RepostIcon,
    SourceIcon,
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
        setAlertModalOpen,
        setAlertMessage,
        setCreatePostModalSettings,
        setCreatePostModalOpen,
    } = useContext(AccountContext)
    const { spaceData, spacePostsFilters } = useContext(SpaceContext)
    const [postData, setPostData] = useState(post)
    const {
        id,
        type,
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
        Urls,
        Audios,
        GlassBeadGame,
    } = postData
    // const { topic, topicImage } = GlassBeadGame

    // modals
    const [menuOpen, setMenuOpen] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [repostModalOpen, setRepostModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(location === 'post-page')
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
    const [editPostModalOpen, setEditPostModalOpen] = useState(false)

    const [likeLoading, setLikeLoading] = useState(false)
    const mobileView = document.documentElement.clientWidth < 900
    const cookies = new Cookies()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    const showFooter = true // location !== 'link-modal'
    // const directSpaces = DirectSpaces.filter((s) => s.id !== 1)

    // change postData to array so consistent with post lists
    // const state = { post, posts: [], setPosts: () => console.log('') }

    // todo: store comments on post card so can be updated from other posts (linking)

    const history = useNavigate()
    const urlParams = Object.fromEntries(new URLSearchParams(useLocation().search))
    const params = { ...spacePostsFilters }
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

    function renderTopic() {
        const { topic, topicImage } = GlassBeadGame
        return (
            <Row centerY className={styles.topic}>
                {topicImage && <img src={topicImage} alt='' />}
                <h1>{topic}</h1>
            </Row>
        )
    }

    function linkNewPost() {
        if (loggedIn) {
            setCreatePostModalSettings({ sourceType: 'post', sourceId: id })
            setCreatePostModalOpen(true)
        } else {
            setAlertMessage('Log in to create new posts')
            setAlertModalOpen(true)
        }
    }

    // remove this useEffect alltogether if everything handled from props...?
    useEffect(() => {
        // console.log(post)
        setPostData(post)
    }, [post])

    return (
        <Column
            className={`${styles.post} ${styles[location]} ${styling && styles.styling}`}
            key={id}
            style={style}
        >
            <Row spaceBetween className={styles.header}>
                <Row centerY>
                    <ImageTitle
                        type='user'
                        imagePath={Creator.flagImagePath}
                        imageSize={32}
                        title={Creator.name}
                        fontSize={15}
                        link={`/u/${Creator.handle}/posts`}
                        style={{ marginRight: 5 }}
                        shadow
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
                    {location !== 'preview' && isOwnPost && (
                        <>
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
                                            <button
                                                type='button'
                                                onClick={() => setEditPostModalOpen(true)}
                                            >
                                                <EditIcon />
                                                Edit text
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setDeletePostModalOpen(true)}
                                            >
                                                <DeleteIcon />
                                                Delete post
                                            </button>
                                        </Column>
                                    </Column>
                                </CloseOnClickOutside>
                            )}
                        </>
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
                {title && <h1 className={styles.title}>{title}</h1>}
                {GlassBeadGame && GlassBeadGame.topic && renderTopic()}
                {text && collapse && (
                    <ShowMoreLess height={250} gradientColor='white'>
                        <DraftText stringifiedDraft={text} style={{ marginBottom: 10 }} />
                    </ShowMoreLess>
                )}
                {text && !collapse && (
                    <DraftText stringifiedDraft={text} style={{ marginBottom: 10 }} />
                )}
                {/* {todo: startTime && } */}
                {postData.Event && (
                    <EventCard postData={postData} setPostData={setPostData} location={location} />
                )}
                {['image', 'gbg-image', 'card-front', 'card-back'].includes(type) && (
                    <ImagesCard images={postData.Images.sort((a, b) => a.index - b.index)} />
                )}
                {type.includes('audio') && (
                    <AudioCard
                        id={postData.id}
                        url={Audios[0].url}
                        location={location}
                        style={{ height: 200, margin: '10px 0' }}
                    />
                )}
                {type === 'poll' && (
                    <PollCard
                        postData={postData}
                        setPostData={setPostData}
                        // todo: remove when state updated locally
                        location={location}
                        params={params}
                    />
                )}
                {type === 'glass-bead-game' && (
                    <GlassBeadGameCard postData={postData} location={location} />
                )}
                {type === 'card' && (
                    <CardCard postData={postData} setPostData={setPostData} location={location} />
                )}
                {Urls.length > 0 && (
                    <Column style={{ marginBottom: 10 }}>
                        {Urls.map((urlData) => (
                            <UrlCard
                                key={urlData.url}
                                type='post'
                                urlData={urlData}
                                style={{ marginTop: text ? 10 : 0 }}
                            />
                        ))}
                    </Column>
                )}
            </Column>
            {showFooter && (
                <Column className={styles.footer}>
                    <Row spaceBetween centerY>
                        <Row centerY className={styles.reactions}>
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
                                    <LinkIcon />
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
                                    <SourceIcon />
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
