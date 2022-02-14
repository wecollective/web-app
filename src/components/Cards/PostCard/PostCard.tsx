/* eslint-disable no-param-reassign */
import React, { useState, useContext } from 'react'
import { useHistory, Link } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
import beadStyles from '@styles/components/cards/BeadCard.module.scss'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import PostCardUrlPreview from '@components/Cards/PostCard/PostCardUrlPreview'
import PostCardComments from '@components/Cards/PostCard/PostCardComments'
import ShowMoreLess from '@components/ShowMoreLess'
import Markdown from '@components/Markdown'
import ImageTitle from '@components/ImageTitle'
import Button from '@components/Button'
import StatButton from '@components/StatButton'
import BeadCard from '@src/components/Cards/BeadCard'
import Scrollbars from '@src/components/Scrollbars'
import PostCardLikeModal from '@components/Cards/PostCard/PostCardLikeModal'
import PostCardRepostModal from '@components/Cards/PostCard/PostCardRepostModal'
import PostCardRatingModal from '@components/Cards/PostCard/PostCardRatingModal'
import PostCardLinkModal from '@components/Cards/PostCard/PostCardLinkModal'
import DeletePostModal from '@components/Cards/PostCard/DeletePostModal'
import { timeSinceCreated, dateCreated, pluralise, statTitle } from '@src/Functions'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'
import { ReactComponent as CommentIconSVG } from '@svgs/comment-solid.svg'
import { ReactComponent as LikeIconSVG } from '@svgs/like.svg'
import { ReactComponent as RepostIconSVG } from '@svgs/repost.svg'
import { ReactComponent as RatingIconSVG } from '@svgs/star-solid.svg'
import { ReactComponent as ArrowRightIconSVG } from '@svgs/arrow-alt-circle-right-solid.svg'

