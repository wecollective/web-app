/* eslint-disable no-param-reassign */
import React, { useState, useContext } from 'react'
import * as d3 from 'd3'
import { useHistory, Link } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
import colors from '@styles/Colors.module.scss'
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
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
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
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'

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
    const [audioPlaying, setAudioPlaying] = useState(false)
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

    function toggleAudio() {
        const audio = d3.select(`#post-audio-${id}`).node()
        if (audio) {
            if (audio.paused) {
                // pause all playing audio
                d3.selectAll('audio')
                    .nodes()
                    .forEach((node) => node.pause())
                audio.play()
            } else audio.pause()
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
                {type === 'audio' && (
                    <Column className={styles.audioContent}>
                        <AudioVisualiser
                            audioElementId={`post-audio-${id}`}
                            audioURL={url}
                            staticBars={1200}
                            staticColor={colors.audioVisualiserColor}
                            dynamicBars={160}
                            dynamicColor={colors.audioVisualiserColor}
                            style={{ width: '100%', height: 80 }}
                        />
                        <Row centerY>
                            <button
                                className={styles.playButton}
                                type='button'
                                aria-label='toggle-audio'
                                onClick={toggleAudio}
                            >
                                {audioPlaying ? <PauseIconSVG /> : <PlayIconSVG />}
                            </button>
                            <AudioTimeSlider
                                audioElementId={`post-audio-${id}`}
                                audioURL={url}
                                onPlay={() => setAudioPlaying(true)}
                                onPause={() => setAudioPlaying(false)}
                                onEnded={() => setAudioPlaying(false)}
                            />
                        </Row>
                    </Column>
                )}
                {type === 'glass-bead-game' && (
                    <Column className={styles.gbgContent}>
                        <Row className={styles.gbgButtons}>
                            <Button
                                text='Open game room'
                                color='aqua'
                                size='medium'
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
                                        style={{ marginRight: 12 }}
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
