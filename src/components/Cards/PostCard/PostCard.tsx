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
    timeSinceCreatedShort,
    dateCreated,
    pluralise,
    statTitle,
    formatTimeHM,
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
import CloseOnClickOutside from '@src/components/CloseOnClickOutside'
import { ReactComponent as LinkIcon } from '@svgs/link-solid.svg'
import { ReactComponent as CommentIcon } from '@svgs/comment-solid.svg'
import { ReactComponent as LikeIcon } from '@svgs/like.svg'
import { ReactComponent as RepostIcon } from '@svgs/repost.svg'
import { ReactComponent as RatingIcon } from '@svgs/star-solid.svg'
import { ReactComponent as ArrowRightIcon } from '@svgs/arrow-alt-circle-right-solid.svg'
import { ReactComponent as PlayIcon } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIcon } from '@svgs/pause-solid.svg'
import { ReactComponent as ClockIcon } from '@svgs/clock-solid.svg'
import { ReactComponent as EventIcon } from '@svgs/calendar-days-solid.svg'
import { ReactComponent as SuccessIcon } from '@svgs/check-circle-solid.svg'
import { ReactComponent as PlusIcon } from '@svgs/plus.svg'
import { ReactComponent as UsersIcon } from '@svgs/users-solid.svg'
import { ReactComponent as ExpandIcon } from '@svgs/expand-icon.svg'
import { ReactComponent as TextIcon } from '@svgs/font-solid.svg'
import { ReactComponent as AudioIcon } from '@svgs/volume-high-solid.svg'
import { ReactComponent as ImageIcon } from '@svgs/image-solid.svg'
import { ReactComponent as GBGIcon } from '@svgs/castalia-logo.svg'
import { ReactComponent as StringIcon } from '@svgs/string-icon.svg'
import { ReactComponent as WeaveIcon } from '@svgs/multiplayer-string-icon.svg'
import { ReactComponent as VerticalEllipsisIcon } from '@svgs/ellipsis-vertical-solid.svg'
import { ReactComponent as PrismIcon } from '@svgs/prism-icon.svg'
import { ReactComponent as DeleteIcon } from '@svgs/trash-can-solid.svg'
import { ReactComponent as DNAIcon } from '@svgs/dna.svg'

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
        // IndirectSpaces,
        GlassBeadGame,
        Event,
        PostImages,
        StringPosts,
        Weave,
        StringPlayers,
    } = postData

    const [menuOpen, setMenuOpen] = useState(false)
    const [otherSpacesModalOpen, setOtherSpacesModalOpen] = useState(false)
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

    const mobileView = document.documentElement.clientWidth < 900
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

    // events
    const goingToEvent = Event && Event.Going.map((u) => u.id).includes(accountData.id)
    const interestedInEvent = Event && Event.Interested.map((u) => u.id).includes(accountData.id)

    // todo: add to helper functions (pass in start and end dates)
    function findEventTimes() {
        const startDate = new Date(Event.startTime)
        const endDate = new Date(Event.endTime)
        const sameDay =
            Event.endTime &&
            startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate()
        const sameMinute =
            sameDay &&
            startDate.getHours() === endDate.getHours() &&
            startDate.getMinutes() === endDate.getMinutes()
        // format:
        // different day: June 29, 2022 at 22:00 → June 30, 2022 at 22:00
        // same day: June 29, 2022 at 22:00 → 23:00
        // same minute: June 29, 2022 at 22:00
        return `${formatTimeMDYT(Event.startTime)} ${
            Event.endTime && !sameMinute
                ? `→ ${sameDay ? formatTimeHM(Event.endTime) : formatTimeMDYT(Event.endTime)}`
                : ''
        }`
    }

    function findEventDuration() {
        const startDate = new Date(Event.startTime)
        const endDate = new Date(Event.endTime)
        const sameMinute =
            startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate() &&
            startDate.getHours() === endDate.getHours() &&
            startDate.getMinutes() === endDate.getMinutes()
        const difference = (endDate.getTime() - startDate.getTime()) / 1000
        if (Event.endTime && !sameMinute)
            // rounded up to nearest minute
            return `(${formatTimeDHM(Math.ceil(difference / 60) * 60)})`
        return null
    }

    // multiplayer strings
    StringPlayers.sort((a, b) => a.UserPost.index - b.UserPost.index)
    const currentPlayer =
        Weave && Weave.privacy === 'only-selected-users'
            ? StringPlayers[StringPosts.length % StringPlayers.length] // calculates current player index
            : null
    const playersPending = StringPlayers.filter((p) => p.UserPost.state === 'pending')
    const playersRejected = StringPlayers.filter((p) => p.UserPost.state === 'rejected')
    const playersReady = !playersPending.length && !playersRejected.length
    const totalMoves =
        Weave && Weave.privacy === 'only-selected-users'
            ? Weave && Weave.numberOfTurns * StringPlayers.length
            : Weave && Weave.numberOfMoves
    const movesLeft = StringPosts.length < totalMoves
    const waitingForPlayer = Weave && Weave.privacy === 'only-selected-users' && movesLeft
    const nextMoveAvailable =
        Weave && Weave.privacy === 'all-users-allowed'
            ? movesLeft
            : movesLeft && currentPlayer.id === accountData.id

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

    function findPostTypeIcon() {
        switch (type) {
            case 'text':
                return <TextIcon />
            case 'url':
                return <LinkIcon />
            case 'image':
                return <ImageIcon />
            case 'audio':
                return <AudioIcon />
            case 'event':
                return <EventIcon />
            case 'glass-bead-game':
                return <GBGIcon />
            case 'string':
                return <StringIcon />
            case 'weave':
                return <WeaveIcon />
            case 'prism':
                return <PrismIcon />
            default:
                return null
        }
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
                                    title={postSpaces[0].name}
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
                        <>
                            <button
                                type='button'
                                className={styles.otherSpacesButton}
                                title={otherSpacesTitle}
                                onClick={() => setOtherSpacesModalOpen(true)}
                            >
                                <p>+{postSpaces.length - 1}</p>
                            </button>
                            {otherSpacesModalOpen && (
                                <Modal centered close={() => setOtherSpacesModalOpen(false)}>
                                    <h2>Posted to</h2>
                                    {postSpaces.map((space) => (
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
                        <p className='grey' title={dateCreated(createdAt)}>
                            {mobileView
                                ? timeSinceCreatedShort(createdAt)
                                : timeSinceCreated(createdAt)}
                        </p>
                    )}
                </Row>
                <Row>
                    <Column
                        centerX
                        centerY
                        className={`${styles.postType} ${styles[type]}`}
                        title={type}
                    >
                        {findPostTypeIcon()}
                    </Column>
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
                                        <button
                                            type='button'
                                            onClick={() => setDeletePostModalOpen(true)}
                                        >
                                            <DeleteIcon />
                                            Delete post
                                        </button>
                                    </Column>
                                </CloseOnClickOutside>
                            )}
                        </>
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
                                {audioPlaying ? <PauseIcon /> : <PlayIcon />}
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
                        <Markdown text={`# ${Event.title}`} className={styles.eventTitle} />
                        {text && (
                            <ShowMoreLess height={150} style={{ marginBottom: 10 }}>
                                <Markdown text={text} />
                            </ShowMoreLess>
                        )}
                        <Row centerY className={styles.eventTimes}>
                            <ClockIcon />
                            <p>{findEventTimes()}</p>
                            <p>{findEventDuration()}</p>
                        </Row>
                        {(Event.Going.length > 0 || Event.Interested.length > 0) && (
                            <Row>
                                {Event.Going.length > 0 && (
                                    <FlagImageHighlights
                                        type='user'
                                        imagePaths={Event.Going.map((u) => u.flagImagePath)}
                                        imageSize={30}
                                        text={`${Event.Going.length} going`}
                                        onClick={() => setEventGoingModalOpen(true)}
                                        style={{ marginRight: 15 }}
                                    />
                                )}
                                {Event.Interested.length > 0 && (
                                    <FlagImageHighlights
                                        type='user'
                                        imagePaths={Event.Interested.map((u) => u.flagImagePath)}
                                        imageSize={30}
                                        text={`${Event.Interested.length} interested`}
                                        onClick={() => setEventInterestedModalOpen(true)}
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
                        {new Date(Event.startTime) > new Date() && (
                            <Row style={{ marginTop: 10 }}>
                                <Button
                                    text='Going'
                                    color='aqua'
                                    size='medium'
                                    disabled={location === 'preview'}
                                    icon={goingToEvent ? <SuccessIcon /> : undefined}
                                    style={{ marginRight: 5 }}
                                    onClick={() => respondToEvent('going')}
                                />
                                <Button
                                    text='Interested'
                                    color='aqua'
                                    size='medium'
                                    disabled={location === 'preview'}
                                    icon={interestedInEvent ? <SuccessIcon /> : undefined}
                                    onClick={() => respondToEvent('interested')}
                                />
                            </Row>
                        )}
                    </Column>
                )}
                {type === 'glass-bead-game' && (
                    <Column>
                        <Row style={{ marginBottom: 10 }}>
                            {GlassBeadGame.topicImage && (
                                <img
                                    className={styles.topicImage}
                                    src={GlassBeadGame.topicImage}
                                    alt=''
                                />
                            )}
                            <Column centerY>
                                <Markdown
                                    text={`# ${GlassBeadGame.topic}`}
                                    className={styles.topicTitle}
                                />
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
                                    <ClockIcon />
                                    <p>{findEventTimes()}</p>
                                    <p>{findEventDuration()}</p>
                                </Row>
                                {(Event.Going.length > 0 || Event.Interested.length > 0) && (
                                    <Row style={{ marginBottom: 10 }}>
                                        {Event.Going.length > 0 && (
                                            <FlagImageHighlights
                                                type='user'
                                                imagePaths={Event.Going.map((u) => u.flagImagePath)}
                                                imageSize={30}
                                                text={`${Event.Going.length} going`}
                                                onClick={() => setEventGoingModalOpen(true)}
                                                style={{ marginRight: 15 }}
                                            />
                                        )}
                                        {Event.Interested.length > 0 && (
                                            <FlagImageHighlights
                                                type='user'
                                                imagePaths={Event.Interested.map(
                                                    (u) => u.flagImagePath
                                                )}
                                                imageSize={30}
                                                text={`${Event.Interested.length} interested`}
                                                onClick={() => setEventInterestedModalOpen(true)}
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
                                {new Date(Event.startTime) > new Date() && (
                                    <Row style={{ marginBottom: 10 }}>
                                        <Button
                                            text='Going'
                                            color='aqua'
                                            size='medium'
                                            disabled={location === 'preview'}
                                            icon={goingToEvent ? <SuccessIcon /> : undefined}
                                            style={{ marginRight: 5 }}
                                            onClick={() => respondToEvent('going')}
                                        />
                                        <Button
                                            text='Interested'
                                            color='aqua'
                                            size='medium'
                                            disabled={location === 'preview'}
                                            icon={interestedInEvent ? <SuccessIcon /> : undefined}
                                            onClick={() => respondToEvent('interested')}
                                        />
                                    </Row>
                                )}
                            </Column>
                        )}
                        <Row>
                            <Button
                                text='Open game room'
                                color='gbg-white'
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
                        <Row centerX>
                            <Scrollbars className={`${styles.stringBeads} row`}>
                                {StringPosts.map((bead, i) => (
                                    <Row key={bead.id}>
                                        <StringBeadCard
                                            bead={bead}
                                            postId={id}
                                            postType={postData.type}
                                            beadIndex={i}
                                            location={location}
                                            style={{
                                                marginRight:
                                                    StringPosts.length > 2 &&
                                                    i === StringPosts.length - 1
                                                        ? 15
                                                        : 0,
                                            }}
                                        />
                                        {(i < StringPosts.length - 1 || movesLeft) && (
                                            <Row centerY className={styles.beadDivider}>
                                                <DNAIcon />
                                            </Row>
                                        )}
                                    </Row>
                                ))}
                            </Scrollbars>
                        </Row>
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
                                />
                                {playersRejected.length > 0 && (
                                    <Row centerY>
                                        <p>
                                            {playersRejected.length} player
                                            {pluralise(playersRejected.length)} rejected the game
                                        </p>
                                        <FlagImageHighlights
                                            type='user'
                                            imagePaths={playersRejected.map((p) => p.flagImagePath)}
                                            imageSize={30}
                                            style={{ marginLeft: 5 }}
                                        />
                                    </Row>
                                )}
                                {!playersRejected.length && playersPending.length > 0 && (
                                    <Row centerY>
                                        <p>Waiting for {playersPending.length} to accept</p>
                                        <FlagImageHighlights
                                            type='user'
                                            imagePaths={playersPending.map((p) => p.flagImagePath)}
                                            imageSize={30}
                                            style={{ marginLeft: 5 }}
                                        />
                                    </Row>
                                )}
                                {playersReady && (
                                    <Row>
                                        {movesLeft ? (
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
                                    </Row>
                                )}
                            </Row>
                        ) : (
                            <Row spaceBetween style={{ marginBottom: 10, color: '#acacae' }}>
                                <Row centerY>
                                    <UsersIcon style={{ width: 30, height: 30, marginRight: 5 }} />
                                    <p>Open to all users</p>
                                </Row>
                                {movesLeft ? (
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
                        {playersReady && (
                            <Row centerX>
                                <Scrollbars className={`${styles.stringBeads} row`}>
                                    {StringPosts.map((bead, i) => (
                                        <Row key={bead.id}>
                                            <StringBeadCard
                                                bead={bead}
                                                postId={id}
                                                postType={postData.type}
                                                beadIndex={i}
                                                location={location}
                                                style={{
                                                    marginRight:
                                                        i === StringPosts.length - 1 &&
                                                        !movesLeft &&
                                                        StringPosts.length > 2
                                                            ? 15
                                                            : 0,
                                                }}
                                            />
                                            {(i < StringPosts.length - 1 || movesLeft) && (
                                                <Row centerY className={styles.beadDivider}>
                                                    <DNAIcon />
                                                </Row>
                                            )}
                                        </Row>
                                    ))}
                                    {nextMoveAvailable ? (
                                        <button
                                            type='button'
                                            className={styles.newBeadButton}
                                            onClick={() => {
                                                if (!loggedIn) {
                                                    setAlertMessage('Log in to create the bead')
                                                    setAlertModalOpen(true)
                                                } else if (location !== 'preview')
                                                    setNextBeadModalOpen(true)
                                            }}
                                            style={{ marginRight: StringPosts.length > 1 ? 15 : 0 }}
                                        >
                                            <PlusIcon />
                                            <p>
                                                Click to create the{' '}
                                                {StringPosts.length ? 'next' : 'first'} bead
                                            </p>
                                        </button>
                                    ) : (
                                        waitingForPlayer && (
                                            <Column
                                                centerX
                                                centerY
                                                className={styles.pendingBead}
                                                style={{
                                                    marginRight: StringPosts.length > 2 ? 15 : 0,
                                                }}
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
                                        )
                                    )}
                                    {(StringPosts.length > 2 ||
                                        (StringPosts.length > 1 && movesLeft)) && (
                                        <span style={{ marginLeft: -7, width: 7, flexShrink: 0 }} />
                                    )}
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
                <Row spaceBetween>
                    <Row className={styles.statButtons}>
                        <StatButton
                            icon={<LikeIcon />}
                            iconSize={20}
                            text={totalLikes}
                            title={statTitle('Like', totalLikes || 0)}
                            color={accountLike && 'blue'}
                            disabled={location === 'preview'}
                            onClick={() => setLikeModalOpen(true)}
                        />
                        <StatButton
                            icon={<CommentIcon />}
                            iconSize={20}
                            text={totalComments}
                            title={statTitle('Comment', totalComments || 0)}
                            // color={accountComment && 'blue'}
                            disabled={location === 'preview'}
                            onClick={() => setCommentsOpen(!commentsOpen)}
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
                            icon={<RatingIcon />}
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
                    </Row>
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
