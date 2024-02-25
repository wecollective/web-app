/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import DropDown from '@components/DropDown'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import SuccessMessage from '@components/SuccessMessage'
import Toggle from '@components/Toggle'
import AudioCard from '@components/cards/PostCard/AudioCard'
import BeadCard from '@components/cards/PostCard/BeadCard'
import PollAnswer from '@components/cards/PostCard/PollAnswer'
import PostSpaces from '@components/cards/PostCard/PostSpaces'
import UrlCard from '@components/cards/PostCard/UrlCard'
import CommentInput from '@components/draft-js/CommentInput'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import AddPostSpacesModal from '@components/modals/AddPostSpacesModal'
import GameSettingsModal from '@components/modals/GameSettingsModal'
import ImageModal from '@components/modals/ImageModal'
import Modal from '@components/modals/Modal'
import NextBeadModal from '@components/modals/NextBeadModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import {
    GAMES,
    GAME_TYPES,
    GameSettings,
    MEDIA_TYPES,
    MediaType,
    allowedAudioTypes,
    allowedImageTypes,
    audioMBLimit,
    capitalise,
    findDraftLength,
    findSearchableText,
    findUrlSearchableText,
    formatTimeMMSS,
    getDraftPlainText,
    imageMBLimit,
    isSpecificGame,
    postTypeIcons,
    scrapeUrl,
    simplifyText,
    uploadPost,
    validatePost,
} from '@src/Helpers'
import GameCard, { useGameStatus } from '@src/components/GameCard'
import styles from '@styles/components/modals/CreatePostModal.module.scss'
import {
    AudioIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DNAIcon,
    ImageIcon,
    PlusIcon,
    PollIcon,
    RepostIcon,
    SettingsIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_green.css'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import RecordRTC from 'recordrtc'
import { v4 as uuidv4 } from 'uuid'

const defaultSelectedSpace = {
    id: 1,
    handle: 'all',
    name: 'All',
    flagImagePath: 'https://weco-prod-space-flag-images.s3.eu-west-1.amazonaws.com/1614556880362',
}

function MediaButton(props: { type: string; selected: boolean; onClick: () => void }): JSX.Element {
    const { type, selected, onClick } = props
    return (
        <button
            className={`${styles.contentButton} ${selected ? styles.selected : ''}`}
            type='button'
            title={capitalise(type)}
            onClick={onClick}
        >
            {postTypeIcons[type]}
        </button>
    )
}

const MODAL_TYPES = [...GAME_TYPES, 'card', 'poll', 'post'] as const

type ModalType = (typeof MODAL_TYPES)[number]

const SOURCE_TYPES = ['post']

type SourceType = (typeof SOURCE_TYPES)[number]

export type CreatePostModalSettings = { type: ModalType; source?: { type: SourceType; id: number } }

// eslint-disable-next-line react/require-default-props
export type CreatePostModalProps = { settings: CreatePostModalSettings; onClose: () => void }

const MODAL_HEADER: Record<ModalType, string> = {
    'glass-bead-game': 'New Glass Bead Game',
    card: 'New Card',
    poll: 'New Governance Poll',
    'wisdom-gym': 'New Wisdom Gym',
    post: 'New Post',
}

function CreatePostModal({
    settings: { type, source },
    onClose,
}: CreatePostModalProps): JSX.Element {
    const { accountData } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts, governancePolls, setGovernancePolls } =
        useContext(SpaceContext)
    const { userPosts, setUserPosts } = useContext(UserContext)
    const [loading, setLoading] = useState(false)
    const [linkDescription, setLinkDescription] = useState('')
    const [mediaTypes, setMediaTypes] = useState<MediaType[]>(() =>
        MEDIA_TYPES.includes(type as MediaType) ? [type as MediaType] : []
    )
    const [spaces, setSpaces] = useState<any[]>([spaceData.id ? spaceData : defaultSelectedSpace])
    const [showTitle, setShowTitle] = useState(true)
    const [title, setTitle] = useState('')
    const [text, setText] = useState('')
    const [mentions, setMentions] = useState<any[]>([])
    const [rawUrls, setRawUrls] = useState<any[]>([])
    const [urls, setUrls] = useState<any[]>([])
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [errors, setErrors] = useState<string[]>([])
    const [saved, setSaved] = useState(false)
    const [spacesModalOpen, setSpacesModalOpen] = useState(false)
    const maxChars = 5000
    const maxUrls = 5
    const location = useLocation()
    const [x, page, pageHandle, subPage] = location.pathname.split('/')
    const contentTypes: MediaType[] = ['image', 'audio', 'event', 'game']
    if (type !== 'poll') {
        contentTypes.push('poll')
    }
    console.log(mediaTypes)

    function initializeMediaDropBox(mediaType: MediaType) {
        let dragLeaveCounter = 0 // used to avoid dragleave firing when hovering child elements
        const dropbox = document.getElementById(`${mediaType}-drop`)
        if (dropbox) {
            dropbox.addEventListener('dragover', (e) => e.preventDefault())
            dropbox.addEventListener('dragenter', () => {
                dragLeaveCounter += 1
                if (dragLeaveCounter === 1) dropbox.classList.add(styles.dragOver)
            })
            dropbox.addEventListener('dragleave', () => {
                dragLeaveCounter -= 1
                if (dragLeaveCounter === 0) dropbox.classList.remove(styles.dragOver)
            })
            dropbox.addEventListener('drop', (e) => {
                e.preventDefault()
                dragLeaveCounter = 0
                dropbox.classList.remove(styles.dragOver)
                if (e.dataTransfer) {
                    if (mediaType === 'image') addImageFiles(e.dataTransfer)
                    if (mediaType === 'audio') addAudioFiles(e.dataTransfer)
                }
            })
        }
    }

    function mediaButtonClick(mediaType: MediaType) {
        if (mediaTypes.includes(mediaType)) {
            setMediaTypes(mediaTypes.filter((t) => t !== mediaType))
        } else {
            Promise.all([setMediaTypes([...mediaTypes, mediaType])]).then(() => {
                if (['image', 'audio'].includes(mediaType)) initializeMediaDropBox(mediaType)
            })
        }
    }

    function removeUrl(url) {
        setUrls((us) => [...us.filter((u) => u.url !== url)])
    }

    // images
    const [images, setImages] = useState<any[]>([])
    const [imageURL, setImageURL] = useState('')
    const [startIndex, setStartIndex] = useState(0)
    const [imageModalOpen, setImageModalOpen] = useState(false)

    function findImageSize() {
        if (images.length === 1) return 'large'
        if (images.length === 2) return 'medium'
        return 'small'
    }

    function addImageFiles(drop?) {
        const input = drop || (document.getElementById('image-input') as HTMLInputElement)
        if (input && input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i += 1) {
                const fileType = input.files[i].type.split('/')[1]
                if (allowedImageTypes.includes(`.${fileType}`)) {
                    const tooLarge = input.files[i].size > imageMBLimit * 1024 * 1024
                    if (tooLarge) setErrors([`Max image size: ${imageMBLimit} MBs`])
                    else {
                        const newImage = {
                            id: uuidv4(),
                            Image: {
                                file: input.files[i],
                                url: URL.createObjectURL(input.files[i]),
                            },
                        }
                        setImages((oldImages) => [...oldImages, newImage])
                        setErrors([])
                    }
                }
            }
        }
    }

    function addImageURL() {
        setImages([...images, { id: uuidv4(), Image: { url: imageURL } }])
        setImageURL('')
        setErrors([])
    }

    function removeImage(id) {
        setImages(images.filter((image) => image.id !== id))
        setErrors([])
    }

    function moveImage(index, increment) {
        const newImages = [...images]
        const image = newImages[index]
        newImages.splice(index, 1)
        newImages.splice(index + increment, 0, image)
        setImages(newImages)
    }

    function updateImageCaption(id, caption) {
        const newImages = [...images]
        const image = images.find((i) => i.id === id)
        image.text = caption
        setImages(newImages)
    }

    function renderImages() {
        // todo: create image card component and use main html so this render function can be removed
        return (
            <Scrollbars className={styles.images}>
                <Row>
                    {images.map((image, index) => (
                        <Column
                            key={image.id}
                            centerX
                            className={`${styles.imageWrapper} ${styles[findImageSize()]}`}
                        >
                            <CloseButton
                                size={20}
                                onClick={() => removeImage(image.id)}
                                style={{ position: 'absolute', right: 3, top: 3 }}
                            />
                            <button
                                className={styles.imageButton}
                                type='button'
                                onClick={() => {
                                    setStartIndex(index)
                                    setImageModalOpen(true)
                                }}
                            >
                                <img src={image.Image.url} alt='' />
                            </button>
                            <Row centerY style={{ width: '100%' }}>
                                <Input
                                    type='text'
                                    placeholder='add caption...'
                                    value={image.text}
                                    onChange={(value) => updateImageCaption(image.id, value)}
                                />
                            </Row>
                            <Row centerX className={styles.itemFooter}>
                                {index > 0 && (
                                    <button type='button' onClick={() => moveImage(index, -1)}>
                                        <ChevronLeftIcon />
                                    </button>
                                )}
                                {index < images.length - 1 && (
                                    <button type='button' onClick={() => moveImage(index, 1)}>
                                        <ChevronRightIcon />
                                    </button>
                                )}
                            </Row>
                        </Column>
                    ))}
                </Row>
            </Scrollbars>
        )
    }

    // audio
    const [audios, setAudios] = useState<any[]>([])
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const audioRecorder = useRef<any>(null)
    const recordingInterval = useRef<any>(null)

    function addAudioFiles(drop?) {
        const input = drop || (document.getElementById('audio-input') as HTMLInputElement)
        if (input && input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i += 1) {
                const fileType = input.files[i].type.split('/')[1]
                if (allowedAudioTypes.includes(`.${fileType}`)) {
                    const tooLarge = input.files[i].size > audioMBLimit * 1024 * 1024
                    if (tooLarge) setErrors([`Max audio size: ${audioMBLimit} MBs`])
                    else {
                        const newAudio = {
                            id: uuidv4(),
                            Audio: {
                                file: input.files[i],
                                url: URL.createObjectURL(input.files[i]),
                            },
                        }
                        setAudios((oldAudios) => [...oldAudios, newAudio])
                        setErrors([])
                    }
                }
            }
        }
    }

    function removeAudio(id) {
        setAudios(audios.filter((audio) => audio.id !== id))
    }

    function updateAudioCaption(id, caption) {
        const newAudioFiles = [...audios]
        const audio = newAudioFiles.find((a) => a.id === id)
        audio.text = caption
        setAudios(newAudioFiles)
    }

    function toggleAudioRecording() {
        if (recording) {
            audioRecorder.current.stopRecording(() => {
                clearInterval(recordingInterval.current)
                const file = new File([audioRecorder.current.getBlob()], '', { type: 'audio/wav' })
                const newAudio = {
                    id: uuidv4(),
                    Audio: { file, url: URL.createObjectURL(file) },
                }
                setAudios((audio) => [...audio, newAudio])
            })
            setRecording(false)
        } else {
            setRecordingTime(0)
            navigator.mediaDevices
                .getUserMedia({ audio: { sampleRate: 24000 } })
                .then((audioStream) => {
                    audioRecorder.current = RecordRTC(audioStream, {
                        type: 'audio',
                        mimeType: 'audio/wav',
                        recorderType: RecordRTC.StereoAudioRecorder,
                        bufferSize: 16384,
                        numberOfAudioChannels: 1,
                        desiredSampRate: 24000,
                    })
                    audioRecorder.current.startRecording()
                    recordingInterval.current = setInterval(() => {
                        setRecordingTime((t) => t + 1)
                    }, 1000)
                    setRecording(true)
                })
        }
    }

    // events
    const dateTimeOptions = {
        enableTime: true,
        clickOpens: true,
        disableMobile: true,
        minDate: new Date(),
        minuteIncrement: 1,
        altInput: true,
    }

    function removeEndDate() {
        const endTimeInstance = d3.select('#date-time-end').node()._flatpickr
        endTimeInstance.setDate(null)
        setEndTime('')
    }

    // poll
    const [pollType, setPollType] = useState('Single choice')
    const [pollAnswers, setPollAnswers] = useState<any[]>([])
    const [pollAnswersLocked, setPollAnswersLocked] = useState(false)
    // todo: handle loading state when fecthing spaces for governance poll
    const [pollAnswersLoading, setPollAnswersLoading] = useState(false)
    const [pollAction, setPollAction] = useState('None')
    const [pollThreshold, setPollThreshold] = useState(5)
    const pollColorScale = d3
        .scaleSequential()
        .domain([0, pollAnswers.length])
        .interpolator(d3.interpolateViridis)

    function addPollAnswer(newAnswer) {
        setPollAnswers([...pollAnswers, newAnswer])
        setErrors([])
    }

    function removePollAnswer(id) {
        setPollAnswers(pollAnswers.filter((a) => a.id !== id))
    }

    // card
    // todo: handle mentions
    const [cardRotating, setCardRotating] = useState(false)
    const [cardFlipped, setCardFlipped] = useState(false)
    const defaults = { type: 'card-face', text: '', mentions: [], images: [], watermark: false }
    const [card, setCard] = useState<any>({
        front: { id: uuidv4(), ...defaults },
        back: { id: uuidv4(), ...defaults },
    })
    const cardFace = card[cardFlipped ? 'back' : 'front']

    function rotateCard() {
        setCardRotating(true)
        setTimeout(() => {
            setCardFlipped(!cardFlipped)
            setCardRotating(false)
        }, 500)
    }

    function updateCardText(newText, newMentions) {
        const face = cardFlipped ? 'back' : 'front'
        setCard({ ...card, [face]: { ...cardFace, text: newText, mentions: newMentions } })
        setErrors([])
    }

    function toggleWatermark() {
        const face = cardFlipped ? 'back' : 'front'
        setCard({ ...card, [face]: { ...cardFace, watermark: !cardFace.watermark } })
    }

    function addCardImage() {
        const input = document.getElementById('card-image-input') as HTMLInputElement
        if (input && input.files && input.files.length) {
            const fileType = input.files[0].type.split('/')[1]
            if (allowedImageTypes.includes(`.${fileType}`)) {
                const tooLarge = input.files[0].size > imageMBLimit * 1024 * 1024
                if (tooLarge) setErrors([`Max image size: ${imageMBLimit} MBs`])
                else {
                    const newImage = {
                        id: uuidv4(),
                        Image: {
                            file: input.files[0],
                            url: URL.createObjectURL(input.files[0]),
                        },
                    }
                    const face = cardFlipped ? 'back' : 'front'
                    setCard({ ...card, [face]: { ...cardFace, images: [newImage] } })
                    setErrors([])
                }
            }
        }
    }

    function removeCardImage() {
        const face = cardFlipped ? 'back' : 'front'
        setCard({ ...card, [face]: { ...cardFace, images: [] } })
    }

    // game
    const [gameSettingsModalOpen, setGameSettingsModalOpen] = useState(false)
    const [gameSettings, setGameSettings] = useState<GameSettings>(
        () => type in GAMES && GAMES[type].defaultSettings
    )
    const [topicOptions, setTopicOptions] = useState<any[]>([])
    const [topicImage, setTopicImage] = useState<any>({ id: uuidv4(), Image: { url: '' } })
    const [beads, setBeads] = useState<any[]>([])
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)

    function uploadTopicImage() {
        const input = document.getElementById('topic-image-input') as HTMLInputElement
        if (input && input.files && input.files.length) {
            const fileType = input.files[0].type.split('/')[1]
            if (allowedImageTypes.includes(`.${fileType}`)) {
                const tooLarge = input.files[0].size > imageMBLimit * 1024 * 1024
                if (tooLarge) setErrors([`Max image size: ${imageMBLimit} MBs`])
                else {
                    setTopicImage({
                        id: uuidv4(),
                        Image: {
                            file: input.files[0],
                            url: URL.createObjectURL(input.files[0]),
                        },
                    })
                    setErrors([])
                }
            }
        }
    }

    // new game
    const initialGame = { steps: [] }
    const [status, setStatus] = useGameStatus({
        game: initialGame,
        editing: true,
        collapsed: false,
    })

    // todo: merge groups into single array
    function updateTopicText(topicText) {
        const arcMatches = GlassBeadGameTopics.archetopics.filter((t) =>
            t.name.toLowerCase().includes(topicText.toLowerCase())
        )
        const limMatches = GlassBeadGameTopics.liminal.filter((t) =>
            t.name.toLowerCase().includes(topicText.toLowerCase())
        )
        setTopicOptions(topicText ? [...arcMatches, ...limMatches].slice(0, 9) : [])
        setTitle(topicText)
        setErrors([])
    }

    function selectTopic(option) {
        setTitle(option.name)
        setTopicImage({ id: uuidv4(), Image: { url: option.imagePath } })
        setTopicOptions([])
        setErrors([])
    }

    function removeBead(beadIndex) {
        setBeads([...beads.filter((bead, i) => i + 1 !== beadIndex)])
    }

    function renderBeads() {
        const showNextBeadButton =
            !gameSettings.multiplayer &&
            (!gameSettings.totalMoves || beads.length < gameSettings.totalMoves)
        // if (postType === 'gbg-from-post' && synchronous) showNextBeadButton = false
        return (
            <Row centerX>
                <Scrollbars className={styles.beads}>
                    <Row>
                        {beads.map((bead, i) => (
                            <Row key={bead.id}>
                                <BeadCard
                                    bead={bead}
                                    beadIndex={i + 1}
                                    location='preview'
                                    removeBead={removeBead}
                                />
                                {(showNextBeadButton || i < beads.length - 1) && (
                                    <Row centerY className={styles.beadDivider}>
                                        <DNAIcon />
                                    </Row>
                                )}
                                {!showNextBeadButton &&
                                    i === beads.length - 1 &&
                                    beads.length > 2 && (
                                        <span style={{ width: 15, flexShrink: 0 }} />
                                    )}
                            </Row>
                        ))}
                        {showNextBeadButton && (
                            <button
                                type='button'
                                className={styles.newBeadButton}
                                onClick={() => setNextBeadModalOpen(true)}
                                style={{
                                    marginRight: beads.length > 1 ? 15 : 0,
                                }}
                            >
                                <PlusIcon />
                                <p>Click to create the {beads.length ? 'next' : 'first'} bead</p>
                            </button>
                        )}
                        <span style={{ marginLeft: -7, width: 7, flexShrink: 0 }} />
                    </Row>
                </Scrollbars>
            </Row>
        )
    }

    // todo: update when objects merged into array && check for image match
    function findTopicGroup() {
        if (mediaTypes.includes('glass-bead-game')) {
            const arcMatch = GlassBeadGameTopics.archetopics.find((t) => t.name === title)
            if (arcMatch) return 'archetopics'
            const limMatch = GlassBeadGameTopics.liminal.find((t) => t.name === title)
            if (limMatch) return 'liminal'
        }
        return null
    }

    function saveDisabled() {
        const urlsLoading = urls.find((u) => u.loading)
        const totalChars = findDraftLength(text)
        const allowNoContent = mediaTypes.includes('card')
        const noContent =
            !allowNoContent &&
            !totalChars &&
            !title &&
            !urls.length &&
            !images.length &&
            !audios.length
        return loading || urlsLoading || noContent || totalChars > maxChars
    }

    // todo: update link tally on linked item if present in list?
    function save() {
        setLoading(true)
        // update media types
        const newMediaTypes = [...mediaTypes]
        if (urls.length) newMediaTypes.unshift('url')
        if (title || findDraftLength(text)) newMediaTypes.unshift('text')
        // structure data
        const post = {
            type: 'post',
            mediaTypes: newMediaTypes.join(','),
            text: findDraftLength(text) ? text : null,
            title,
            mentions: mentions.map((m) => m.id),
            spaceIds: spaces.map((s) => s.id), // todo: filter out all in add spaces modal?
            urls,
            images,
            audios,
        } as any
        if (mediaTypes.includes('event')) post.event = { startTime, endTime }
        if (mediaTypes.includes('poll')) {
            post.poll = {
                answers: pollAnswers,
                locked: pollAnswersLocked,
                type: simplifyText(pollType),
            }
            if (type === 'poll') {
                post.poll.governance = true
                post.poll.action = pollAction === 'None' ? null : pollAction
                post.poll.threshold = pollAction === 'Create spaces' ? pollThreshold : null
            }
        }
        if (mediaTypes.includes('card')) {
            post.card = card
            const { front, back } = post.card
            // add searchable text and media types to card faces
            if (findDraftLength(front.text)) front.searchableText = getDraftPlainText(front.text)
            if (findDraftLength(back.text)) back.searchableText = getDraftPlainText(back.text)
            const frontMediaTypes = [] as string[]
            const backMediaTypes = [] as string[]
            if (front.searchableText) frontMediaTypes.push('text')
            if (back.searchableText) backMediaTypes.push('text')
            if (front.images[0]) frontMediaTypes.push('image')
            if (back.images[0]) backMediaTypes.push('image')
            front.mediaTypes = frontMediaTypes.join(',')
            back.mediaTypes = backMediaTypes.join(',')
        }
        if (mediaTypes.some(isSpecificGame)) {
            post.glassBeadGame = {
                settings: gameSettings,
                topicImage,
                topicGroup: findTopicGroup(),
                beads: !gameSettings.multiplayer && !gameSettings.synchronous ? beads : [],
            }
        }
        if (mediaTypes.includes('game')) {
            post.game = status
        }
        if (source) post.source = { type: source.type, id: source.id, linkDescription }
        if (type === 'poll') post.governance = { action: pollAction, threshold: pollThreshold }
        post.searchableText = findSearchableText(post)
        // validate post
        const validation = validatePost(post)
        if (validation.errors.length) {
            // display errors
            setErrors(validation.errors)
            setLoading(false)
        } else {
            // upload post
            uploadPost(post)
                .then((res) => {
                    // build new post
                    const { post: newPost, allSpaceIds, event } = res.data
                    const { id, handle, name, flagImagePath } = accountData
                    newPost.Creator = { id, handle, name, flagImagePath }
                    newPost.DirectSpaces = spaces.map((s) => {
                        return { ...s, state: 'active' }
                    })
                    if (event) newPost.Event = { ...event, Going: [], Interested: [] }
                    // add to feed
                    const addToSpaceFeed =
                        page === 's' && subPage === 'posts' && allSpaceIds.includes(spaceData.id)
                    const addToUserFeed =
                        page === 'u' && subPage === 'posts' && pageHandle === accountData.handle
                    if (addToSpaceFeed) setSpacePosts([newPost, ...spacePosts])
                    if (addToUserFeed) setUserPosts([newPost, ...userPosts])
                    if (type === 'poll') setGovernancePolls([...governancePolls, newPost])
                    setLoading(false)
                    setSaved(true)
                    setTimeout(() => onClose(), 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    // remove errors and initialise date picker if mediaTypes include event
    useEffect(() => {
        setErrors([])
        // initialise date picker
        if (mediaTypes.includes('event')) {
            const now = new Date()
            const startTimePast = new Date(startTime) < now
            const endTimePast = new Date(endTime) < now
            const defaultStartDate = startTime
                ? startTimePast
                    ? now
                    : new Date(startTime)
                : undefined
            const defaultEndDate = endTime ? (endTimePast ? now : new Date(endTime)) : undefined
            flatpickr('#date-time-start', {
                ...dateTimeOptions,
                defaultDate: defaultStartDate,
                appendTo: document.getElementById('date-time-start-wrapper') || undefined,
                onChange: ([value]) => {
                    setErrors([])
                    setStartTime(value.toString())
                },
            })
            flatpickr('#date-time-end', {
                ...dateTimeOptions,
                defaultDate: defaultEndDate,
                minDate: defaultStartDate,
                appendTo: document.getElementById('date-time-end-wrapper') || undefined,
                onChange: ([value]) => setEndTime(value.toString()),
            })
            if (startTimePast && defaultStartDate) setStartTime(defaultStartDate.toString())
            if (endTimePast && defaultEndDate) setStartTime(defaultEndDate.toString())
        }
    }, [mediaTypes])

    // update minimum end date when start date changed
    useEffect(() => {
        if (startTime) {
            const endTimeInstance = d3.select('#date-time-end').node()
            if (endTimeInstance) endTimeInstance._flatpickr.set('minDate', new Date(startTime))
        }
    }, [startTime])

    // grab metadata for new urls added to text field
    const requestIndex = useRef(0)
    useEffect(() => {
        const filteredUrls = Array.from(new Set(rawUrls)) // remove duplicates
            .filter((url) => !urls.find((u) => u.url === url)) // remove matches
            .slice(0, maxUrls - urls.length) // trim to maxUrl limit
        if (filteredUrls.length) {
            // requestIndex & setTimeout used to block requests until user has finished typing
            requestIndex.current += 1
            const index = requestIndex.current
            setTimeout(() => {
                if (requestIndex.current === index) {
                    filteredUrls.forEach(async (url) => {
                        // if no match in urls array
                        if (!urls.find((u) => u.url === url)) {
                            // add url loading state
                            setUrls((us) => [...us, { url, loading: true }])
                            // scrape url data
                            const { data } = await scrapeUrl(url)
                            // todo: handle error
                            if (data) {
                                data.url = url
                                data.searchableText = findUrlSearchableText(data)
                                // update urls array
                                setUrls((us) => us.map((u) => (u.url === url ? data : u)))
                            }
                        }
                    })
                }
            }, 500)
        }
    }, [rawUrls])

    // update poll answers when action changed
    useEffect(() => {
        if (pollAction === 'Create spaces') {
            setPollAnswersLoading(true)
            axios
                .get(`${config.apiURL}/space-children?spaceId=${spaceData.id}`)
                .then((res) => {
                    const newPollAnswers = res.data.map((space) => {
                        return {
                            id: uuidv4(),
                            text: space.name,
                            urls: [],
                            images: [],
                            audios: [],
                            Creator: space.Creator,
                            Link: { state: 'done' },
                        }
                    })
                    setPollAnswers([...newPollAnswers, ...pollAnswers])
                    setPollAnswersLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setPollAnswers(pollAnswers.filter((a) => !a.Link))
        }
    }, [pollAction])

    return (
        <Modal className={styles.wrapper} close={onClose} centerX confirmClose={!saved}>
            {saved ? (
                <SuccessMessage text='Post created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <h1>{MODAL_HEADER[type]}</h1>
                    {mediaTypes.some(isSpecificGame) && GAMES[type].settingsEditable && (
                        <Button
                            text='Game settings'
                            color='aqua'
                            icon={<SettingsIcon />}
                            onClick={() => setGameSettingsModalOpen(true)}
                            style={{ marginBottom: 20 }}
                        />
                    )}
                    {source && (
                        <Column centerX style={{ width: '100%', maxWidth: 350, marginBottom: 20 }}>
                            <p style={{ marginBottom: 10 }}>linked from post ID: {source.id}</p>
                            <Input
                                type='text'
                                placeholder='Link description...'
                                value={linkDescription}
                                onChange={(value) => setLinkDescription(value)}
                                style={{ width: '100%', marginRight: 10 }}
                            />
                        </Column>
                    )}
                    <Column className={styles.postCard}>
                        <Row centerY className={styles.header}>
                            <ImageTitle
                                type='user'
                                imagePath={accountData.flagImagePath}
                                imageSize={32}
                                title={accountData.name}
                                style={{ marginRight: 5 }}
                                shadow
                            />
                            <PostSpaces spaces={spaces} preview />
                            <p className='grey'>now</p>
                            {type !== 'poll' && (
                                <button
                                    className={styles.addSpacesButton}
                                    type='button'
                                    title='Click to add spaces'
                                    onClick={() => setSpacesModalOpen(true)}
                                >
                                    + Spaces
                                </button>
                            )}
                        </Row>
                        <Column className={styles.content}>
                            {showTitle && !mediaTypes.some(isSpecificGame) && (
                                <Row centerY spaceBetween className={styles.title}>
                                    <input
                                        placeholder='Title...'
                                        type='text'
                                        value={title}
                                        maxLength={100}
                                        onChange={(e) => {
                                            setTitle(e.target.value)
                                            setErrors([])
                                        }}
                                    />
                                    <CloseButton
                                        size={20}
                                        onClick={() => {
                                            setTitle('')
                                            setShowTitle(false)
                                        }}
                                    />
                                </Row>
                            )}
                            {mediaTypes.some(isSpecificGame) && (
                                <Row centerY spaceBetween className={styles.topic}>
                                    <Column centerX centerY className={styles.imageWrapper}>
                                        {topicImage.Image.url && (
                                            <img src={topicImage.Image.url} alt='' />
                                        )}
                                        <ImageIcon />
                                        <label htmlFor='topic-image-input'>
                                            <input
                                                type='file'
                                                id='topic-image-input'
                                                accept={allowedImageTypes.join(',')}
                                                onChange={uploadTopicImage}
                                                hidden
                                            />
                                        </label>
                                    </Column>
                                    <Column className={styles.text}>
                                        <input
                                            placeholder='Topic...'
                                            type='text'
                                            maxLength={50}
                                            value={title}
                                            onChange={(e) => updateTopicText(e.target.value)}
                                            onBlur={() =>
                                                setTimeout(() => setTopicOptions([]), 200)
                                            }
                                        />
                                        {topicOptions.length > 0 && (
                                            <Column className={styles.topicOptions}>
                                                {topicOptions.map((option) => (
                                                    <button
                                                        key={option.name}
                                                        className={styles.option}
                                                        type='button'
                                                        onClick={() => selectTopic(option)}
                                                    >
                                                        <img src={option.imagePath} alt='' />
                                                        <p>{option.name}</p>
                                                    </button>
                                                ))}
                                            </Column>
                                        )}
                                    </Column>
                                </Row>
                            )}
                            <DraftTextEditor
                                className={styles.text}
                                type='post'
                                text={text}
                                maxChars={maxChars}
                                onChange={(value, textMentions, textUrls) => {
                                    setText(value)
                                    setMentions(textMentions)
                                    setRawUrls(textUrls)
                                    setErrors([])
                                }}
                            />
                            {urls.map((u) => (
                                <UrlCard
                                    key={u.url}
                                    type='post'
                                    urlData={u}
                                    loading={u.loading}
                                    remove={removeUrl}
                                    style={{ marginTop: 10 }}
                                />
                            ))}
                            {mediaTypes.includes('image') && (
                                <Column id='image-drop' className={styles.dropBlockWrapper}>
                                    <Row centerY centerX wrap>
                                        <ImageIcon className={styles.icon} />
                                        <Row className={styles.fileUploadInput}>
                                            <label htmlFor='image-input'>
                                                Upload images
                                                <input
                                                    type='file'
                                                    id='image-input'
                                                    accept={allowedImageTypes.join(',')}
                                                    onChange={() => addImageFiles()}
                                                    multiple
                                                    hidden
                                                />
                                            </label>
                                        </Row>
                                        <p style={{ margin: '0 10px' }}>or</p>
                                        <Row centerY>
                                            <Input
                                                type='text'
                                                placeholder='paste image URL...'
                                                value={imageURL}
                                                onChange={(v) => setImageURL(v)}
                                                style={{ width: 180, marginRight: 10 }}
                                            />
                                            <Button
                                                text='Add URL'
                                                color='aqua'
                                                disabled={!imageURL}
                                                onClick={addImageURL}
                                            />
                                        </Row>
                                    </Row>
                                    <Row centerX>{images.length > 0 && renderImages()}</Row>
                                </Column>
                            )}
                            {mediaTypes.includes('audio') && (
                                <Column id='audio-drop' className={styles.dropBlockWrapper}>
                                    <Row centerY centerX wrap>
                                        <AudioIcon className={styles.icon} />
                                        <Row
                                            className={styles.fileUploadInput}
                                            style={{ marginRight: 10 }}
                                        >
                                            <label htmlFor='audio-input'>
                                                Upload audio
                                                <input
                                                    type='file'
                                                    id='audio-input'
                                                    accept={allowedAudioTypes.join(',')}
                                                    onChange={() => addAudioFiles()}
                                                    multiple
                                                    hidden
                                                />
                                            </label>
                                        </Row>
                                        <Button
                                            text={recording ? 'Stop recording' : 'Record audio'}
                                            color='red'
                                            onClick={toggleAudioRecording}
                                        />
                                        {recording && (
                                            <h2 style={{ margin: '0 0 0 10px' }}>
                                                {formatTimeMMSS(recordingTime)}
                                            </h2>
                                        )}
                                    </Row>
                                    <Column>
                                        {audios.map((audio) => (
                                            <Column
                                                key={audio.id}
                                                style={{ position: 'relative', marginTop: 20 }}
                                            >
                                                <CloseButton
                                                    size={18}
                                                    onClick={() => removeAudio(audio.id)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: 5,
                                                        top: 5,
                                                        zIndex: 5,
                                                    }}
                                                />
                                                <AudioCard
                                                    id={audio.id}
                                                    url={audio.Audio.url}
                                                    staticBars={250}
                                                    location='new-post'
                                                    remove={() => removeAudio(audio.id)}
                                                    style={{ height: 150, marginBottom: 10 }}
                                                />
                                                <Input
                                                    type='text'
                                                    placeholder='add caption...'
                                                    value={audio.text}
                                                    onChange={(value) =>
                                                        updateAudioCaption(audio.id, value)
                                                    }
                                                />
                                            </Column>
                                        ))}
                                    </Column>
                                </Column>
                            )}
                            {mediaTypes.includes('event') && (
                                <Row centerX centerY wrap className={styles.blockWrapper}>
                                    <CalendarIcon className={styles.icon} />
                                    <div id='date-time-start-wrapper'>
                                        <Input
                                            id='date-time-start'
                                            type='text'
                                            placeholder='Start time...'
                                            style={{ width: 230 }}
                                        />
                                    </div>
                                    <p style={{ margin: '0 10px', lineHeight: '14px' }}>→</p>
                                    <div id='date-time-end-wrapper'>
                                        <Input
                                            id='date-time-end'
                                            type='text'
                                            placeholder='End time... (optional)'
                                            style={{ width: 230 }}
                                        />
                                    </div>
                                    {endTime && (
                                        <CloseButton
                                            size={20}
                                            onClick={removeEndDate}
                                            style={{ marginLeft: 5 }}
                                        />
                                    )}
                                </Row>
                            )}
                            {mediaTypes.includes('poll') && (
                                <Column className={styles.blockWrapper}>
                                    <Row wrap centerY centerX>
                                        <PollIcon className={styles.icon} />
                                        <Toggle
                                            leftText='Lock answers'
                                            positionLeft={!pollAnswersLocked}
                                            rightColor='blue'
                                            onClick={() => {
                                                setPollAnswersLocked(!pollAnswersLocked)
                                                setErrors([])
                                            }}
                                            onOffText
                                            style={{ margin: '5px 10px' }}
                                        />
                                        {type === 'poll' && (
                                            <DropDown
                                                title='Action'
                                                options={['None', 'Create spaces']} // 'Assign Moderators'
                                                selectedOption={pollAction}
                                                setSelectedOption={(option) =>
                                                    setPollAction(option)
                                                }
                                                style={{ margin: '5px 10px' }}
                                            />
                                        )}
                                        {type === 'poll' && pollAction === 'Create spaces' && (
                                            <Row centerY style={{ margin: '5px 10px' }}>
                                                <p>Threshold</p>
                                                <Input
                                                    type='number'
                                                    min={1}
                                                    max={1000}
                                                    value={pollThreshold}
                                                    onChange={(v) => setPollThreshold(v)}
                                                    style={{ width: 70, marginLeft: 10 }}
                                                />
                                            </Row>
                                        )}
                                        <DropDown
                                            title='Vote type'
                                            options={[
                                                'Single choice',
                                                'Multiple choice',
                                                'Weighted choice',
                                            ]}
                                            selectedOption={pollType}
                                            setSelectedOption={(option) => setPollType(option)}
                                            style={{ margin: '5px 10px' }}
                                        />
                                    </Row>
                                    {pollAnswers.length > 0 && (
                                        <Column className={styles.pollAnswers}>
                                            {pollAnswers.map((answer, index) => (
                                                <PollAnswer
                                                    key={answer.id}
                                                    index={index}
                                                    answer={answer}
                                                    type={pollType}
                                                    percentage={0} // todo: make optional prop if not used here
                                                    color={pollColorScale(index)}
                                                    remove={() => removePollAnswer(answer.id)}
                                                    removable={answer.state !== 'done'}
                                                    style={{ marginTop: 10 }}
                                                    preview
                                                />
                                            ))}
                                        </Column>
                                    )}
                                    <CommentInput
                                        type='poll-answer'
                                        preview
                                        placeholder='New answer...'
                                        onSave={(data) => addPollAnswer(data)}
                                        style={{ marginTop: 10 }}
                                    />
                                </Column>
                            )}
                            {mediaTypes.includes('card') && (
                                <Column centerX className={styles.cardContainer}>
                                    <Column centerX className={styles.cardFlip}>
                                        <button
                                            type='button'
                                            title='Click to rotate'
                                            onClick={rotateCard}
                                        >
                                            <RepostIcon />
                                        </button>
                                        <p>{cardFlipped ? 'Back' : 'Front'}</p>
                                    </Column>
                                    <Column centerX className={styles.cardWrapper}>
                                        <Column
                                            centerX
                                            className={`${styles.card} ${
                                                cardRotating && styles.rotating
                                            }`}
                                        >
                                            <Column centerX className={styles.cardContent}>
                                                {cardFace.images[0] && (
                                                    <img
                                                        src={cardFace.images[0].Image.url}
                                                        alt='background'
                                                        style={{
                                                            opacity: cardFace.watermark ? 0.3 : 1,
                                                        }}
                                                    />
                                                )}
                                                <DraftTextEditor
                                                    key={cardFace.id}
                                                    className={styles.textEditor}
                                                    type='card'
                                                    text={cardFace.text}
                                                    maxChars={maxChars}
                                                    onChange={updateCardText}
                                                />
                                            </Column>
                                        </Column>
                                    </Column>
                                    <Row>
                                        {cardFace.images[0] ? (
                                            <Row>
                                                <Button
                                                    text='Remove image'
                                                    color='red'
                                                    onClick={removeCardImage}
                                                />
                                                <Toggle
                                                    leftText='Watermark'
                                                    positionLeft={!cardFace.watermark}
                                                    rightColor='blue'
                                                    onClick={toggleWatermark}
                                                    style={{ marginLeft: 10 }}
                                                    onOffText
                                                />
                                            </Row>
                                        ) : (
                                            <Row className={styles.fileUploadInput}>
                                                <label htmlFor='card-image-input'>
                                                    Add image
                                                    <input
                                                        type='file'
                                                        id='card-image-input'
                                                        accept={allowedImageTypes.join(',')}
                                                        onChange={addCardImage}
                                                        hidden
                                                    />
                                                </label>
                                            </Row>
                                        )}
                                    </Row>
                                </Column>
                            )}
                            {mediaTypes.some(isSpecificGame) && (
                                <Column className={styles.game}>
                                    {!gameSettings.synchronous && (
                                        <Column>
                                            {gameSettings.multiplayer && (
                                                <Row
                                                    spaceBetween
                                                    centerY
                                                    className={styles.gameInfo}
                                                >
                                                    {gameSettings.players.length ? (
                                                        <>
                                                            <FlagImageHighlights
                                                                type='user'
                                                                images={gameSettings.players
                                                                    .splice(0, 3)
                                                                    .map((p) => p.flagImagePath)}
                                                                imageSize={30}
                                                                text={`${gameSettings.players.length} players`}
                                                            />
                                                            <Row centerY>
                                                                <p>
                                                                    Waiting for{' '}
                                                                    {gameSettings.players.length -
                                                                        1}
                                                                </p>
                                                                <FlagImageHighlights
                                                                    type='user'
                                                                    images={gameSettings.players
                                                                        .splice(0, 3)
                                                                        .filter(
                                                                            (p) =>
                                                                                p.id !==
                                                                                accountData.id
                                                                        )
                                                                        .map(
                                                                            (p) => p.flagImagePath
                                                                        )}
                                                                    imageSize={30}
                                                                    style={{ marginLeft: 10 }}
                                                                />
                                                            </Row>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Row centerY>
                                                                <UsersIcon />
                                                                <p>Open to all users</p>
                                                            </Row>
                                                            <p>
                                                                Waiting for move: 1{' '}
                                                                {gameSettings.totalMoves
                                                                    ? `/ ${gameSettings.totalMoves}`
                                                                    : ''}
                                                            </p>
                                                        </>
                                                    )}
                                                </Row>
                                            )}
                                        </Column>
                                    )}
                                    {!gameSettings.synchronous &&
                                        !gameSettings.multiplayer &&
                                        renderBeads()}
                                </Column>
                            )}
                            {mediaTypes.includes('game') && (
                                <GameCard
                                    initialGame={initialGame}
                                    status={status}
                                    setStatus={setStatus}
                                />
                            )}
                        </Column>
                    </Column>
                    {!!contentTypes.length && (
                        <Row style={{ marginBottom: 20 }}>
                            {contentTypes.map((contentType) => (
                                <MediaButton
                                    key={contentType}
                                    type={contentType}
                                    selected={mediaTypes.includes(contentType)}
                                    onClick={() => mediaButtonClick(contentType)}
                                />
                            ))}
                        </Row>
                    )}
                    <Column centerX className={styles.errors}>
                        <p>{errors[0]}</p>
                    </Column>
                    <Button
                        text='Post'
                        color='blue'
                        disabled={saveDisabled()}
                        loading={loading}
                        onClick={save}
                    />
                </Column>
            )}
            {spacesModalOpen && (
                <AddPostSpacesModal
                    spaces={spaces}
                    setSpaces={setSpaces}
                    close={() => setSpacesModalOpen(false)}
                />
            )}
            {imageModalOpen && (
                <ImageModal
                    images={images}
                    startIndex={startIndex}
                    close={() => setImageModalOpen(false)}
                />
            )}
            {gameSettingsModalOpen && (
                <GameSettingsModal
                    settings={gameSettings}
                    setSettings={(newSettings) => {
                        setGameSettings(newSettings)
                        setErrors([])
                    }}
                    close={() => setGameSettingsModalOpen(false)}
                />
            )}
            {nextBeadModalOpen && (
                <NextBeadModal
                    preview
                    settings={gameSettings}
                    players={gameSettings.players}
                    onSave={(bead) => {
                        setBeads([...beads, bead])
                        setErrors([])
                    }}
                    close={() => setNextBeadModalOpen(false)}
                />
            )}
        </Modal>
    )
}

export default CreatePostModal
