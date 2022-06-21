/* eslint-disable no-param-reassign */
import React, { useState, useContext } from 'react'
import * as d3 from 'd3'
import axios from 'axios'
import config from '@src/Config'
import Cookies from 'universal-cookie'
import { useHistory, Link } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
import colors from '@styles/Colors.module.scss'
import {
    timeSinceCreated,
    dateCreated,
    pluralise,
    statTitle,
    formatTimeDHM,
    formatTimeMDYT,
} from '@src/Helpers'
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
import FlagImageHighlights from '@components/FlagImageHighlights'
import Modal from '@components/Modal'
import ImageModal from '@components/modals/ImageModal'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import PostCardLikeModal from '@components/Cards/PostCard/PostCardLikeModal'
import PostCardRepostModal from '@components/Cards/PostCard/PostCardRepostModal'
import PostCardRatingModal from '@components/Cards/PostCard/PostCardRatingModal'
import PostCardLinkModal from '@components/Cards/PostCard/PostCardLinkModal'
import DeletePostModal from '@components/modals/DeletePostModal'
import StringBeadCard from '@components/Cards/PostCard/StringBeadCard2'
import NextBeadModal from '@components/Cards/PostCard/NextBeadModal'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'
import { ReactComponent as CommentIconSVG } from '@svgs/comment-solid.svg'
import { ReactComponent as LikeIconSVG } from '@svgs/like.svg'
import { ReactComponent as RepostIconSVG } from '@svgs/repost.svg'
import { ReactComponent as RatingIconSVG } from '@svgs/star-solid.svg'
import { ReactComponent as ArrowRightIconSVG } from '@svgs/arrow-alt-circle-right-solid.svg'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'
import { ReactComponent as ClockIconSVG } from '@svgs/clock-solid.svg'
import { ReactComponent as CalendarIconSVG } from '@svgs/calendar-days-solid.svg'
import { ReactComponent as SuccessIconSVG } from '@svgs/check-circle-solid.svg'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'
import { ReactComponent as UsersIconSVG } from '@svgs/users-solid.svg'