const PostCard = (props: {
    post: any
    index?: number
    location: 'post-page' | 'space-posts' | 'space-post-map' | 'user-posts' | 'preview'
    style?: any
}): JSX.Element => {
    const { post, index, location, style } = props
    const { accountData, loggedIn } = useContext(AccountContext)
    const [postData, setPostData] = useState(post)
    const {
        id,
        type,
        text,
        url,
        urlImage,
        urlDomain,
        urlTitle,
        urlDescription,
        createdAt,
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
        GlassBeadGame,
    } = postData

    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [repostModalOpen, setRepostModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
    const beads = GlassBeadGame ? GlassBeadGame.GlassBeads.sort((a, b) => a.index - b.index) : []

    const history = useHistory()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    const urlPreview = urlImage || urlDomain || urlTitle || urlDescription
    const postSpaces = DirectSpaces.filter((space) => space.type === 'post' && space.id !== 1) // vs. 'repost'. todo: apply filter on backend
    const otherSpacesTitle = postSpaces
        .map((s) => s.handle)
        .filter((s, i) => i !== 0)
        .join(', ')
    const otherSpacesText = `and ${postSpaces.length - 1} other space${pluralise(
        postSpaces.length - 1
    )}`

    function toggleBeadAudio(beadIndex: number, reset?: boolean) {
        const bead = document.getElementById(`gbg-bead-${id}-${beadIndex}`) as HTMLDivElement
        if (bead) {
            const beadAudio = bead.getElementsByTagName('audio')[0] as HTMLAudioElement
            if (beadAudio.paused) {
                // stop all playing beads
                const liveBeads = document.getElementsByClassName('gbg-bead')
                for (let i = 0; i < liveBeads.length; i += 1) {
                    const b = liveBeads[i].getElementsByTagName('audio')[0] as HTMLAudioElement
                    b.pause()
                }
                // start selected bead
                if (reset) beadAudio.currentTime = 0
                bead.classList.remove(beadStyles.paused)
                beadAudio.play()
                beadAudio.addEventListener('ended', () => toggleBeadAudio(beadIndex + 1, true))
            } else {
                bead.classList.add(beadStyles.paused)
                beadAudio.pause()
            }
        }
    }

    return (
        <div className={`${styles.post} ${styles[location]}`} key={id} style={style}>
            {!!index && <div className={styles.index}>{index! + 1}</div>}
            <header>
                <Row centerY>
                    <ImageTitle
                        type='user'
                        imagePath={Creator.flagImagePath}
                        imageSize={32}
                        title={Creator.name}
                        fontSize={15}
                        link={`/u/${Creator.handle}`}
                        style={{ marginRight: 5 }}
                        shadow
                    />
                    {postSpaces[0] && (
                        <Row centerY>
                            <p className='grey'>to</p>
                            {postSpaces[0].state === 'active' ? (
                                <ImageTitle
                                    type='space'
                                    imagePath={postSpaces[0].flagImagePath}
                                    imageSize={32}
                                    title={postSpaces[0].handle}
                                    fontSize={15}
                                    link={`/s/${postSpaces[0].handle}/posts`}
                                    style={{ marginRight: 5 }}
                                    shadow
                                />
                            ) : (
                                <p className='grey'>{postSpaces[0].handle} (space deleted)</p>
                            )}
                        </Row>
                    )}
                    {postSpaces[1] && (
                        <p className='grey' title={otherSpacesTitle}>
                            {otherSpacesText}
                        </p>
                    )}
                    {location === 'preview' ? (
                        <>
                            <div className={styles.link}>
                                <LinkIconSVG />
                            </div>
                            <p className='grey'>now</p>
                        </>
                    ) : (
                        <>
                            <Link to={`/p/${id}`} className={styles.link}>
                                <LinkIconSVG />
                            </Link>
                            <p className='grey' title={dateCreated(createdAt)}>
                                {timeSinceCreated(createdAt)}
                            </p>
                        </>
                    )}
                </Row>
                <Row>
                    <div className={`${styles.postType} ${styles[type]}`}>
                        {type.toLowerCase().split('-').join(' ')}
                    </div>
                    {/* todo: move to corner drop down button */}
                    {isOwnPost && (
                        <div
                            className={styles.delete}
                            role='button'
                            tabIndex={0}
                            onClick={() => setDeletePostModalOpen(true)}
                            onKeyDown={() => setDeletePostModalOpen(true)}
                        >
                            Delete
                        </div>
                    )}
                </Row>
            </header>
            <div className={styles.content}>
                <Row>
                    {type === 'glass-bead-game' && GlassBeadGame.topicImage && (
                        <img className={styles.topicImage} src={GlassBeadGame.topicImage} alt='' />
                    )}
                    <Column>
                        {type === 'glass-bead-game' && <b>{GlassBeadGame.topic}</b>}
                        {text && (
                            <Column style={{ marginBottom: 10 }}>
                                <ShowMoreLess height={150}>
                                    <Markdown text={text} />
                                </ShowMoreLess>
                            </Column>
                        )}
                    </Column>
                </Row>
                {urlPreview && (
                    <PostCardUrlPreview
                        url={url}
                        urlImage={urlImage}
                        urlDomain={urlDomain}
                        urlTitle={urlTitle}
                        urlDescription={urlDescription}
                    />
                )}
                {type === 'glass-bead-game' && (
                    <Column className={styles.gbgContent}>
                        <Row className={styles.gbgButtons}>
                            <Button
                                text='Open game room'
                                color='aqua'
                                size='small'
                                onClick={() => history.push(`/p/${id}`)}
                            />
                        </Row>
                        {beads.length > 0 && (
                            <Scrollbars className={`${styles.gbgBeads} row`}>
                                {beads.map((bead, beadIndex) => (
                                    <BeadCard
                                        key={bead.id}
                                        postId={id}
                                        bead={bead}
                                        index={beadIndex + 1}
                                        toggleAudio={toggleBeadAudio}
                                    />
                                ))}
                            </Scrollbars>
                        )}
                    </Column>
                )}
                <div className={styles.statButtons}>
                    <StatButton
                        icon={<LikeIconSVG />}
                        iconSize={18}
                        text={totalLikes}
                        title={statTitle('Like', totalLikes)}
                        color={accountLike && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setLikeModalOpen(true)}
                    />
                    <StatButton
                        icon={<CommentIconSVG />}
                        iconSize={18}
                        text={totalComments}
                        title={statTitle('Comment', totalComments)}
                        // color={accountComment && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setCommentsOpen(!commentsOpen)}
                    />
                    <StatButton
                        icon={<RepostIconSVG />}
                        iconSize={18}
                        text={totalReposts}
                        title={statTitle('Repost', totalReposts)}
                        color={accountRepost && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setRepostModalOpen(true)}
                    />
                    <StatButton
                        icon={<RatingIconSVG />}
                        iconSize={18}
                        text={totalRatings}
                        title={statTitle('Rating', totalRatings)}
                        color={accountRating && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setRatingModalOpen(true)}
                    />
                    <StatButton
                        icon={<LinkIconSVG />}
                        iconSize={18}
                        text={totalLinks}
                        title={statTitle('Link', totalLinks)}
                        color={accountLink && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setLinkModalOpen(true)}
                    />
                    {['prism', 'decision-tree'].includes(type) && ( // 'glass-bead-game'
                        <StatButton
                            icon={<ArrowRightIconSVG />}
                            iconSize={18}
                            text='Open game room'
                            disabled={location === 'preview'}
                            onClick={() => history.push(`/p/${id}`)}
                        />
                    )}
                    {likeModalOpen && (
                        <PostCardLikeModal
                            close={() => setLikeModalOpen(false)}
                            postData={postData}
                            setPostData={setPostData}
                        />
                    )}
                    {repostModalOpen && (
                        <PostCardRepostModal
                            close={() => setRepostModalOpen(false)}
                            postData={postData}
                            setPostData={setPostData}
                        />
                    )}
                    {ratingModalOpen && (
                        <PostCardRatingModal
                            close={() => setRatingModalOpen(false)}
                            postData={postData}
                            setPostData={setPostData}
                        />
                    )}
                    {linkModalOpen && (
                        <PostCardLinkModal
                            close={() => setLinkModalOpen(false)}
                            postData={postData}
                            setPostData={setPostData}
                        />
                    )}
                </div>
                {commentsOpen && (
                    <PostCardComments
                        postId={postData.id}
                        totalComments={totalComments}
                        setTotalComments={() => null}
                    />
                )}
                {deletePostModalOpen && (
                    <DeletePostModal
                        postId={postData.id}
                        close={() => setDeletePostModalOpen(false)}
                    />
                )}
            </div>
        </div>
    )
}

PostCard.defaultProps = {
    index: null,
    style: null,
}

export default PostCard

// const [likePreviewOpen, setLikePreviewOpen] = useState(false)
// const [repostPreviewOpen, setRepostPreviewOpen] = useState(false)
// const [ratingPreviewOpen, setRatingPreviewOpen] = useState(false)
// const [linkPreviewOpen, setLinkPreviewOpen] = useState(false)
// const [reactionsOpen, setReactionsOpen] = useState(false)

/* {reactionsOpen && (
    <PostCardReactions
        postData={postData}
        totalReactions={totalReactions}
        totalLikes={totalLikes}
        totalRatings={totalRatings}
        totalRatingPoints={totalRatingPoints}
        totalReposts={totalReposts}
        totalLinks={totalLinks}
        accountLike={accountLike}
        accountRating={accountRating}
        accountRepost={accountRepost}
        accountLink={accountLink}
        setTotalReactions={setTotalReactions}
        setTotalLikes={setTotalLikes}
        setTotalRatings={setTotalRatings}
        setTotalRatingPoints={setTotalRatingPoints}
        setTotalReposts={setTotalReposts}
        setTotalLinks={setTotalLinks}
        setAccountLike={setAccountLike}
        setAccountRating={setAccountRating}
        setAccountRepost={setAccountRepost}
        setAccountLink={setAccountLink}
        blockedSpaces={blockedSpaces}
        setBlockedSpaces={setBlockedSpaces}
    />
)} */

/* <div
    className={styles.interactItem}
    role='button'
    tabIndex={0}
    onClick={() => setReactionsOpen(!reactionsOpen)}
    onKeyDown={() => setReactionsOpen(!reactionsOpen)}
>
    <img
        className={`${styles.icon} ${
            (accountLike ||
                accountRating ||
                accountRepost ||
                (accountLink && accountLink > 0)) &&
            styles.selected
        }`}
        src='/icons/fire-alt-solid.svg'
        alt=''
    />
    <span className='greyText'>{totalReactions} Reactions</span>
</div> */
/* <div
    className={styles.interactItem}
    role='button'
    tabIndex={0}
    onClick={() => setCommentsOpen(!commentsOpen)}
    onKeyDown={() => setCommentsOpen(!commentsOpen)}
>
    <img className={styles.icon} src='/icons/comment-solid.svg' alt='' />
    <span className='greyText'>{totalComments} Comments</span>
</div>

// function syncPostState() {
//     setReactionsOpen(false)
//     setCommentsOpen(false)
//     setTotalComments(total_comments)
//     setTotalReactions(total_reactions)
//     setTotalLikes(total_likes)
//     setTotalRatings(total_ratings)
//     setTotalRatingPoints(total_rating_points)
//     setTotalReposts(total_reposts)
//     setTotalLinks(total_links)
//     setAccountLike(account_like)
//     setAccountRating(account_rating)
//     setAccountRepost(account_repost)
//     setAccountLink(account_link)
//     if (DirectSpaces && IndirectSpaces) {
//         setBlockedSpaces([
//             ...DirectSpaces.map((s) => s.handle),
//             ...IndirectSpaces.map((s) => s.handle),
//         ])
//     }
// }

// useEffect(() => {
//     if (postData.id) syncPostState()
// }, [postData.id])

// // local post state
// const [totalComments, setTotalComments] = useState<number | undefined>(0)
// const [totalReactions, setTotalReactions] = useState<number | undefined>(0)
// const [totalLikes, setTotalLikes] = useState<number | undefined>(0)
// const [totalRatings, setTotalRatings] = useState<number | undefined>(0)
// const [totalRatingPoints, setTotalRatingPoints] = useState<number | undefined>(0)
// const [totalReposts, setTotalReposts] = useState<number | undefined>(0)
// const [totalLinks, setTotalLinks] = useState<number | undefined>(0)
// // TODO: change account state below to true/false booleans
// const [accountLike, setAccountLike] = useState<number | undefined>(0)
// const [accountRating, setAccountRating] = useState<number | undefined>(0)
// const [accountRepost, setAccountRepost] = useState<number | undefined>(0)
// const [accountLink, setAccountLink] = useState<number | undefined>(0)

// const {
//     id,
//     creator,
//     type,
//     text,
//     url,
//     urlImage,
//     urlDomain,
//     urlTitle,
//     urlDescription,
//     createdAt,
//     total_comments,
//     total_reactions,
//     total_likes,
//     total_ratings,
//     total_rating_points,
//     total_reposts,
//     total_links,
//     account_like,
//     account_rating,
//     account_repost,
//     account_link,
//     DirectSpaces,
//     IndirectSpaces,
//     GlassBeadGame,
//     IncomingLinks,
//     OutgoingLinks,
// } = postData

/* {type === 'glass-bead' && (
    <div
        className={styles.interactItem}
        role='button'
        tabIndex={0}
        onClick={() => createPostFromTurn()}
        onKeyDown={() => createPostFromTurn()}
    >
        <img
            className={`${styles.icon} ${
                accountTurn > 0 && styles.selected
            }`}
            src='/icons/arrow-alt-circle-right-solid.svg'
            alt=''
        />
        <span className='greyText'>Add turn</span>
    </div>
)} */

// function createPostFromTurn() {
//     if (loggedIn && creator) {
//         const data = {
//             creatorName: creator.name,
//             creatorHandle: creator.handle,
//             creatorFlagImagePath: creator.flagImagePath,
//             postId: id,
//         }
//         setCreatePostFromTurn(true)
//         setCreatePostFromTurnData(data)
//         setCreatePostModalOpen(true)
//     } else {
//         setAlertMessage('Log in to add a turn')
//         setAlertModalOpen(true)
//     }
// }

// {!pins &&
//     <div className={`${styles.postInteractItem} ${styles.opacity50}`}>{/* onClick={ pinPost } */}
//         <img className={styles.postIcon} src="/icons/thumbtack-solid.svg" alt=''/>
//         <span>Pin post</span>
//     </div>
// }

// function pinPost() {
//     axios({ method: 'put', url: config.apiURL + '/pinpost', data: { id } })
//         //.then(setTimeout(() => { updatePosts() }, 100))
//         .catch(error => { console.log(error) })
// }

// function unpinPost() {
//     axios({ method: 'put', url: config.apiURL + '/unpinpost', data: { id } })
//         //.then(setTimeout(() => { updatePosts() }, 100))
//         .catch(error => { console.log(error) })
// }

/* {pins && <div className={styles.pinFlag} onClick={ unpinPost }></div>} */
