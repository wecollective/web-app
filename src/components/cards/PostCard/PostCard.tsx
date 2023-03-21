import Audio from '@components/cards/PostCard/PostTypes/Audio'
import Event from '@components/cards/PostCard/PostTypes/Event'
import GlassBeadGame from '@components/cards/PostCard/PostTypes/GlassBeadGame'
import String from '@components/cards/PostCard/PostTypes/String'
import Text from '@components/cards/PostCard/PostTypes/Text'
import Url from '@components/cards/PostCard/PostTypes/Url'
import Weave from '@components/cards/PostCard/PostTypes/Weave'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import DeletePostModal from '@components/modals/DeletePostModal'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import StatButton from '@components/StatButton'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import Comments from '@src/components/cards/Comments/Comments'
import LikeModal from '@src/components/cards/PostCard/LikeModal'
import LinkModal from '@src/components/cards/PostCard/LinkModal'
import Images from '@src/components/cards/PostCard/PostTypes/Images'
import Poll from '@src/components/cards/PostCard/PostTypes/Poll'
import RatingModal from '@src/components/cards/PostCard/RatingModal'
import RepostModal from '@src/components/cards/PostCard/RepostModal'
import EditPostModal from '@src/components/modals/EditPostModal'
import config from '@src/Config'
import { dateCreated, statTitle, timeSinceCreated, timeSinceCreatedShort } from '@src/Helpers'
import {
    ArrowRightIcon,
    // AudioIcon,
    // CalendarIcon,
    // CastaliaIcon,
    CommentIcon,
    DeleteIcon,
    EditIcon,
    ExpandIcon,
    // ImageIcon,
    // InquiryIcon,
    LikeIcon,
    LinkIcon,
    // PrismIcon,
    RepostIcon,
    StarIcon,
    StringIcon,
    // TextIcon,
    // WeaveIcon,
    VerticalEllipsisIcon,
} from '@src/svgs/all'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

const PostCard = (props: {
    post: any
    index?: number
    location: 'post-page' | 'space-posts' | 'space-post-map' | 'user-posts' | 'preview'
    styling?: boolean
    style?: any
}): JSX.Element => {
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
    } = postData

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
    const history = useHistory()
    const cookies = new Cookies()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    const directSpaces = DirectSpaces.filter((s) => s.id !== 1)
    const otherSpacesTitle = DirectSpaces.map((s) => s.handle)
        .filter((s, i) => i !== 0)
        .join(', ')

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

    return (
        <Column
            className={`${styles.post} ${styles[location]} ${styling && styles.styling}`}
            key={id}
            style={style}
        >
            {!!index && <div className={styles.index}>{index! + 1}</div>}
            <Row spaceBetween className={styles.header}>
                <Row centerY className={styles.postSpaces}>
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
                    {directSpaces[0] && (
                        <Row centerY>
                            <p className='grey'>to</p>
                            {directSpaces[0].state === 'active' ? (
                                <ImageTitle
                                    type='space'
                                    imagePath={directSpaces[0].flagImagePath}
                                    imageSize={32}
                                    title={directSpaces[0].name}
                                    fontSize={15}
                                    link={`/s/${directSpaces[0].handle}/posts`}
                                    style={{ marginRight: 5 }}
                                    shadow
                                />
                            ) : (
                                <p className='grey'>{directSpaces[0].handle} (space deleted)</p>
                            )}
                        </Row>
                    )}
                    {directSpaces[1] && (
                        <>
                            <button
                                type='button'
                                className={styles.otherSpacesButton}
                                title={otherSpacesTitle}
                                onClick={() => setOtherSpacesModalOpen(true)}
                            >
                                <p>+{directSpaces.length - 1}</p>
                            </button>
                            {otherSpacesModalOpen && (
                                <Modal centered close={() => setOtherSpacesModalOpen(false)}>
                                    <h2>Posted to</h2>
                                    {directSpaces.map((space) => (
                                        <ImageTitle
                                            key={space.id}
                                            type='space'
                                            imagePath={space.flagImagePath}
                                            imageSize={32}
                                            title={space.name}
                                            fontSize={15}
                                            link={`/s/${space.handle}/posts`}
                                            style={{ marginBottom: 10 }}
                                            shadow
                                        />
                                    ))}
                                    {/* {IndirectSpaces[0] && (
                                        <Column centerX style={{ marginTop: 10 }}>
                                            <h2>Indirect spaces</h2>
                                            {IndirectSpaces.map((space) => (
                                                <ImageTitle
                                                    type='space'
                                                    imagePath={space.flagImagePath}
                                                    imageSize={32}
                                                    title={space.name}
                                                    fontSize={15}
                                                    link={`/s/${space.handle}/posts`}
                                                    style={{ marginBottom: 10 }}
                                                    shadow
                                                />
                                            ))}
                                        </Column>
                                    )} */}
                                </Modal>
                            )}
                        </>
                    )}
                    {location === 'preview' ? (
                        <p className='grey'>now</p>
                    ) : (
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
                    )}
                </Row>
                <Row centerY>
                    {location !== 'preview' && (
                        <Row>
                            <p className='grey'>ID:</p>
                            <p style={{ margin: 0 }}>{id}</p>
                        </Row>
                    )}
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
                {['text', 'string-text'].includes(type) && <Text postData={postData} />}
                {['url', 'string-url'].includes(type) && <Url postData={postData} />}
                {/* {['image', 'string-image'].includes(type) && <Image postData={postData} />} */}
                {['image', 'string-image'].includes(type) && (
                    <Images images={postData.PostImages.sort((a, b) => a.index - b.index)} />
                )}
                {/* {['audio', 'string-audio'].includes(type) && <Audio postData={postData} />} */}
                {['audio', 'string-audio'].includes(type) && (
                    <Audio id={postData.id} url={postData.url} location={location} />
                )}
                {type === 'event' && (
                    <Event postData={postData} setPostData={setPostData} location={location} />
                )}
                {type === 'inquiry' && (
                    <Poll
                        postData={postData}
                        setPostData={setPostData}
                        // todo: remove when state updated locally
                        location={location}
                        params={params}
                    />
                )}
                {type === 'glass-bead-game' && (
                    <GlassBeadGame
                        postData={postData}
                        setPostData={setPostData}
                        location={location}
                    />
                )}
                {type === 'string' && (
                    <String postData={postData} setPostData={setPostData} location={location} />
                )}
                {type === 'weave' && (
                    <Weave postData={postData} setPostData={setPostData} location={location} />
                )}
            </Column>
            <Column className={styles.footer}>
                <Row spaceBetween>
                    <Row className={styles.statButtons}>
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
                        {['prism', 'decision-tree'].includes(type) && ( // 'glass-bead-game'
                            <StatButton
                                icon={<ArrowRightIcon />}
                                iconSize={20}
                                text='Open game room'
                                disabled={location === 'preview'}
                                onClick={() => history.push(`/p/${id}`)}
                            />
                        )}
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
                    <Row className={styles.otherButtons}>
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
                        {location !== 'post-page' && (
                            <Link
                                to={`/p/${id}`}
                                className={styles.link}
                                title='Open post page'
                                style={location === 'preview' ? { pointerEvents: 'none' } : null}
                            >
                                <ExpandIcon />
                            </Link>
                        )}
                    </Row>
                </Row>
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
