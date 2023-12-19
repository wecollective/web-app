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
import AudioCard from '@components/cards/PostCard/AudioCard'
import BeadCard from '@components/cards/PostCard/BeadCard'
import PollAnswer from '@components/cards/PostCard/PollAnswer'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import AddPostSpacesModal from '@components/modals/AddPostSpacesModal'
import GBGHelpModal from '@components/modals/GBGHelpModal'
import GBGSettingsModal from '@components/modals/GBGSettingsModal'
import ImageModal from '@components/modals/ImageModal'
import Modal from '@components/modals/Modal'
// import ShowMoreLess from '@components/ShowMoreLess'
import SuccessMessage from '@components/SuccessMessage'
import Toggle from '@components/Toggle'
import PostSpaces from '@components/cards/PostCard/PostSpaces'
import UrlPreview from '@components/cards/PostCard/UrlCard'
import CommentInput from '@components/draft-js/CommentInput'
import NextBeadModal from '@components/modals/NextBeadModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import {
    allowedAudioTypes,
    allowedImageTypes,
    audioMBLimit,
    capitalise,
    defaultGBGSettings,
    findDraftLength,
    findSearchableText,
    findUrlSearchableText,
    formatTimeMMSS,
    imageMBLimit,
    postTypeIcons,
    scrapeUrl,
    simplifyText,
    uploadPost,
    validatePost,
} from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/CreatePostModal.module.scss'
import {
    AudioIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DNAIcon,
    HelpIcon,
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
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'

const { white, red, orange, yellow, green, blue, purple } = colors
const beadColors = [white, red, orange, yellow, green, blue, purple]
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

function CreatePostModal(): JSX.Element {
    const {
        accountData,
        setCreatePostModalOpen,
        createPostModalSettings,
        setCreatePostModalSettings,
    } = useContext(AccountContext)
    const { sourceType, sourceId, game, governance } = createPostModalSettings
    const { spaceData, spacePosts, setSpacePosts, governancePolls, setGovernancePolls } =
        useContext(SpaceContext)
    const { userPosts, setUserPosts } = useContext(UserContext)
    const [loading, setLoading] = useState(false)
    const [linkDescription, setLinkDescription] = useState('')
    const [mediaTypes, setMediaTypes] = useState<string[]>([])
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
    const cookies = new Cookies()
    const maxUrls = 5
    const urlRequestIndex = useRef(0)
    const location = useLocation()
    const [x, page, pageHandle, subPage] = location.pathname.split('/')
    let contentTypes = ['image', 'audio', 'event', 'poll']
    if (game) contentTypes = ['glass-bead-game', 'card']
    if (governance) contentTypes = []

    function closeModal() {
        setCreatePostModalOpen(false)
        setCreatePostModalSettings({})
    }

    function findModalHeader() {
        return 'New post'
        // if (governance) return 'New governance poll'
        // if (postType === 'text') return 'New post'
        // if (postType === 'image') return 'New image post'
        // if (postType === 'audio') return 'New audio post'
        // if (postType === 'event') return 'New event'
        // if (postType === 'poll') return 'New poll'
        // if (postType === 'card') return 'New card'
        // if (postType === 'glass-bead-game') return 'New Glass Bead Game'
        // return ''
    }

    function initializeMediaDropBox(type) {
        let dragLeaveCounter = 0 // used to avoid dragleave firing when hovering child elements
        const dropbox = document.getElementById(`${type}-drop`)
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
                    if (type === 'image') addImageFiles(e.dataTransfer)
                    if (type === 'audio') addAudioFiles(e.dataTransfer)
                }
            })
        }
    }

    function mediaButtonClick(type) {
        if (mediaTypes.includes(type)) setMediaTypes(mediaTypes.filter((t) => t !== type))
        else {
            Promise.all([setMediaTypes([...mediaTypes, type])]).then(() => {
                if (['image', 'audio'].includes(type)) initializeMediaDropBox(type)
            })
        }
    }

    function removeUrlMetaData(url) {
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
                                style={{ position: 'absolute', right: 0 }}
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
    // todo: store cards as post array
    const [cardRotating, setCardRotating] = useState(false)
    const [cardFlipped, setCardFlipped] = useState(false)
    const [cardFrontType, setCardFrontType] = useState('text')
    const [cardFrontText, setCardFrontText] = useState('')
    const [cardFrontMentions, setCardFrontMentions] = useState<any[]>([])
    const [cardFrontImage, setCardFrontImage] = useState<File>()
    const [cardFrontWatermark, setCardFrontWatermark] = useState(false)
    const [cardBackType, setCardBackType] = useState('text')
    const [cardBackText, setCardBackText] = useState('')
    const [cardBackMentions, setCardBackMentions] = useState<any[]>([])
    const [cardBackImage, setCardBackImage] = useState<File>()
    const [cardBackWatermark, setCardBackWatermark] = useState(false)

    function rotateCard() {
        setCardRotating(true)
        setTimeout(() => {
            setCardFlipped(!cardFlipped)
            setCardRotating(false)
        }, 500)
    }

    function cardContainerExpanded() {
        if (cardFlipped) {
            return cardBackType === 'text' ? styles.expanded : null
        }
        return cardFrontType === 'text' ? styles.expanded : null
    }

    // todo: handle errors
    function addCardImage() {
        const input = document.getElementById('card-image-file-input') as HTMLInputElement
        if (input && input.files && input.files.length) {
            // const tooLarge = '
            if (input.files[0].size > imageMBLimit * 1024 * 1024) setErrors([''])
            else if (cardFlipped) {
                setCardBackImage(input.files[0])
                setErrors([])
                // setCardImageSizeError(false)
            } else {
                setCardFrontImage(input.files[0])
                setErrors([])
                // setCardFrontError(false)
                // setCardImageSizeError(false)
            }
        }
    }

    function removeCardImage() {
        if (cardFlipped) setCardBackImage(undefined)
        else setCardFrontImage(undefined)
    }

    // gbg
    const [topic, setTopic] = useState('') // todo: use title?
    const [topicOptions, setTopicOptions] = useState<any[]>([])
    const [topicImageFile, setTopicImageFile] = useState<File | undefined>()
    const [topicImageURL, setTopicImageURL] = useState('')
    const [GBGSettingsModalOpen, setGBGSettingsModalOpen] = useState(false)
    const [GBGHelpModalOpen, setGBGHelpModalOpen] = useState(false)
    const [GBGSettings, setGBGSettings] = useState<any>(defaultGBGSettings)
    const { synchronous, multiplayer, players, totalMoves, movesPerPlayer } = GBGSettings
    const [beads, setBeads] = useState<any[]>([])
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)

    function uploadTopicImage() {
        const input = document.getElementById('topic-image-file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            setTopicImageURL('')
            if (input.files[0].size > imageMBLimit * 1024 * 1024) {
                setTopicImageFile(undefined)
                input.value = ''
            } else {
                setTopicImageFile(input.files[0])
                setTopicImageURL(URL.createObjectURL(input.files[0]))
            }
        }
    }

    function updateTopicText(topicText) {
        // todo: merge groups into single array
        const arcMatches = GlassBeadGameTopics.archetopics.filter((t) =>
            t.name.toLowerCase().includes(topicText.toLowerCase())
        )
        const limMatches = GlassBeadGameTopics.liminal.filter((t) =>
            t.name.toLowerCase().includes(topicText.toLowerCase())
        )
        setTopicOptions(topicText ? [...arcMatches, ...limMatches].slice(0, 9) : [])
        setTopic(topicText)
        setErrors([])
    }

    function selectTopic(option) {
        setTopic(option.name)
        setTopicImageURL(option.imagePath)
        setTopicOptions([])
        setErrors([])
    }

    function renderGBGInfoRow() {
        return (
            <Row spaceBetween centerY className={styles.gbgInfo}>
                {players.length ? (
                    <>
                        <FlagImageHighlights
                            type='user'
                            imagePaths={players.map((p) => p.flagImagePath)}
                            imageSize={30}
                            text={`${players.length} players`}
                        />
                        <Row centerY>
                            <p>Waiting for {players.length - 1}</p>
                            <FlagImageHighlights
                                type='user'
                                imagePaths={players
                                    .filter((p) => p.id !== accountData.id)
                                    .map((p) => p.flagImagePath)}
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
                        <p>Waiting for move: 1 {totalMoves ? `/ ${totalMoves}` : ''}</p>
                    </>
                )}
            </Row>
        )
    }

    function removeBead(beadIndex) {
        setBeads([...beads.filter((bead, i) => i + 1 !== beadIndex)])
    }

    function renderBeads() {
        const showNextBeadButton = !multiplayer && (!totalMoves || beads.length < totalMoves)
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

    // todo: update for multiple media types
    // function postValid() {
    //     let valid = true
    //     console.log('beads: ', beads)
    //     console.log('total size: ', findTotalUploadSize())
    //     console.log('audios: ', audios)
    //     if (findTotalUploadSize() > 5) {
    //         setTotalUploadSizeError(true)
    //         valid = false
    //     }
    //     const totalChars = findDraftLength(text)
    //     if (mediaTypes.includes('text')) {
    //         if (totalChars < 1 && !title && !urls.length) {
    //             setNoTextError(true)
    //             valid = false
    //         }
    //         if (totalChars > maxChars) {
    //             setMaxCharsErrors(true)
    //             valid = false
    //         }
    //     }
    //     if (mediaTypes.includes('image')) {
    //         if (!images.length) {
    //             setNoImagesError(true)
    //             valid = false
    //         }
    //     }
    //     if (mediaTypes.includes('audio')) {
    //         if (!audios.length) {
    //             setNoAudioError(true)
    //             valid = false
    //         }
    //     }
    //     if (mediaTypes.includes('event')) {
    //         if (totalChars < 1 && !title) {
    //             setEventTextError(true)
    //             valid = false
    //         }
    //         if (!startTime) {
    //             setNoEventTimesError(true)
    //             valid = false
    //         }
    //     }
    //     if (mediaTypes.includes('poll')) {
    //         if (totalChars < 1 && !title) {
    //             setPollTextError(true)
    //             valid = false
    //         }
    //         if (pollAnswersLocked && pollAnswers.length < 2) {
    //             setPollAnswersError(true)
    //             valid = false
    //         }
    //     }
    //     // todo: check total upload size
    //     if (mediaTypes.includes('glass-bead-game')) {
    //         if (!topic) {
    //             setTopicError(true)
    //             valid = false
    //         }
    //         if (!synchronous && !multiplayer && !beads.length) {
    //             setNoBeadsError(true)
    //             valid = false
    //         }
    //     }
    //     if (mediaTypes.includes('card')) {
    //         const frontTotalChars = findDraftLength(cardFrontText)
    //         const backTotalChars = findDraftLength(cardBackText)
    //         if (!cardFrontImage && frontTotalChars === 0) {
    //             setCardFrontError(true)
    //             valid = false
    //         } else if (!cardBackImage && backTotalChars === 0) {
    //             setCardBackError(true)
    //             valid = false
    //         }
    //     }
    //     const postMediaTypes = [...mediaTypes]
    //     if (urls.length) postMediaTypes.unshift('url')
    //     if (!mediaTypes.length || findDraftLength(text)) postMediaTypes.unshift('text')
    //     console.log('media types: ', postMediaTypes, mediaTypes)
    //     return valid
    // }

    function findTopicGroup() {
        if (mediaTypes.includes('glass-bead-game')) {
            // todo: update when objects merged into array && check for image match
            const arcMatch = GlassBeadGameTopics.archetopics.find((t) => t.name === topic)
            if (arcMatch) return 'archetopics'
            const limMatch = GlassBeadGameTopics.liminal.find((t) => t.name === topic)
            if (limMatch) return 'liminal'
        }
        return null
    }

    function saveDisabled() {
        const urlsLoading = urls.find((u) => u.loading)
        const totalChars = findDraftLength(text)
        const noContent = !totalChars && !title && !urls.length && !images.length && !audios.length
        return loading || urlsLoading || noContent || totalChars > maxChars
    }

    // working: text, url, image, audio, event, poll
    // not working: card, gbg
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
            title: mediaTypes.includes('glass-bead-game') ? topic : title, // todo: just use title?
            mentions: mentions.map((m) => m.id),
            spaceIds: spaces.map((s) => s.id), // todo: filter out all in add spaces modal?
            urls,
            images,
            audios,
        } as any
        post.searchableText = findSearchableText(post)
        if (mediaTypes.includes('event')) post.event = { startTime, endTime }
        if (mediaTypes.includes('poll')) {
            post.poll = {
                answers: pollAnswers,
                locked: pollAnswersLocked,
                type: simplifyText(pollType),
            }
            if (governance) {
                post.poll.governance = true
                post.poll.action = pollAction === 'None' ? null : pollAction
                post.poll.threshold = pollAction === 'Create spaces' ? pollThreshold : null
            }
        }
        console.log('new post: ', post)
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
                    console.log('uploadPost res:', res.data)
                    // build new post
                    const { post: newPost, allSpaceIds, event } = res.data
                    const { id, handle, name, flagImagePath } = accountData
                    newPost.Creator = { id, handle, name, flagImagePath }
                    newPost.DirectSpaces = spaces.map((s) => {
                        return { ...s, state: 'active' }
                    })
                    if (event) newPost.Event = { ...event, Going: [], Interested: [] }
                    // add post to feed
                    const addPostToSpaceFeed =
                        page === 's' && subPage === 'posts' && allSpaceIds.includes(spaceData.id)
                    const addPostToUserFeed =
                        page === 'u' && subPage === 'posts' && pageHandle === accountData.handle
                    if (addPostToSpaceFeed) setSpacePosts([newPost, ...spacePosts])
                    if (addPostToUserFeed) setUserPosts([newPost, ...userPosts])
                    if (governance) setGovernancePolls([...governancePolls, newPost])
                    setLoading(false)
                    setSaved(true)
                    setTimeout(() => closeModal(), 1000)
                })
                .catch((error) => console.log(error))
        }
        // if (postValid()) {
        //     setLoading(true)
        //     // update media types
        //     const newMediaTypes = [...mediaTypes]
        //     if (urls.length) newMediaTypes.unshift('url')
        //     if (title || findDraftLength(text)) newMediaTypes.unshift('text')
        //     // create post data
        //     const postData = {
        //         // get on server
        //         // creatorName: accountData.name,
        //         // creatorHandle: accountData.handle,
        //         mediaTypes: newMediaTypes.join(','),
        //         spaceIds: spaces.map((s) => s.id), // todo: filter out all
        //         title: mediaTypes.includes('glass-bead-game') ? topic : title, // todo: just use title?
        //         text: findDraftLength(text) ? text : null,
        //         mentions: mentions.map((m) => m.link),
        //         // urls: urls,
        //         // images: mediaTypes.includes('image') ? images : [],
        //         // startTime,
        //         // endTime,
        //         // pollType: pollType.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        //         // pollAnswersLocked,
        //         // pollAnswers,
        //         // topicGroup: findTopicGroup(),
        //         // topicImageUrl: topicImageFile ? null : topicImageURL,
        //         // gbgSettings: GBGSettings,
        //         // beads: !synchronous && !multiplayer ? beads : [],
        //         // cardFrontText: findDraftLength(cardFrontText) ? cardFrontText : null,
        //         // cardBackText: findDraftLength(cardBackText) ? cardBackText : null,
        //         // cardFrontWatermark,
        //         // cardBackWatermark,
        //     } as any
        //     // add media data
        //     const formData = new FormData()
        //     // formData entry values: fieldname (used here for types), file, originalname (used here for ids)
        //     // current fieldname types: 'image', 'audio', 'audio-blob'
        //     if (mediaTypes.includes('url')) postData.urls = urls
        //     if (mediaTypes.includes('image')) {
        //         postData.images = images.map((i) => {
        //             return { id: i.id, text: i.text, url: i.Image.file ? null : i.Image.url }
        //         })
        //         images.forEach((i) => {
        //             if (i.Image.file) formData.append('image', i.Image.file, i.id)
        //         })
        //     }
        //     if (mediaTypes.includes('audio')) {
        //         postData.audios = audios.map((a) => {
        //             return { id: a.id, text: a.text }
        //         })
        //         audios.forEach((a) =>
        //             formData.append(`audio${a.Audio.file.name ? '' : '-blob'}`, a.Audio.file, a.id)
        //         )
        //     }
        //     if (mediaTypes.includes('event')) {
        //         postData.startTime = startTime
        //         postData.endTime = endTime
        //     }
        //     if (mediaTypes.includes('poll')) {
        //         postData.pollType = simplifyText(pollType)
        //         postData.pollAnswersLocked = pollAnswersLocked
        //         // todo: refactor for answers with media
        //         postData.pollAnswers = pollAnswers
        //     }
        //     if (mediaTypes.includes('card')) {
        //         const frontChars = findDraftLength(cardFrontText)
        //         const backChars = findDraftLength(cardBackText)
        //         postData.cardFront = {
        //             text: frontChars ? cardFrontText : null,
        //             searchableText: frontChars ? getDraftPlainText(cardFrontText) : null,
        //             watermark: cardFrontWatermark,
        //         }
        //         postData.cardBack = {
        //             text: backChars ? cardBackText : null,
        //             searchableText: backChars ? getDraftPlainText(cardBackText) : null,
        //             watermark: cardBackWatermark,
        //         }
        //         if (cardFrontImage) formData.append('image', cardFrontImage, 'card-front-image')
        //         if (cardBackImage) formData.append('image', cardBackImage, 'card-back-image')
        //     }
        //     if (mediaTypes.includes('glass-bead-game')) {
        //         postData.gbgSettings = GBGSettings
        //         postData.topicGroup = findTopicGroup()
        //         postData.topicImageUrl = topicImageFile ? null : topicImageURL
        //         if (topicImageFile) formData.append('image', topicImageFile, 'topic-image')
        //         if (!synchronous && !multiplayer) {
        //             // add beads
        //             // what is the current bead structure?
        //             // { id: uuid,  }
        //             postData.beads = beads.map((bead) => {
        //                 let mediaUrl
        //                 let mediaText
        //                 // todo: update for other media types when ready
        //                 if (bead.Image) {
        //                     mediaUrl = bead.Image.url
        //                     mediaText = bead.Image.text
        //                 }
        //                 return {
        //                     id: bead.id,
        //                     text: bead.text || null,
        //                     // todo: handle searchable text
        //                     searchableText: '',
        //                     mediaText,
        //                     mediaUrl,
        //                     mediaTypes: bead.mediaTypes,
        //                     color: bead.color,
        //                 }
        //             })
        //             beads.forEach((bead) => {
        //                 if (bead.mediaTypes === 'image') {
        //                     const { file } = bead.Image
        //                     if (file) formData.append('image', file, bead.id)
        //                 }
        //                 if (bead.mediaTypes === 'audio') {
        //                     const { type, file, blob } = bead.Audio
        //                     // todo: compress file and blob into file? (check how audio posts work first...)
        //                     if (type === 'file') formData.append('audio', file, bead.id)
        //                     else formData.append('audio-blob', blob, bead.id)
        //                 }
        //             })
        //         }
        //         // // add beads to fileData
        //         // postData.beads.forEach((bead, index) => {
        //         //     // add searchable text
        //         //     if (bead.type === 'url') {
        //         //         const u = bead.Urls[0]
        //         //         const urlFields = [] as any
        //         //         if (u.url) urlFields.push(u.url)
        //         //         if (u.title) urlFields.push(u.title)
        //         //         if (u.description) urlFields.push(u.description)
        //         //         if (u.domain) urlFields.push(u.domain)
        //         //         bead.searchableText = urlFields.length ? urlFields.join(' ') : null
        //         //     } else {
        //         //         bead.searchableText =
        //         //             bead.type === 'text' ? getDraftPlainText(bead.text) : null
        //         //     }
        //         //     // add files
        //         //     if (bead.type === 'audio') {
        //         //         // todo: use naming technique instead of type?
        //         //         const { type, file, blob } = bead.Audios[0]
        //         //         if (type === 'file') formData.append('audio-file', file, index)
        //         //         else formData.append('audio-blob', blob, index)
        //         //     } else if (bead.type === 'image') {
        //         //         const { file } = bead.Images[0]
        //         //         if (file) formData.append('image', file, index)
        //         //     }
        //         // })
        //     }
        //     // add other contextual data
        //     if (sourceId) {
        //         postData.sourceType = sourceType
        //         postData.sourceId = sourceId
        //         postData.linkDescription = linkDescription || null
        //     }
        //     if (governance) {
        //         postData.governance = true
        //         postData.pollAction = pollAction
        //         postData.pollThreshold = pollThreshold
        //     }
        //     postData.searchableText = findSearchableText(postData)
        //     formData.append('post-data', JSON.stringify(postData))
        //     const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        //     // todo: update
        //     // set up file uploads if required
        //     // let fileData
        //     // let uploadType
        //     // if (mediaTypes.includes('image')) {
        //     //     uploadType = 'image-file'
        //     //     fileData = new FormData()
        //     //     images.forEach((image, index) => {
        //     //         if (image.file) fileData.append('file', image.file, index)
        //     //     })
        //     //     fileData.append('postData', JSON.stringify(postData))
        //     // }
        //     // if (mediaTypes.includes('audio')) {
        //     //     // const isBlob = audioFile && !audioFile.name
        //     //     // uploadType = isBlob ? 'audio-blob' : 'audio-file'
        //     //     // fileData = new FormData()
        //     //     // fileData.append('file', isBlob ? audioBlob : audioFile)
        //     //     // fileData.append('postData', JSON.stringify(postData))
        //     // }
        //     // if (mediaTypes.includes('card')) {
        //     //     postData.cardFrontSearchableText = postData.cardFrontText
        //     //         ? getDraftPlainText(postData.cardFrontText)
        //     //         : null
        //     //     postData.cardBackSearchableText = postData.cardBackText
        //     //         ? getDraftPlainText(postData.cardBackText)
        //     //         : null
        //     //     uploadType = 'image-file'
        //     //     fileData = new FormData()
        //     //     if (cardFrontImage) fileData.append('file', cardFrontImage, 'front')
        //     //     if (cardBackImage) fileData.append('file', cardBackImage, 'back')
        //     //     fileData.append('postData', JSON.stringify(postData))
        //     // }
        //     // if (mediaTypes.includes('glass-bead-game')) {
        //     //     uploadType = 'glass-bead-game'
        //     //     fileData = new FormData()
        //     //     // upload topic image if required
        //     //     if (topicImageFile) fileData.append('topicImage', topicImageFile)
        //     //     // add beads to fileData
        //     //     postData.beads.forEach((bead, index) => {
        //     //         // add searchable text
        //     //         if (bead.type === 'url') {
        //     //             const u = bead.Urls[0]
        //     //             const urlFields = [] as any
        //     //             if (u.url) urlFields.push(u.url)
        //     //             if (u.title) urlFields.push(u.title)
        //     //             if (u.description) urlFields.push(u.description)
        //     //             if (u.domain) urlFields.push(u.domain)
        //     //             bead.searchableText = urlFields.length ? urlFields.join(' ') : null
        //     //         } else {
        //     //             bead.searchableText =
        //     //                 bead.type === 'text' ? getDraftPlainText(bead.text) : null
        //     //         }
        //     //         // add files
        //     //         if (bead.type === 'audio') {
        //     //             const { type, file, blob } = bead.Audios[0]
        //     //             if (type === 'file') fileData.append('audioFile', file, index)
        //     //             else fileData.append('audioBlob', blob, index)
        //     //         } else if (bead.type === 'image') {
        //     //             const { file } = bead.Images[0]
        //     //             if (file) fileData.append('imageFile', file, index)
        //     //         }
        //     //     })
        //     //     fileData.append('postData', JSON.stringify(postData))
        //     // }
        //     axios
        //         .post(`${config.apiURL}/create-post`, formData, options)
        //         .then((res) => {
        //             console.log('create-post res: ', res.data)
        //             const allPostSpaceIds = [
        //                 ...spaces.map((space) => space.id),
        //                 ...res.data.indirectSpaces.map((s) => s.spaceId),
        //             ]
        //             const addPostToSpaceFeed =
        //                 page === 's' &&
        //                 subPage === 'posts' &&
        //                 allPostSpaceIds.includes(spaceData.id)
        //             const addPostToUserFeed =
        //                 page === 'u' && subPage === 'posts' && handle === accountData.handle
        //             if (addPostToSpaceFeed || addPostToUserFeed || governance) {
        //                 const newPost = {
        //                     ...defaultPostData,
        //                     ...res.data.post,
        //                     Creator: accountData,
        //                     DirectSpaces: spaces.map((s) => {
        //                         return { ...s, state: 'active' }
        //                     }),
        //                     Urls: urls,
        //                     Event: res.data.event
        //                         ? {
        //                               ...res.data.event,
        //                               Going: [],
        //                               Interested: [],
        //                           }
        //                         : null,
        //                 }
        //                 if (sourceId) newPost.accountLink = true
        //                 // if (mediaTypes.includes('audio'))
        //                 //     newPost.Audios = [{ url: res.data.audio.url }]
        //                 // if (mediaTypes.includes('image')) newPost.Images = images
        //                 // if (mediaTypes.includes('poll'))
        //                 //     newPost.Poll = {
        //                 //         ...res.data.pollData.poll,
        //                 //         PollAnswers: res.data.pollData.answers.map((a) => {
        //                 //             return { ...a, Reactions: [] }
        //                 //         }),
        //                 //     }
        //                 // if (postData.type === 'glass-bead-game') {
        //                 //     newPost.Beads = postData.beads.map((bead, i) => {
        //                 //         return {
        //                 //             ...bead,
        //                 //             id: res.data.gbg.beads[i].newBead.id,
        //                 //             Reactions: [],
        //                 //             Link: { index: i + 1 },
        //                 //         }
        //                 //     })
        //                 //     newPost.GlassBeadGame = { ...res.data.gbg.game }
        //                 //     newPost.Players =
        //                 //         GBGSettings.players.map((p) => {
        //                 //             return {
        //                 //                 ...p,
        //                 //                 UserPost: {
        //                 //                     state: p.id === accountData.id ? 'accepted' : 'pending',
        //                 //                 },
        //                 //             }
        //                 //         }) || []
        //                 // }
        //                 // if (postData.type === 'card')
        //                 //     newPost.CardSides = [res.data.card.front, res.data.card.back]
        //                 // add new post to feed
        //                 if (addPostToSpaceFeed) setSpacePosts([newPost, ...spacePosts])
        //                 if (addPostToUserFeed) setUserPosts([newPost, ...userPosts])
        //                 if (governance) setGovernancePolls([...governancePolls, newPost])
        //             }
        //             setLoading(false)
        //             setSaved(true)
        //             setTimeout(() => closeModal(), 1000)
        //         })
        //         .catch((error) => {
        //             if (!error.response) console.log(error)
        //             else {
        //                 const { message } = error.response.data
        //                 switch (message) {
        //                     case 'File size too large':
        //                         setAudioSizeError(true)
        //                         break
        //                     default:
        //                         break
        //                 }
        //             }
        //             setLoading(false)
        //         })
        // }
    }

    // useEffect(() => {
    //     if (game) setPostType('glass-bead-game')
    //     if (governance) setPostType('poll')
    // }, [])

    // remove errors and initialise date picker if post type is event
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

    // todo: pass function into input so hook not necissary (requires use of refs..., maybe update gbg settings instead?)
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
        if (urls.length <= maxUrls) {
            // requestIndex & setTimeout used to block requests until user has finished typing
            requestIndex.current += 1
            const index = requestIndex.current
            setTimeout(() => {
                if (requestIndex.current === index) {
                    rawUrls.forEach(async (url) => {
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
                                setUrls((us) => {
                                    const newUrls = [...us.filter((u) => u.url !== url)]
                                    newUrls.push(data)
                                    return newUrls
                                })
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
                            state: 'done',
                            Reactions: [],
                            Creator: space.Creator,
                        }
                    })
                    setPollAnswers([...newPollAnswers, ...pollAnswers])
                    setPollAnswersLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setPollAnswers(pollAnswers.filter((a) => !a.state))
        }
    }, [pollAction])

    return (
        <Modal className={styles.wrapper} close={closeModal} centerX confirmClose={!saved}>
            {saved ? (
                <SuccessMessage text='Post created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <Row centerY style={{ marginBottom: 20 }}>
                        <h1 style={{ margin: 0 }}>{findModalHeader()}</h1>
                        {mediaTypes.includes('glass-bead-game') && (
                            <button
                                type='button'
                                className={styles.helpButton}
                                onClick={() => setGBGHelpModalOpen(true)}
                            >
                                <HelpIcon />
                            </button>
                        )}
                    </Row>
                    {sourceId && (
                        <Column centerX style={{ width: '100%', maxWidth: 350, marginBottom: 20 }}>
                            <p style={{ marginBottom: 10 }}>linked from post ID: {sourceId}</p>
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
                            {!governance && (
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
                            {showTitle && !mediaTypes.includes('glass-bead-game') && (
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
                            {mediaTypes.includes('glass-bead-game') && (
                                <Row centerY spaceBetween className={styles.topic}>
                                    <Column centerX centerY className={styles.imageWrapper}>
                                        {topicImageURL && <img src={topicImageURL} alt='' />}
                                        {/* <UploadIcon /> */}
                                        <ImageIcon />
                                        <label htmlFor='topic-image-file-input'>
                                            <input
                                                type='file'
                                                id='topic-image-file-input'
                                                accept='.png, .jpg, .jpeg, .gif'
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
                                            value={topic}
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
                                    setRawUrls(textUrls.slice(0, maxUrls))
                                    setErrors([])
                                }}
                            />
                            {urls.map((u) => (
                                <UrlPreview
                                    key={u.url}
                                    type='post'
                                    urlData={u}
                                    loading={u.loading}
                                    remove={removeUrlMetaData}
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
                                                        right: 0,
                                                        top: -5,
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
                                            style={{ marginRight: 20 }}
                                        />
                                        {governance && (
                                            <DropDown
                                                title='Action'
                                                options={['None', 'Create spaces']} // 'Assign Moderators'
                                                selectedOption={pollAction}
                                                setSelectedOption={(option) =>
                                                    setPollAction(option)
                                                }
                                                style={{ marginRight: 20 }}
                                            />
                                        )}
                                        {governance && pollAction === 'Create spaces' && (
                                            <Row centerY style={{ marginRight: 20 }}>
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
                                            style={{ marginRight: 20 }}
                                        />
                                    </Row>
                                    <Column>
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
                                    <span>{cardFlipped ? 'Back' : 'Front'}</span>
                                    <button
                                        type='button'
                                        title='Click to rotate'
                                        onClick={rotateCard}
                                    >
                                        <RepostIcon />
                                    </button>
                                    <Column
                                        centerX
                                        className={`${
                                            styles.cardWrapper
                                        } ${cardContainerExpanded()}`}
                                    >
                                        <Column
                                            centerX
                                            className={`${styles.card} ${
                                                cardRotating && styles.rotating
                                            }`}
                                        >
                                            {!cardFlipped ? (
                                                <Column centerX className={styles.cardContent}>
                                                    {cardFrontImage && (
                                                        <img
                                                            src={URL.createObjectURL(
                                                                cardFrontImage
                                                            )}
                                                            alt='background'
                                                            style={{
                                                                opacity: cardFrontWatermark
                                                                    ? 0.3
                                                                    : 1,
                                                            }}
                                                        />
                                                    )}
                                                    <DraftTextEditor
                                                        key='card-front'
                                                        className={styles.textEditor}
                                                        type='card'
                                                        text={cardFrontText}
                                                        maxChars={maxChars}
                                                        onChange={(value, textMentions) => {
                                                            setCardFrontText(value)
                                                            setCardFrontMentions(textMentions)
                                                            setErrors([])
                                                        }}
                                                    />
                                                </Column>
                                            ) : (
                                                <Column centerX className={styles.cardContent}>
                                                    {cardBackImage && (
                                                        <img
                                                            src={URL.createObjectURL(cardBackImage)}
                                                            alt='background'
                                                            style={{
                                                                opacity: cardBackWatermark
                                                                    ? 0.3
                                                                    : 1,
                                                            }}
                                                        />
                                                    )}
                                                    <DraftTextEditor
                                                        key='card-back'
                                                        className={styles.textEditor}
                                                        type='card'
                                                        text={cardBackText}
                                                        maxChars={maxChars}
                                                        onChange={(value, textMentions) => {
                                                            setCardBackText(value)
                                                            setCardBackMentions(textMentions)
                                                            setErrors([])
                                                        }}
                                                    />
                                                </Column>
                                            )}
                                        </Column>
                                    </Column>
                                    {/* {cardImageSizeError && (
                                        <Row className={styles.errors}>
                                            <p>Max image size: {imageMBLimit}MB</p>
                                        </Row>
                                    )} */}
                                    <Row>
                                        {((cardFlipped && !cardBackImage) ||
                                            (!cardFlipped && !cardFrontImage)) && (
                                            <Row className={styles.fileUploadInput}>
                                                <label htmlFor='card-image-file-input'>
                                                    Add image
                                                    <input
                                                        type='file'
                                                        id='card-image-file-input'
                                                        accept='.png, .jpg, .jpeg, .gif'
                                                        onChange={addCardImage}
                                                        hidden
                                                    />
                                                </label>
                                            </Row>
                                        )}
                                        {((cardFlipped && cardBackImage) ||
                                            (!cardFlipped && cardFrontImage)) && (
                                            <Row>
                                                <Button
                                                    text='Remove image'
                                                    color='red'
                                                    onClick={removeCardImage}
                                                />
                                                <Toggle
                                                    leftText='Watermark'
                                                    positionLeft={
                                                        cardFlipped
                                                            ? !cardBackWatermark
                                                            : !cardFrontWatermark
                                                    }
                                                    rightColor='blue'
                                                    onClick={() => {
                                                        if (cardFlipped)
                                                            setCardBackWatermark(!cardBackWatermark)
                                                        else
                                                            setCardFrontWatermark(
                                                                !cardFrontWatermark
                                                            )
                                                    }}
                                                    style={{ marginLeft: 10 }}
                                                    onOffText
                                                />
                                            </Row>
                                        )}
                                    </Row>
                                    {/* <Row style={{ marginTop: 20 }}>
                                        {['text'].map((type) => (
                                            <ContentButton
                                                type={type}
                                                postType={cardFrontType}
                                                setPostType={setCardFrontType}
                                            />
                                        ))}
                                    </Row> */}
                                </Column>
                            )}
                            {mediaTypes.includes('glass-bead-game') && (
                                <Column className={styles.gbg}>
                                    {!synchronous && (
                                        <Column>
                                            {multiplayer && renderGBGInfoRow()}
                                            {/* {(!multiplayer || postType === 'gbg-from-post') &&
                                                renderBeads()} */}
                                        </Column>
                                    )}
                                    {!synchronous && !multiplayer && renderBeads()}
                                    {/* {(postType === 'gbg-from-post' ||
                                        (!synchronous && !multiplayer)) &&
                                        renderBeads()} */}
                                    <Button
                                        text='Game settings'
                                        color='aqua'
                                        icon={<SettingsIcon />}
                                        onClick={() => setGBGSettingsModalOpen(true)}
                                    />
                                </Column>
                            )}
                        </Column>
                    </Column>
                    {!!contentTypes.length && (
                        <Row style={{ marginBottom: 20 }}>
                            {contentTypes.map((type) => (
                                <MediaButton
                                    key={type}
                                    type={type}
                                    selected={mediaTypes.includes(type)}
                                    onClick={() => mediaButtonClick(type)}
                                />
                            ))}
                        </Row>
                    )}
                    <Column centerX className={styles.errors}>
                        {errors[0]}
                        {/* {noTextError && <p>No content added</p>}
                        {maxCharsErrors && <p>Text must be less than {maxChars} characters</p>}
                        {noImagesError && <p>No images added</p>}
                        {imageSizeError && <p>Max file size: {imageMBLimit} MBs</p>}
                        {totalUploadSizeError && (
                            <p>
                                Total upload size ({findTotalUploadSize()} MBs) must be less than{' '}
                                {totalMBUploadLimit} MBs
                            </p>
                        )}
                        {audioSizeError && <p>Max file size: {audioMBLimit} MBs</p>}
                        {noAudioError && <p>No audio added</p>}
                        {eventTextError && <p>Title or text required for events</p>}
                        {noEventTimesError && <p>Start time required for events</p>}
                        {pollTextError && <p>Title or text required for polls</p>}
                        {pollAnswersError && <p>At least 2 answers required for locked polls</p>}
                        {topicError && <p>Topic required</p>}
                        {noBeadsError && <p>At least 1 bead required for single player games</p>}
                        {cardFrontError && <p>No content added to front of card</p>}
                        {cardBackError && <p>No content added to back of card</p>} */}
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
            {GBGSettingsModalOpen && (
                <GBGSettingsModal
                    settings={GBGSettings}
                    setSettings={(newSettings) => {
                        setGBGSettings(newSettings)
                        setErrors([])
                    }}
                    close={() => setGBGSettingsModalOpen(false)}
                />
            )}
            {nextBeadModalOpen && (
                <NextBeadModal
                    location='new-gbg'
                    settings={GBGSettings}
                    players={GBGSettings.players}
                    addBead={(bead) => {
                        setBeads([...beads, bead])
                        setErrors([])
                    }}
                    close={() => setNextBeadModalOpen(false)}
                />
            )}
            {GBGHelpModalOpen && <GBGHelpModal close={() => setGBGHelpModalOpen(false)} />}
        </Modal>
    )
}

export default CreatePostModal