const PostCard = (props: {
    post: any
    index?: number
    location: 'post-page' | 'space-posts' | 'space-post-map' | 'user-posts' | 'preview'
    style?: any
}): JSX.Element => {
    const { post, index, location, style } = props
    const { accountData, loggedIn, setAlertModalOpen, setAlertMessage } = useContext(AccountContext)
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
        Event,
        PostImages,
        StringPosts,
        Weave,
        StringPlayers,
    } = postData

    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [repostModalOpen, setRepostModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const [eventGoingModalOpen, setEventGoingModalOpen] = useState(false)
    const [eventInterestedModalOpen, setEventInterestedModalOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)
    // todo: sort on load like StringPlayers and use main const
    const beads = GlassBeadGame ? GlassBeadGame.GlassBeads.sort((a, b) => a.index - b.index) : []
    const images = PostImages.sort((a, b) => a.index - b.index)
    StringPosts.sort((a, b) => a.Link.index - b.Link.index)

    const history = useHistory()
    const cookies = new Cookies()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    const postSpaces = DirectSpaces.filter((space) => space.type === 'post' && space.id !== 1) // vs. 'repost'. todo: apply filter on backend
    const otherSpacesTitle = postSpaces
        .map((s) => s.handle)
        .filter((s, i) => i !== 0)
        .join(', ')
    const otherSpacesText = `and ${postSpaces.length - 1} other space${pluralise(
        postSpaces.length - 1
    )}`

    // events
    const goingToEvent = Event && Event.Going.map((u) => u.id).includes(accountData.id)
    const goingToEventImages = Event && Event.Going.map((u) => u.flagImagePath)
    const interestedInEvent = Event && Event.Interested.map((u) => u.id).includes(accountData.id)
    const interestedInEventImages = Event && Event.Interested.map((u) => u.flagImagePath)

    // multipleyer strings
    StringPlayers.sort((a, b) => a.UserPost.index - b.UserPost.index)
    const pendingPlayers = StringPlayers.filter((p) => p.UserPost.state === 'pending')
    function findCurrentPlayer() {
        if (Weave && Weave.privacy === 'only-selected-users') {
            const currentPlayerIndex = StringPosts.length % StringPlayers.length
            return StringPlayers[currentPlayerIndex]
        }
        return null
    }
    const currentPlayer = findCurrentPlayer()

    function openImageModal(imageId) {
        setSelectedImage(images.find((image) => image.id === imageId))
        setImageModalOpen(true)
    }

    function toggleAudio() {
        const audio = d3.select(`#post-audio-${id}-${location}`).node()
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

    function respondToEvent(response) {
        if (!loggedIn) {
            setAlertMessage('Log in to respond to events')
            setAlertModalOpen(true)
        } else {
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = {
                userName: accountData.name,
                userEmail: accountData.email,
                postId: id,
                eventId: Event.id,
                startTime: Event.startTime,
                response,
            }
            axios.post(`${config.apiURL}/respond-to-event`, data, options).then((res) => {
                if (res.data.message === 'UserEvent added') {
                    if (response === 'going') {
                        setPostData({
                            ...postData,
                            Event: {
                                ...Event,
                                Going: [...Event.Going, accountData],
                                Interested: [
                                    ...Event.Interested.filter((u) => u.id !== accountData.id),
                                ],
                            },
                        })
                    } else {
                        setPostData({
                            ...postData,
                            Event: {
                                ...Event,
                                Interested: [...Event.Interested, accountData],
                                Going: [...Event.Going.filter((u) => u.id !== accountData.id)],
                            },
                        })
                    }
                } else if (response === 'going') {
                    setPostData({
                        ...postData,
                        Event: {
                            ...Event,
                            Going: [...Event.Going.filter((u) => u.id !== accountData.id)],
                        },
                    })
                } else {
                    setPostData({
                        ...postData,
                        Event: {
                            ...Event,
                            Interested: [
                                ...Event.Interested.filter((u) => u.id !== accountData.id),
                            ],
                        },
                    })
                }
            })
        }
    }

    function findImageSize() {
        if (images.length === 1) return 'large'
        if (images.length === 2) return 'medium'
        return 'small'
    }

    return (
        <Column className={`${styles.post} ${styles[location]}`} key={id} style={style}>
            {!!index && <div className={styles.index}>{index! + 1}</div>}
            <Row spaceBetween className={styles.header}>
                <Row centerY className={styles.postSpaces}>
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
                    {location !== 'preview' && isOwnPost && (
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
            </Row>
            <Column className={styles.content}>
                {type === 'text' && (
                    <ShowMoreLess height={150}>
                        <Markdown text={text} />
                    </ShowMoreLess>
                )}
                {type === 'url' && (
                    <Column>
                        {text && (
                            <Column style={{ marginBottom: 10 }}>
                                <ShowMoreLess height={150}>
                                    <Markdown text={text} />
                                </ShowMoreLess>
                            </Column>
                        )}
                        <PostCardUrlPreview
                            url={url}
                            image={urlImage}
                            domain={urlDomain}
                            title={urlTitle}
                            description={urlDescription}
                        />
                    </Column>
                )}
                {type === 'image' && (
                    <Column>
                        <Column>
                            {text && (
                                <ShowMoreLess height={150}>
                                    <Markdown text={text} />
                                </ShowMoreLess>
                            )}
                            <Row centerX>
                                {images.length > 0 && (
                                    <Scrollbars className={`${styles.images} row`}>
                                        {images.map((image) => (
                                            <Column
                                                centerX
                                                className={`${styles.image} ${
                                                    styles[findImageSize()]
                                                }`}
                                                key={image.index}
                                            >
                                                <button
                                                    type='button'
                                                    onClick={() => openImageModal(image.id)}
                                                >
                                                    <img src={image.url} alt='' />
                                                </button>
                                                {image.caption && <p>{image.caption}</p>}
                                            </Column>
                                        ))}
                                    </Scrollbars>
                                )}
                            </Row>
                            {imageModalOpen && (
                                <ImageModal
                                    images={images}
                                    selectedImage={selectedImage}
                                    setSelectedImage={setSelectedImage}
                                    close={() => setImageModalOpen(false)}
                                />
                            )}
                        </Column>
                    </Column>
                )}
                {type === 'audio' && (
                    <Column>
                        {text && (
                            <ShowMoreLess height={150}>
                                <Markdown text={text} />
                            </ShowMoreLess>
                        )}
                        <AudioVisualiser
                            audioElementId={`post-audio-${id}-${location}`}
                            audioURL={url}
                            staticBars={1200}
                            staticColor={colors.audioVisualiserColor}
                            dynamicBars={160}
                            dynamicColor={colors.audioVisualiserColor}
                            style={{ height: 80, margin: '20px 0 10px 0' }}
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
                                audioElementId={`post-audio-${id}-${location}`}
                                audioURL={url}
                                location={location}
                                onPlay={() => setAudioPlaying(true)}
                                onPause={() => setAudioPlaying(false)}
                                onEnded={() => setAudioPlaying(false)}
                            />
                        </Row>
                    </Column>
                )}
                {type === 'event' && (
                    <Column>
                        <Row centerY className={styles.eventTitle}>
                            <CalendarIconSVG />
                            <h1>{Event.title}</h1>
                        </Row>
                        <Row centerY className={styles.eventTimes}>
                            <ClockIconSVG />
                            <p>{`${formatTimeMDYT(Event.startTime)} ${
                                Event.endTime ? `→ ${formatTimeMDYT(Event.endTime)}` : ''
                            }`}</p>
                            {Event.endTime && (
                                <p>{`(duration: ${formatTimeDHM(
                                    (new Date(Event.endTime).getTime() -
                                        new Date(Event.startTime).getTime()) /
                                        1000
                                )})`}</p>
                            )}
                        </Row>
                        {(Event.Going.length > 0 || Event.Interested.length > 0) && (
                            <Row style={{ marginTop: 10 }}>
                                {Event.Going.length > 0 && (
                                    <FlagImageHighlights
                                        type='user'
                                        imagePaths={goingToEventImages}
                                        imageSize={30}
                                        text={`${Event.Going.length} going`}
                                        onClick={() => setEventGoingModalOpen(true)}
                                        style={{ marginRight: 15 }}
                                        outline
                                    />
                                )}
                                {Event.Interested.length > 0 && (
                                    <FlagImageHighlights
                                        type='user'
                                        imagePaths={interestedInEventImages}
                                        imageSize={30}
                                        text={`${Event.Interested.length} interested`}
                                        onClick={() => setEventInterestedModalOpen(true)}
                                        outline
                                    />
                                )}
                            </Row>
                        )}
                        {eventGoingModalOpen && (
                            <Modal centered close={() => setEventGoingModalOpen(false)}>
                                <h1>Going to event</h1>
                                <Column>
                                    {Event.Going.map((user) => (
                                        <ImageTitle
                                            key={user.id}
                                            type='user'
                                            imagePath={user.flagImagePath}
                                            title={user.name}
                                            link={`/u/${user.handle}`}
                                            style={{ marginBottom: 10 }}
                                        />
                                    ))}
                                </Column>
                            </Modal>
                        )}
                        {eventInterestedModalOpen && (
                            <Modal centered close={() => setEventInterestedModalOpen(false)}>
                                <h1>Interested in event</h1>
                                <Column>
                                    {Event.Interested.map((user) => (
                                        <ImageTitle
                                            key={user.id}
                                            type='user'
                                            imagePath={user.flagImagePath}
                                            title={user.name}
                                            link={`/u/${user.handle}`}
                                            style={{ marginBottom: 10 }}
                                        />
                                    ))}
                                </Column>
                            </Modal>
                        )}
                        <Row style={{ marginTop: 10 }}>
                            <Button
                                text='Going'
                                color='aqua'
                                size='medium'
                                disabled={location === 'preview'}
                                icon={goingToEvent ? <SuccessIconSVG /> : undefined}
                                style={{ marginRight: 5 }}
                                onClick={() => respondToEvent('going')}
                            />
                            <Button
                                text='Interested'
                                color='aqua'
                                size='medium'
                                disabled={location === 'preview'}
                                icon={interestedInEvent ? <SuccessIconSVG /> : undefined}
                                onClick={() => respondToEvent('interested')}
                            />
                        </Row>
                        <Column style={{ marginTop: 10 }}>
                            <ShowMoreLess height={150}>
                                <Markdown text={text} />
                            </ShowMoreLess>
                        </Column>
                    </Column>
                )}
                {type === 'glass-bead-game' && (
                    <Column>
                        <Row>
                            {GlassBeadGame.topicImage && (
                                <img
                                    className={styles.topicImage}
                                    src={GlassBeadGame.topicImage}
                                    alt=''
                                />
                            )}
                            <Column>
                                <b>{GlassBeadGame.topic}</b>
                                {text && (
                                    <ShowMoreLess height={150}>
                                        <Markdown text={text} />
                                    </ShowMoreLess>
                                )}
                            </Column>
                        </Row>
                        {Event && (
                            <Column>
                                <Row centerY className={styles.eventTimes}>
                                    <ClockIconSVG />
                                    <p>{`${formatTimeMDYT(Event.startTime)} ${
                                        Event.endTime ? `→ ${formatTimeMDYT(Event.endTime)}` : ''
                                    }`}</p>
                                    {Event.endTime && (
                                        <p>{`(duration: ${formatTimeDHM(
                                            (new Date(Event.endTime).getTime() -
                                                new Date(Event.startTime).getTime()) /
                                                1000
                                        )})`}</p>
                                    )}
                                </Row>
                                {(Event.Going.length > 0 || Event.Interested.length > 0) && (
                                    <Row style={{ marginTop: 10 }}>
                                        {Event.Going.length > 0 && (
                                            <FlagImageHighlights
                                                type='user'
                                                imagePaths={goingToEventImages}
                                                imageSize={30}
                                                text={`${Event.Going.length} going`}
                                                onClick={() => setEventGoingModalOpen(true)}
                                                style={{ marginRight: 15 }}
                                                outline
                                            />
                                        )}
                                        {Event.Interested.length > 0 && (
                                            <FlagImageHighlights
                                                type='user'
                                                imagePaths={interestedInEventImages}
                                                imageSize={30}
                                                text={`${Event.Interested.length} interested`}
                                                onClick={() => setEventInterestedModalOpen(true)}
                                                outline
                                            />
                                        )}
                                    </Row>
                                )}
                                {eventGoingModalOpen && (
                                    <Modal centered close={() => setEventGoingModalOpen(false)}>
                                        <h1>Going to event</h1>
                                        <Column>
                                            {Event.Going.map((user) => (
                                                <ImageTitle
                                                    key={user.id}
                                                    type='user'
                                                    imagePath={user.flagImagePath}
                                                    title={user.name}
                                                    link={`/u/${user.handle}`}
                                                    style={{ marginBottom: 10 }}
                                                />
                                            ))}
                                        </Column>
                                    </Modal>
                                )}
                                {eventInterestedModalOpen && (
                                    <Modal
                                        centered
                                        close={() => setEventInterestedModalOpen(false)}
                                    >
                                        <h1>Interested in event</h1>
                                        <Column>
                                            {Event.Interested.map((user) => (
                                                <ImageTitle
                                                    key={user.id}
                                                    type='user'
                                                    imagePath={user.flagImagePath}
                                                    title={user.name}
                                                    link={`/u/${user.handle}`}
                                                    style={{ marginBottom: 10 }}
                                                />
                                            ))}
                                        </Column>
                                    </Modal>
                                )}
                                <Row style={{ marginTop: 10 }}>
                                    <Button
                                        text='Going'
                                        color='aqua'
                                        size='medium'
                                        disabled={location === 'preview'}
                                        icon={goingToEvent ? <SuccessIconSVG /> : undefined}
                                        style={{ marginRight: 5 }}
                                        onClick={() => respondToEvent('going')}
                                    />
                                    <Button
                                        text='Interested'
                                        color='aqua'
                                        size='medium'
                                        disabled={location === 'preview'}
                                        icon={interestedInEvent ? <SuccessIconSVG /> : undefined}
                                        onClick={() => respondToEvent('interested')}
                                    />
                                </Row>
                            </Column>
                        )}
                        <Row style={{ marginTop: 10 }}>
                            <Button
                                text='Open game room'
                                color='purple'
                                size='medium'
                                disabled={location === 'preview'}
                                onClick={() => history.push(`/p/${id}`)}
                            />
                        </Row>
                        {beads.length > 0 && (
                            <Scrollbars className={`${styles.gbgBeads} row`}>
                                {beads.map((bead, beadIndex) => (
                                    <BeadCard
                                        key={bead.id}
                                        postId={id}
                                        location={location}
                                        bead={bead}
                                        index={beadIndex + 1}
                                        style={{ marginRight: 12 }}
                                    />
                                ))}
                                <span style={{ marginLeft: -5, width: 5, flexShrink: 0 }} />
                            </Scrollbars>
                        )}
                    </Column>
                )}
                {type === 'string' && (
                    <Column>
                        {text && (
                            <Column style={{ marginBottom: 10 }}>
                                <ShowMoreLess height={150}>
                                    <Markdown text={text} />
                                </ShowMoreLess>
                            </Column>
                        )}
                        <Scrollbars className={`${styles.stringBeads} row`}>
                            {StringPosts.map((bead, i) => (
                                <StringBeadCard
                                    key={bead.id}
                                    bead={bead}
                                    postId={id}
                                    postType={postData.type}
                                    beadIndex={i}
                                    location={location}
                                />
                            ))}
                            <span style={{ marginLeft: -7, width: 7, flexShrink: 0 }} />
                        </Scrollbars>
                    </Column>
                )}
                {type === 'weave' && (
                    <Column>
                        {Weave.privacy === 'only-selected-users' ? (
                            <Row spaceBetween style={{ marginBottom: 10, color: '#acacae' }}>
                                <FlagImageHighlights
                                    type='user'
                                    imagePaths={StringPlayers.map((p) => p.flagImagePath)}
                                    imageSize={30}
                                    text={`${StringPlayers.length} players`}
                                    style={{ marginRight: 15 }}
                                    outline
                                />
                                {pendingPlayers.length > 0 ? (
                                    <Row centerY>
                                        <p>Waiting for {pendingPlayers.length} to accept</p>
                                        <FlagImageHighlights
                                            type='user'
                                            imagePaths={pendingPlayers.map((p) => p.flagImagePath)}
                                            imageSize={30}
                                            style={{ marginLeft: 5 }}
                                            outline
                                        />
                                    </Row>
                                ) : (
                                    <>
                                        {StringPosts.length <
                                        Weave.numberOfTurns * StringPlayers.length ? (
                                            <ImageTitle
                                                type='user'
                                                imagePath={currentPlayer.flagImagePath}
                                                title={`${currentPlayer.name}'s move: ${
                                                    StringPosts.length + 1
                                                }/${Weave.numberOfTurns * StringPlayers.length}`}
                                                link={`/u/${currentPlayer.handle}`}
                                            />
                                        ) : (
                                            <p>Game finished</p>
                                        )}
                                    </>
                                )}
                            </Row>
                        ) : (
                            <Row spaceBetween style={{ marginBottom: 10, color: '#acacae' }}>
                                <Row centerY>
                                    <UsersIconSVG
                                        style={{ width: 30, height: 30, marginRight: 5 }}
                                    />
                                    <p>Open to all users</p>
                                </Row>
                                {StringPosts.length < Weave.numberOfMoves ? (
                                    <p>
                                        Move: {StringPosts.length + 1} / {Weave.numberOfMoves}
                                    </p>
                                ) : (
                                    <p>Game finished</p>
                                )}
                            </Row>
                        )}
                        {text && (
                            <Column style={{ marginBottom: 10 }}>
                                <ShowMoreLess height={150}>
                                    <Markdown text={text} />
                                </ShowMoreLess>
                            </Column>
                        )}
                        {!pendingPlayers.length && (
                            <Row centerX>
                                <Scrollbars className={`${styles.stringBeads} row`}>
                                    {StringPosts.map((bead, i) => (
                                        <StringBeadCard
                                            key={bead.id}
                                            bead={bead}
                                            postId={id}
                                            postType={postData.type}
                                            beadIndex={i}
                                            location={location}
                                        />
                                    ))}
                                    {(Weave.privacy === 'all-users-allowed' &&
                                        StringPosts.length < Weave.numberOfMoves) ||
                                    (StringPosts.length <
                                        Weave.numberOfTurns * StringPlayers.length &&
                                        currentPlayer.id === accountData.id) ? (
                                        <button
                                            type='button'
                                            className={styles.newBeadButton}
                                            onClick={() =>
                                                location !== 'preview' && setNextBeadModalOpen(true)
                                            }
                                        >
                                            <PlusIconSVG />
                                            <p>
                                                Click to create the{' '}
                                                {StringPosts.length ? 'next' : 'first'} bead
                                            </p>
                                        </button>
                                    ) : (
                                        <>
                                            {Weave.privacy === 'only-selected-users' &&
                                                StringPosts.length <
                                                    Weave.numberOfTurns * StringPlayers.length && (
                                                    <Column
                                                        centerX
                                                        centerY
                                                        className={styles.pendingBead}
                                                    >
                                                        <p>Waiting for</p>
                                                        <ImageTitle
                                                            type='user'
                                                            imagePath={currentPlayer.flagImagePath}
                                                            title={`${currentPlayer.name}...`}
                                                            link={`/u/${currentPlayer.handle}`}
                                                            style={{ margin: '0 5px' }}
                                                        />
                                                    </Column>
                                                )}
                                        </>
                                    )}
                                    <span style={{ marginLeft: -7, width: 7, flexShrink: 0 }} />
                                </Scrollbars>
                            </Row>
                        )}
                        {nextBeadModalOpen && (
                            <NextBeadModal
                                beadIndex={StringPosts.length + 1}
                                postData={postData}
                                setPostData={setPostData}
                                close={() => setNextBeadModalOpen(false)}
                            />
                        )}
                    </Column>
                )}
            </Column>
            <Column className={styles.footer}>
                <div className={styles.statButtons}>
                    <StatButton
                        icon={<LikeIconSVG />}
                        iconSize={20}
                        text={totalLikes}
                        title={statTitle('Like', totalLikes)}
                        color={accountLike && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setLikeModalOpen(true)}
                    />
                    <StatButton
                        icon={<CommentIconSVG />}
                        iconSize={20}
                        text={totalComments}
                        title={statTitle('Comment', totalComments)}
                        // color={accountComment && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setCommentsOpen(!commentsOpen)}
                    />
                    <StatButton
                        icon={<RepostIconSVG />}
                        iconSize={20}
                        text={totalReposts}
                        title={statTitle('Repost', totalReposts)}
                        color={accountRepost && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setRepostModalOpen(true)}
                    />
                    <StatButton
                        icon={<RatingIconSVG />}
                        iconSize={20}
                        text={totalRatings}
                        title={statTitle('Rating', totalRatings)}
                        color={accountRating && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setRatingModalOpen(true)}
                    />
                    <StatButton
                        icon={<LinkIconSVG />}
                        iconSize={20}
                        text={totalLinks}
                        title={statTitle('Link', totalLinks)}
                        color={accountLink && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setLinkModalOpen(true)}
                    />
                    {['prism', 'decision-tree'].includes(type) && ( // 'glass-bead-game'
                        <StatButton
                            icon={<ArrowRightIconSVG />}
                            iconSize={20}
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
                        location={location}
                        totalComments={totalComments}
                        incrementTotalComments={(value) =>
                            setPostData({ ...postData, totalComments: totalComments + value })
                        }
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
        </Column>
    )
}

PostCard.defaultProps = {
    index: null,
    style: null,
}

export default PostCard
