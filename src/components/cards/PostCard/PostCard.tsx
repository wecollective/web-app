/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import Button from '@components/Button'
import InquiryAnswer from '@components/cards/InquiryAnswer'
import PostCardComments from '@components/cards/PostCard/PostCardComments'
import PostCardLikeModal from '@components/cards/PostCard/PostCardLikeModal'
import PostCardLinkModal from '@components/cards/PostCard/PostCardLinkModal'
import PostCardRatingModal from '@components/cards/PostCard/PostCardRatingModal'
import PostCardRepostModal from '@components/cards/PostCard/PostCardRepostModal'
import PostCardUrlPreview from '@components/cards/PostCard/PostCardUrlPreview'
import StringBeadCard from '@components/cards/PostCard/StringBeadCard2'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Markdown from '@components/Markdown'
import Modal from '@components/Modal'
import DeletePostModal from '@components/modals/DeletePostModal'
import ImageModal from '@components/modals/ImageModal'
import NextBeadModal from '@components/modals/NextBeadModal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import ShowMoreLess from '@components/ShowMoreLess'
import StatButton from '@components/StatButton'
import { AccountContext } from '@contexts/AccountContext'
import { PostContext } from '@contexts/PostContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import PieChart from '@src/components/PieChart'
import TimeGraph from '@src/components/TimeGraph'
import config from '@src/Config'
import {
    dateCreated,
    formatTimeDHM,
    formatTimeHHDDMMSS,
    formatTimeHM,
    formatTimeMDYT,
    pluralise,
    statTitle,
    timeSinceCreated,
    timeSinceCreatedShort,
} from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/cards/PostCard/PostCard.module.scss'
import { ReactComponent as ArrowRightIcon } from '@svgs/arrow-alt-circle-right-solid.svg'
import { ReactComponent as EventIcon } from '@svgs/calendar-days-solid.svg'
import { ReactComponent as GBGIcon } from '@svgs/castalia-logo.svg'
import { ReactComponent as SuccessIcon } from '@svgs/check-circle-solid.svg'
import { ReactComponent as ClockIcon } from '@svgs/clock-solid.svg'
import { ReactComponent as CommentIcon } from '@svgs/comment-solid.svg'
import { ReactComponent as DNAIcon } from '@svgs/dna.svg'
import { ReactComponent as VerticalEllipsisIcon } from '@svgs/ellipsis-vertical-solid.svg'
import { ReactComponent as ExpandIcon } from '@svgs/expand-icon.svg'
import { ReactComponent as TextIcon } from '@svgs/font-solid.svg'
import { ReactComponent as ImageIcon } from '@svgs/image-solid.svg'
import { ReactComponent as LikeIcon } from '@svgs/like.svg'
import { ReactComponent as LinkIcon } from '@svgs/link-solid.svg'
import { ReactComponent as WeaveIcon } from '@svgs/multiplayer-string-icon.svg'
import { ReactComponent as PauseIcon } from '@svgs/pause-solid.svg'
import { ReactComponent as PlayIcon } from '@svgs/play-solid.svg'
import { ReactComponent as PlusIcon } from '@svgs/plus.svg'
import { ReactComponent as PrismIcon } from '@svgs/prism-icon.svg'
import { ReactComponent as RepostIcon } from '@svgs/repost.svg'
import { ReactComponent as InquiryIcon } from '@svgs/square-poll-vertical-solid.svg'
import { ReactComponent as RatingIcon } from '@svgs/star-solid.svg'
import { ReactComponent as StringIcon } from '@svgs/string-icon.svg'
import { ReactComponent as DeleteIcon } from '@svgs/trash-can-solid.svg'
import { ReactComponent as UsersIcon } from '@svgs/users-solid.svg'
import { ReactComponent as AudioIcon } from '@svgs/volume-high-solid.svg'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

