import Audio from '@components/cards/PostCard/PostTypes/Audio'
import GlassBeadGame from '@components/cards/PostCard/PostTypes/GlassBeadGame2'
import UrlPreview from '@components/cards/PostCard/UrlPreview'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import ImageTitle from '@components/ImageTitle'
import DeletePostModal from '@components/modals/DeletePostModal'
import Row from '@components/Row'
import StatButton from '@components/StatButton'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import Comments from '@src/components/cards/Comments/Comments'
import LikeModal from '@src/components/cards/PostCard/LikeModal'
import LinkModal from '@src/components/cards/PostCard/LinkModal'
import PostSpaces from '@src/components/cards/PostCard/PostSpaces'
import EventCard from '@src/components/cards/PostCard/PostTypes/EventCard'
import Images from '@src/components/cards/PostCard/PostTypes/Images'
import PollCard from '@src/components/cards/PostCard/PostTypes/PollCard'
import RatingModal from '@src/components/cards/PostCard/RatingModal'
import RepostModal from '@src/components/cards/PostCard/RepostModal'
import EditPostModal from '@src/components/modals/EditPostModal'
import config from '@src/Config'
import { dateCreated, statTitle, timeSinceCreated, timeSinceCreatedShort } from '@src/Helpers'
import {
    CommentIcon,
    DeleteIcon,
    EditIcon,
    // ImageIcon,
    // InquiryIcon,
    LikeIcon,
    LinkIcon,
    // PrismIcon,
    RepostIcon,
    StarIcon,
    // TextIcon,
    // WeaveIcon,
    VerticalEllipsisIcon,
} from '@src/svgs/all'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function PostCard(props: {
    post: any
    index?: number
    location: 'post-page' | 'space-posts' | 'space-post-map' | 'user-posts' | 'preview'
    styling?: boolean
    style?: any
}): JSX.Element {
    const { post, index, location, styling, style } = props
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
        accountRating,
        accountRepost,
        accountLink,
        Creator,
        DirectSpaces,
        Urls,
        Audios,
        GlassBeadGame2,
    } = postData
    // const { topic, topicImage } = GlassBeadGame2

    // modals
    const [menuOpen, setMenuOpen] = useState(false)
    const [otherSpacesModalOpen, setOtherSpacesModalOpen] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [repostModalOpen, setRepostModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(location === 'post-page')
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
    const [editPostModalOpen, setEditPostModalOpen] = useState(false)

    const [likeResponseLoading, setLikeResponseLoading] = useState(false)
    const mobileView = document.documentElement.clientWidth < 900
    const history = useNavigate()
    const cookies = new Cookies()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    // const directSpaces = DirectSpaces.filter((s) => s.id !== 1)

    // function findPostTypeIcon(postType) {
    //     switch (postType) {
    //         case 'text':
    //             return <TextIcon />
    //         case 'url':
    //             return <LinkIcon />
    //         case 'image':
    //             return <ImageIcon />
    //         case 'audio':
    //             return <AudioIcon />
    //         case 'event':
    //             return <CalendarIcon />
    //         case 'inquiry':
    //             return <InquiryIcon />
    //         case 'glass-bead-game':
    //             return <CastaliaIcon />
    //         case 'string':
    //             return <StringIcon />
    //         case 'weave':
    //             return <WeaveIcon />
    //         case 'prism':
    //             return <PrismIcon />
    //         default:
    //             return null
    //     }
    // }

    const urlParams = Object.fromEntries(new URLSearchParams(useLocation().search))
    const params = { ...spacePostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function toggleLike() {
        setLikeResponseLoading(true)
        const addingLike = !postData.accountLike
        const accessToken = cookies.get('accessToken')
        if (loggedIn && accessToken) {
            const data = { postId: postData.id } as any
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
                    setLikeResponseLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setLikeResponseLoading(false)
            setAlertMessage(`Log in to like posts`)
            setAlertModalOpen(true)
        }
    }

    function renderTopic() {
        const { topic, topicImage } = GlassBeadGame2
        return (
            <Row centerY className={styles.topic}>
                {topicImage && <img src={topicImage} alt='' />}
                <h1>{topic}</h1>
            </Row>
        )
    }

    // function startNewGbgFromPost() {
    //     if (loggedIn) {
    //         setCreatePostModalSettings({
    //             type: 'gbg-from-post',
    //             source: postData,
    //         })
    //         setCreatePostModalOpen(true)
    //     } else {
    //         setAlertMessage('Log in to create glass bead games from posts')
    //         setAlertModalOpen(true)
    //     }
    // }

    useEffect(() => setPostData(post), [post])

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
                    <Row>
                        <p className='grey' title={`Posted at ${dateCreated(createdAt)}`}>
                            {mobileView
                                ? timeSinceCreatedShort(createdAt)
                                : timeSinceCreated(createdAt)}
                        </p>
                        {createdAt !== updatedAt && (
                            <p className='grey' title={`Edited at ${dateCreated(updatedAt)}`}>
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
                    {/* {location !== 'preview' && (
                        <Row>
                            <p className='grey'>ID:</p>
                            <p style={{ margin: 0 }}>{id}</p>
                        </Row>
                    )} */}
                    {/* <Column
                        centerX
                        centerY
                        className={`${styles.postType} ${styles[type]}`}
                        title={type}
                    >
                        {findPostTypeIcon(type)}
                    </Column> */}
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
                                        {isOwnPost && (
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
                                        )}
                                    </Column>
                                </CloseOnClickOutside>
                            )}
                        </>
                    )}
                </Row>
            </Row>
            <Column className={styles.content}>
                {title && <h1 className={styles.title}>{title}</h1>}
                {GlassBeadGame2 && GlassBeadGame2.topic && renderTopic()}
                {text && <DraftText stringifiedDraft={text} style={{ marginBottom: 10 }} />}
                {/* {todo: startTime && } */}
                {postData.Event && (
                    <EventCard postData={postData} setPostData={setPostData} location={location} />
                )}
                {type.includes('image') && (
                    <Images images={postData.Images.sort((a, b) => a.index - b.index)} />
                )}
                {type.includes('audio') && (
                    <Audio
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
                {/* {type === 'glass-bead-game' && ( */}
                {type === 'glass-bead-game' && (
                    <GlassBeadGame
                        postData={postData}
                        setPostData={setPostData}
                        location={location}
                    />
                )}
                {Urls.length > 0 && (
                    <Column style={{ marginBottom: 10 }}>
                        {Urls.map((urlData) => (
                            <UrlPreview
                                key={urlData.url}
                                type='post'
                                urlData={urlData}
                                style={{ marginTop: 10 }}
                            />
                        ))}
                    </Column>
                )}
            </Column>
            <Column className={styles.footer}>
                {/* <Row spaceBetween> */}
                <Row centerY className={styles.statButtons}>
                    <StatButton
                        icon={<LikeIcon />}
                        iconSize={20}
                        text={totalLikes}
                        title={statTitle('Like', totalLikes || 0)}
                        color={accountLike && 'blue'}
                        disabled={location === 'preview'}
                        loading={likeResponseLoading}
                        onClickIcon={toggleLike}
                        onClickStat={() => setLikeModalOpen(true)}
                    />
                    <StatButton
                        icon={<CommentIcon />}
                        iconSize={20}
                        text={totalComments}
                        title={statTitle('Comment', totalComments || 0)}
                        // color={accountComment && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => {
                            if (loggedIn || totalComments) setCommentsOpen(!commentsOpen)
                            else {
                                setAlertMessage('Log in to comment on posts')
                                setAlertModalOpen(true)
                            }
                        }}
                    />
                    <StatButton
                        icon={<RepostIcon />}
                        iconSize={20}
                        text={totalReposts}
                        title={statTitle('Repost', totalReposts || 0)}
                        color={accountRepost && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setRepostModalOpen(true)}
                    />
                    <StatButton
                        icon={<StarIcon />}
                        iconSize={20}
                        text={totalRatings}
                        title={statTitle('Rating', totalRatings || 0)}
                        color={accountRating && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setRatingModalOpen(true)}
                    />
                    <StatButton
                        icon={<LinkIcon />}
                        iconSize={20}
                        text={totalLinks}
                        title={statTitle('Link', totalLinks || 0)}
                        color={accountLink && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setLinkModalOpen(true)}
                    />
                    {/* <button
                        className={styles.gbgFromPostButton}
                        type='button'
                        title='Create GBG from post'
                        // disabled={location === 'preview'}
                        onClick={startNewGbgFromPost}
                    >
                        <CastaliaIcon />
                    </button> */}
                    {/* {['prism', 'decision-tree'].includes(type) && (
                        <StatButton
                            icon={<ArrowRightIcon />}
                            iconSize={20}
                            text='Open game room'
                            disabled={location === 'preview'}
                            onClick={() => history(`/p/${id}`)}
                        />
                    )} */}
                    {likeModalOpen && (
                        <LikeModal
                            postData={postData}
                            setPostData={setPostData}
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
                            postData={postData}
                            setPostData={setPostData}
                            close={() => setRatingModalOpen(false)}
                        />
                    )}
                    {linkModalOpen && (
                        <LinkModal
                            type='post'
                            location={location}
                            postData={postData}
                            setPostData={setPostData}
                            close={() => setLinkModalOpen(false)}
                        />
                    )}
                </Row>

                {/* </Row> */}
                {commentsOpen && (
                    <Comments
                        postId={postData.id}
                        // type='post'
                        // location={location}
                        totalComments={totalComments}
                        incrementTotalComments={(value) =>
                            setPostData({ ...postData, totalComments: totalComments + value })
                        }
                        style={{ marginTop: 10 }}
                    />
                )}
            </Column>
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