const PostCard = (props: {
    post: any
    index?: number
    location: 'post-page' | 'space-posts' | 'space-post-map' | 'user-posts' | 'preview'
    style?: any
}): JSX.Element => {
    const { post, index, location, style } = props
    const {
        accountData,
        loggedIn,
        setAlertModalOpen,
        setAlertMessage,
        setCreatePostModalSettings,
        setCreatePostModalOpen,
    } = useContext(AccountContext)
    const { spaceData, spacePostsFilters, getSpacePosts, spacePostsPaginationLimit } = useContext(
        SpaceContext
    )
    const { getPostData } = useContext(PostContext)
    const { userData, getUserPosts, userPostsPaginationLimit } = useContext(UserContext)
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
        PostImages,
        Event,
        Inquiry,
        GlassBeadGame,
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

    // inquiries
    const [totalVotes, setTotalVotes] = useState(0)
    const [totalPoints, setTotalPoints] = useState(0)
    const [totalUsers, setTotalUsers] = useState(0)
    const [accountHasVoted, setAccountHasVoted] = useState(false)
    const [voteChanged, setVoteChanged] = useState(false)
    const [voteLoading, setVoteLoading] = useState(false)
    const [showVoteSavedMessage, setShowVoteSavedMessage] = useState(false)
    const [inquiryAnswers, setInquiryAnswers] = useState<any[]>([])
    const [newInquiryAnswers, setNewInquiryAnswers] = useState<any[]>([])
    const [totalUsedPoints, setTotalUsedPoints] = useState(0)

    // events
    const [eventGoingModalOpen, setEventGoingModalOpen] = useState(false)
    const [eventInterestedModalOpen, setEventInterestedModalOpen] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(location === 'post-page')
    const [beadCommentsOpen, setBeadCommentsOpen] = useState(false)
    const [selectedBead, setSelectedBead] = useState<any>(null)
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)
    const [timeLeftInMove, setTimeLeftInMove] = useState(0)
    const timeLeftInMoveIntervalRef = useRef<any>(null)

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

    // inquiries
    const colorScale = d3
        .scaleSequential()
        .domain([0, Inquiry ? Inquiry.InquiryAnswers.length : 0])
        .interpolator(d3.interpolateViridis)

    // weaves
    const deadlinePassed = () => {
        return Weave && Weave.nextMoveDeadline && new Date(Weave.nextMoveDeadline) < new Date()
    }
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

    function findPostTypeIcon(postType) {
        switch (postType) {
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
            case 'inquiry':
                return <InquiryIcon />
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

    const loc = useLocation()
    const urlParams = Object.fromEntries(new URLSearchParams(loc.search))
    const params = { ...spacePostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    console.log('location: ', location)

    function vote() {
        if (!loggedIn) {
            setAlertMessage('Log in to vote on inquiries')
            setAlertModalOpen(true)
        } else {
            setVoteLoading(true)
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = {
                userName: accountData.name,
                userHandle: accountData.handle,
                spaceId: spaceData.id,
                postId: id,
                voteData: newInquiryAnswers
                    .filter((a) => a.accountVote)
                    .map((a) => {
                        return {
                            id: a.id,
                            value: a.accountPoints,
                        }
                    }),
            }
            axios.post(`${config.apiURL}/vote-on-inquiry`, data, options).then(() => {
                const newAnswers = [
                    ...newInquiryAnswers.sort((a, b) => b.totalVotes - a.totalVotes),
                ]
                setTotalVotes(newAnswers.map((a) => a.totalVotes).reduce((a, b) => a + b, 0))
                setInquiryAnswers(newAnswers)
                setNewInquiryAnswers(newAnswers)
                setVoteLoading(false)
                setShowVoteSavedMessage(true)
                setTimeout(() => {
                    setShowVoteSavedMessage(false)
                    // todo: update state locally
                    if (location === 'space-posts')
                        getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit, params)
                    if (location === 'user-posts')
                        getUserPosts(userData.id, 0, userPostsPaginationLimit, params)
                    if (location === 'post-page') getPostData(id)
                }, 3000)
            })
        }
    }

    function updateAnswers(answerId, value) {
        const newAnswers = [...newInquiryAnswers]
        if (Inquiry.type === 'single-choice') {
            newAnswers.forEach((a) => {
                if (a.accountVote) {
                    a.accountVote = false
                    // a.totalVotes -= 1
                }
            })
        }
        const selectedAnswer = newAnswers.find((a) => a.id === answerId)
        if (Inquiry.type === 'weighted-choice') {
            selectedAnswer.accountVote = !!value
            selectedAnswer.accountPoints = value > 100 ? 100 : value
            setTotalUsedPoints(newAnswers.map((a) => +a.accountPoints).reduce((a, b) => a + b, 0))
        } else {
            selectedAnswer.accountVote = value
            // selectedAnswer.totalVotes += value ? 1 : -1
        }
        setNewInquiryAnswers(newAnswers)
        setVoteChanged(true)
    }

    function voteDisabled() {
        const weighted = Inquiry.type === 'weighted-choice'
        if (loggedIn) {
            if (weighted) {
                if (!voteChanged || totalUsedPoints !== 100) return true
            } else if (!voteChanged || !newInquiryAnswers.find((a) => a.accountVote)) {
                return true
            }
        }
        return false
    }

    // build inquiry data
    useEffect(() => {
        if (Inquiry) {
            const weighted = Inquiry.type === 'weighted-choice'
            const answers = [] as any[]
            let totalInquiryVotes = 0
            let totalInquiryPoints = 0
            const inquiryUsers = [] as number[]
            Inquiry.InquiryAnswers.forEach((answer) => {
                const activeReactions = answer.Reactions.filter((r) => r.state === 'active')
                // find all users
                activeReactions.forEach((r) => {
                    if (!inquiryUsers.includes(r.Creator.id)) inquiryUsers.push(r.Creator.id)
                })
                const points = weighted
                    ? activeReactions.map((r) => +r.value).reduce((a, b) => a + b, 0)
                    : 0
                totalInquiryVotes += activeReactions.length
                totalInquiryPoints += points
                const accountVote = activeReactions.find((r) => r.Creator.id === accountData.id)
                if (accountVote && !accountHasVoted) {
                    setAccountHasVoted(true)
                    setTotalUsedPoints(100)
                }
                answers.push({
                    ...answer,
                    totalVotes: activeReactions.length,
                    accountVote: !!accountVote,
                    accountPoints: accountVote ? +accountVote.value : 0,
                    totalPoints: points,
                })
            })
            if (weighted) answers.sort((a, b) => b.totalPoints - a.totalPoints)
            else answers.sort((a, b) => b.totalVotes - a.totalVotes)
            setTotalVotes(totalInquiryVotes)
            setTotalPoints(totalInquiryPoints)
            setTotalUsers(inquiryUsers.length)
            setInquiryAnswers(answers)
            setNewInquiryAnswers(answers)
        }
    }, [])

    useEffect(() => {
        if (Weave && Weave.nextMoveDeadline && !deadlinePassed()) {
            timeLeftInMoveIntervalRef.current = setInterval(() => {
                const now = new Date().getTime()
                const deadline = new Date(Weave.nextMoveDeadline).getTime()
                setTimeLeftInMove((deadline - now) / 1000)
            }, 1000)
        }
        return () => clearInterval(timeLeftInMoveIntervalRef.current)
    }, [postData])

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
                        {findPostTypeIcon(type)}
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
                                        {isOwnPost && (
                                            <button
                                                type='button'
                                                onClick={() => setDeletePostModalOpen(true)}
                                            >
                                                <DeleteIcon />
                                                Delete post
                                            </button>
                                        )}
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
                                            className={`${styles.image} ${styles[findImageSize()]}`}
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
                        <Markdown text={`# ${Event.title}`} className={styles.title} />
                        {text && (
                            <ShowMoreLess height={150} style={{ marginBottom: 10 }}>
                                <Markdown text={text} />
                            </ShowMoreLess>
                        )}
                        <Row wrap centerY className={styles.eventTimes}>
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
                {type === 'inquiry' && (
                    <Column>
                        <Markdown text={`# ${Inquiry.title}`} className={styles.title} />
                        {text && (
                            <ShowMoreLess height={150} style={{ marginBottom: 10 }}>
                                <Markdown text={text} />
                            </ShowMoreLess>
                        )}
                        <Row centerX>
                            <PieChart
                                type={Inquiry.type}
                                postId={id}
                                totalVotes={totalVotes}
                                totalPoints={totalPoints}
                                totalUsers={totalUsers}
                                answers={inquiryAnswers}
                            />
                            {totalVotes > 0 && (
                                <TimeGraph
                                    type={Inquiry.type}
                                    postId={id}
                                    answers={inquiryAnswers}
                                    startTime={postData.createdAt}
                                />
                            )}
                        </Row>
                        <Row centerY spaceBetween style={{ marginBottom: 15 }}>
                            <Row>
                                <p className='grey'>Inquiry type: {Inquiry.type}</p>
                                {Inquiry.type === 'weighted-choice' && (
                                    <p
                                        className={totalUsedPoints !== 100 ? 'danger' : 'grey'}
                                        style={{ marginLeft: 10 }}
                                    >
                                        ({totalUsedPoints}/100 points used)
                                    </p>
                                )}
                            </Row>
                            {showVoteSavedMessage && <p>Vote saved!</p>}
                            <Button
                                color='blue'
                                text={accountHasVoted ? 'Change vote' : 'Vote'}
                                loading={voteLoading}
                                disabled={voteDisabled()}
                                onClick={() => vote()}
                            />
                        </Row>
                        {newInquiryAnswers.length > 0 && (
                            <Column className={styles.inquiryAnswers}>
                                {newInquiryAnswers.map((answer, i) => (
                                    <InquiryAnswer
                                        key={answer.id}
                                        index={i}
                                        type={Inquiry.type}
                                        answer={answer}
                                        totalVotes={totalVotes}
                                        totalPoints={totalPoints}
                                        color={colorScale(i)}
                                        selected={answer.accountVote}
                                        preview={location === 'preview' || !loggedIn}
                                        onChange={(v) => updateAnswers(answer.id, v)}
                                    />
                                ))}
                            </Column>
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
                                <Row wrap centerY className={styles.eventTimes}>
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
                        <Row style={{ marginBottom: beads.length ? 15 : 0 }}>
                            <Button
                                text='Open game room'
                                color='gbg-white'
                                size='medium'
                                disabled={location === 'preview'}
                                onClick={() => history.push(`/p/${id}`)}
                            />
                        </Row>
                        <Row centerX>
                            {beads.length > 0 && (
                                <Scrollbars className={`${styles.beadDraw} row`}>
                                    {beads.map((bead, i) => (
                                        <Row key={bead.id}>
                                            <StringBeadCard
                                                bead={{
                                                    type: 'string-audio',
                                                    Creator: bead.user,
                                                    url: bead.beadUrl,
                                                    Link: { relationship: null },
                                                }}
                                                postId={id}
                                                postType={postData.type}
                                                beadIndex={i}
                                                location={location}
                                                style={{
                                                    marginRight:
                                                        beads.length > 2 && i === beads.length - 1
                                                            ? 15
                                                            : 0,
                                                }}
                                            />
                                            {i < beads.length - 1 && (
                                                <Row centerY className={styles.beadDivider}>
                                                    <DNAIcon />
                                                </Row>
                                            )}
                                        </Row>
                                    ))}
                                </Scrollbars>
                            )}
                        </Row>
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
                            <Scrollbars className={`${styles.beadDraw} row`}>
                                {StringPosts.map((bead, i) => (
                                    <Row key={bead.id}>
                                        <StringBeadCard
                                            bead={bead}
                                            postId={id}
                                            postType={postData.type}
                                            beadIndex={i}
                                            location={location}
                                            selected={selectedBead && selectedBead.id === bead.id}
                                            toggleBeadComments={() => {
                                                if (beadCommentsOpen) {
                                                    if (bead.id !== selectedBead.id)
                                                        setSelectedBead(bead)
                                                    else setBeadCommentsOpen(false)
                                                } else {
                                                    setSelectedBead(bead)
                                                    setBeadCommentsOpen(true)
                                                }
                                            }}
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
                            <Row
                                centerY
                                spaceBetween
                                wrap
                                style={{ marginBottom: 10, color: '#acacae' }}
                            >
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
                                {Weave.state === 'active' &&
                                    Weave.nextMoveDeadline &&
                                    !deadlinePassed() &&
                                    timeLeftInMove > 0 && (
                                        <p
                                            style={{ color: 'black' }}
                                            title='Time left for next move'
                                        >
                                            {formatTimeHHDDMMSS(timeLeftInMove)}
                                        </p>
                                    )}
                                {!playersRejected.length &&
                                    Weave.state !== 'cancelled' &&
                                    playersPending.length > 0 && (
                                        <Row centerY>
                                            <p>Waiting for {playersPending.length}</p>
                                            <FlagImageHighlights
                                                type='user'
                                                imagePaths={playersPending.map(
                                                    (p) => p.flagImagePath
                                                )}
                                                imageSize={30}
                                                style={{ marginLeft: 5 }}
                                            />
                                        </Row>
                                    )}
                                {playersReady && Weave.state !== 'cancelled' && (
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
                                {Weave.state === 'cancelled' && <p>Game cancelled</p>}
                            </Row>
                        ) : (
                            <Row
                                spaceBetween
                                centerY
                                style={{ marginBottom: 10, color: '#acacae' }}
                            >
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
                        {playersReady && Weave.state !== 'cancelled' && (
                            <Row centerX>
                                <Scrollbars className={`${styles.beadDraw} row`}>
                                    {StringPosts.map((bead, i) => (
                                        <Row key={bead.id}>
                                            <StringBeadCard
                                                bead={bead}
                                                postId={id}
                                                postType={postData.type}
                                                beadIndex={i}
                                                location={location}
                                                selected={
                                                    selectedBead && selectedBead.id === bead.id
                                                }
                                                toggleBeadComments={() => {
                                                    if (beadCommentsOpen) {
                                                        if (bead.id !== selectedBead.id)
                                                            setSelectedBead(bead)
                                                        else setBeadCommentsOpen(false)
                                                    } else {
                                                        setSelectedBead(bead)
                                                        setBeadCommentsOpen(true)
                                                    }
                                                }}
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
                                                    marginRight: StringPosts.length > 1 ? 15 : 0,
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
                                postData={postData}
                                setPostData={setPostData}
                                close={() => setNextBeadModalOpen(false)}
                            />
                        )}
                    </Column>
                )}
            </Column>
            {beadCommentsOpen && (
                <PostCardComments
                    postId={selectedBead.id}
                    type='bead'
                    location={location}
                    totalComments={selectedBead.totalComments}
                    incrementTotalComments={(value) => {
                        const newPostData = { ...postData }
                        const bead = newPostData.StringPosts.find((b) => b.id === selectedBead.id)
                        bead.totalComments += value
                        bead.accountComment = value > 0
                        setPostData(newPostData)
                    }}
                    style={{ margin: '10px 0' }}
                />
            )}
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
                                postData={postData}
                                setPostData={setPostData}
                                close={() => setLikeModalOpen(false)}
                            />
                        )}
                        {repostModalOpen && (
                            <PostCardRepostModal
                                postData={postData}
                                setPostData={setPostData}
                                close={() => setRepostModalOpen(false)}
                            />
                        )}
                        {ratingModalOpen && (
                            <PostCardRatingModal
                                postData={postData}
                                setPostData={setPostData}
                                close={() => setRatingModalOpen(false)}
                            />
                        )}
                        {linkModalOpen && (
                            <PostCardLinkModal
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
                    <PostCardComments
                        postId={postData.id}
                        type='post'
                        location={location}
                        totalComments={totalComments}
                        incrementTotalComments={(value) =>
                            setPostData({ ...postData, totalComments: totalComments + value })
                        }
                        style={{ marginTop: 20 }}
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
