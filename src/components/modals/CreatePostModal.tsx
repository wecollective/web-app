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
import NextBeadModal from '@components/modals/NextBeadModal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import {
    audioMBLimit,
    capitalise,
    defaultGBGSettings,
    defaultPostData,
    findDraftLength,
    findEventDuration,
    findEventTimes,
    formatTimeMMSS,
    getDraftPlainText,
    imageMBLimit,
    megaByte,
    postTypeIcons,
    totalMBUploadLimit,
} from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/CreatePostModal.module.scss'
import {
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DNAIcon,
    HelpIcon,
    ImageIcon,
    PlusIcon,
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

function ContentButton(props: {
    type: string
    postType: string
    setPostType: (type: string) => void
}): JSX.Element {
    const { type, postType, setPostType } = props
    return (
        <button
            className={`${styles.contentButton} ${postType === type ? styles.selected : ''}`}
            type='button'
            title={capitalise(type)}
            onClick={() => setPostType(postType === type ? 'text' : type)}
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
    const [postType, setPostType] = useState('text')
    const [spaces, setSpaces] = useState<any[]>([spaceData.id ? spaceData : defaultSelectedSpace])
    const [showTitle, setShowTitle] = useState(true)
    const [title, setTitle] = useState('')
    const [text, setText] = useState('')
    const [noTextError, setNoTextError] = useState(false)
    const [maxCharsErrors, setMaxCharsErrors] = useState(false)
    const [mentions, setMentions] = useState<any[]>([])
    const [urls, setUrls] = useState<any[]>([])
    const [urlsWithMetaData, setUrlsWithMetaData] = useState<any[]>([])
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [noEventTimesError, setNoEventTimesError] = useState(false)
    const [eventTextError, setEventTextError] = useState(false)
    const [saved, setSaved] = useState(false)
    const [spacesModalOpen, setSpacesModalOpen] = useState(false)
    const maxChars = 5000
    const cookies = new Cookies()
    const maxUrls = 5
    const urlRequestIndex = useRef(0)
    const location = useLocation()
    const path = location.pathname.split('/')
    const page = path[1]
    const handle = path[2]
    const subPage = path[3]
    let contentTypes = ['image', 'audio', 'event', 'poll']
    if (game) contentTypes = ['glass-bead-game', 'card']
    if (governance) contentTypes = []

    function closeModal() {
        setCreatePostModalOpen(false)
        setCreatePostModalSettings({})
    }

    function findModalHeader() {
        if (governance) return 'New governance poll'
        if (postType === 'text') return 'New post'
        if (postType === 'image') return 'New image post'
        if (postType === 'audio') return 'New audio post'
        if (postType === 'event') return 'New event'
        if (postType === 'poll') return 'New poll'
        if (postType === 'card') return 'New card'
        if (postType === 'glass-bead-game') return 'New Glass Bead Game'
        return ''
    }

    function scrapeUrlMetaData(url) {
        setUrlsWithMetaData((us) => [...us, { url, loading: true }])
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/scrape-url?url=${url}`, options)
            .then((res) => {
                setUrlsWithMetaData((us) => {
                    const newUrlsMetaData = [...us.filter((u) => u.url !== url)]
                    newUrlsMetaData.push({ url, loading: false, ...res.data })
                    return newUrlsMetaData
                })
            })
            .catch((error) => console.log(error))
    }

    function removeUrlMetaData(url) {
        setUrlsWithMetaData((us) => [...us.filter((u) => u.url !== url)])
    }

    // images
    const [images, setImages] = useState<any[]>([])
    const [imageURL, setImageURL] = useState('')
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const [imageSizeError, setImageSizeError] = useState(false)
    const [totalImageSizeError, setTotalImageSizeError] = useState(false)
    const [noImagesError, setNoImagesError] = useState(false)

    function findImageSize() {
        if (images.length === 1) return 'large'
        if (images.length === 2) return 'medium'
        return 'small'
    }

    function openImageModal(imageId) {
        setSelectedImage(images.find((image) => image.id === imageId))
        setImageModalOpen(true)
    }

    function addImageFiles() {
        setImageSizeError(false)
        setNoImagesError(false)
        const input = document.getElementById('post-images-file-input') as HTMLInputElement
        if (input && input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i += 1) {
                if (input.files[i].size > imageMBLimit * 1024 * 1024) setImageSizeError(true)
                else {
                    setImages((imgs) => [
                        ...imgs,
                        {
                            id: uuidv4(),
                            index: imgs.length,
                            file: input && input.files && input.files[i],
                        },
                    ])
                }
            }
        }
    }

    function addImageURL() {
        setImages(() => [...images, { id: uuidv4(), index: images.length, url: imageURL }])
        setImageURL('')
        setImageSizeError(false)
        setNoImagesError(false)
    }

    function removeImage(index) {
        setTotalImageSizeError(false)
        setImages([
            ...images
                .filter((image, i) => i !== index)
                .map((img, i) => {
                    return { ...img, index: i }
                }),
        ])
    }

    function moveImage(index, increment) {
        const newImageArray = [...images]
        const image = newImageArray[index]
        newImageArray.splice(index, 1)
        newImageArray.splice(index + increment, 0, image)
        setImages(
            newImageArray.map((img, i) => {
                return { ...img, index: i }
            })
        )
    }

    function updateCaption(index, value) {
        const newImageArray = [...images]
        newImageArray[index].caption = value
        setImages(newImageArray)
    }

    function findTotalImageMBs() {
        const totalBytes = images
            .filter((i) => i.file)
            .map((i) => i.file.size)
            .reduce((a, b) => a + b, 0)
        return +(totalBytes / megaByte).toFixed(2)
    }

    // audio
    const [audioFile, setAudioFile] = useState<File | undefined>()
    const [audioBlob, setAudioBlob] = useState<any>()
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [noAudioError, setNoAudioError] = useState(false)
    const audioRecorder = useRef<any>(null)
    const recordingInterval = useRef<any>(null)

    function resetAudioState() {
        setAudioFile(undefined)
        setNoAudioError(false)
        setRecordingTime(0)
        const input = d3.select('#audio-file-input').node()
        if (input) input.value = ''
    }

    function selectAudioFile() {
        const input = d3.select('#audio-file-input').node()
        if (input && input.files && input.files[0]) {
            if (input.files[0].size > audioMBLimit * 1024 * 1024) {
                setAudioSizeError(true)
                resetAudioState()
            } else {
                setAudioSizeError(false)
                setNoAudioError(false)
                setAudioFile(input.files[0])
            }
        }
    }

    function toggleAudioRecording() {
        if (recording) {
            audioRecorder.current.stopRecording(() => {
                clearInterval(recordingInterval.current)
                const blob = audioRecorder.current.getBlob()
                setAudioBlob(blob)
                setAudioFile(new File([blob], '', { type: 'audio/wav' }))
            })
            setRecording(false)
        } else {
            resetAudioState()
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
    const [pollAnswersLocked, setPollAnswersLocked] = useState(false)
    const [newPollAnswer, setNewPollAnswer] = useState('')
    const [pollAnswers, setPollAnswers] = useState<any[]>([])
    const [pollAnswersLoading, setPollAnswersLoading] = useState(false)
    const [pollTextError, setPollTextError] = useState(false)
    const [pollAnswersError, setPollAnswersError] = useState(false)
    const [pollAction, setPollAction] = useState('None')
    const [pollThreshold, setPollThreshold] = useState(5)
    const pollColorScale = d3
        .scaleSequential()
        .domain([0, pollAnswers.length])
        .interpolator(d3.interpolateViridis)

    function addPollAnswer() {
        setPollAnswers([
            ...pollAnswers,
            {
                id: uuidv4(),
                text: newPollAnswer,
                Reactions: [],
                Creator: accountData,
            },
        ])
        setNewPollAnswer('')
        setPollAnswersError(false)
    }

    function removePollAnswer(id) {
        setPollAnswers(pollAnswers.filter((a) => a.id !== id))
    }

    // card
    const [cardRotating, setCardRotating] = useState(false)
    const [cardFlipped, setCardFlipped] = useState(false)
    const [cardFrontType, setCardFrontType] = useState('text')
    const [cardFrontText, setCardFrontText] = useState('')
    const [cardFrontMentions, setCardFrontMentions] = useState<any[]>([])
    const [cardFrontImage, setCardFrontImage] = useState<File>()
    const [cardFrontWatermark, setCardFrontWatermark] = useState(false)
    const [cardFrontError, setCardFrontError] = useState(false)
    const [cardBackType, setCardBackType] = useState('text')
    const [cardBackText, setCardBackText] = useState('')
    const [cardBackMentions, setCardBackMentions] = useState<any[]>([])
    const [cardBackImage, setCardBackImage] = useState<File>()
    const [cardBackWatermark, setCardBackWatermark] = useState(false)
    const [cardBackError, setCardBackError] = useState(false)
    const [cardImageSizeError, setCardImageSizeError] = useState(false)

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

    function addCardImage() {
        const input = document.getElementById('card-image-file-input') as HTMLInputElement
        if (input && input.files && input.files.length) {
            if (input.files[0].size > imageMBLimit * 1024 * 1024) setCardImageSizeError(true)
            else if (cardFlipped) {
                setCardBackImage(input.files[0])
                setCardBackError(false)
                setCardImageSizeError(false)
            } else {
                setCardFrontImage(input.files[0])
                setCardFrontError(false)
                setCardImageSizeError(false)
            }
        }
    }

    function removeCardImage() {
        if (cardFlipped) setCardBackImage(undefined)
        else setCardFrontImage(undefined)
    }

    // gbg
    const [topic, setTopic] = useState('')
    const [topicOptions, setTopicOptions] = useState<any[]>([])
    const [topicImageFile, setTopicImageFile] = useState<File | undefined>()
    const [topicImageURL, setTopicImageURL] = useState('')
    const [GBGSettingsModalOpen, setGBGSettingsModalOpen] = useState(false)
    const [GBGHelpModalOpen, setGBGHelpModalOpen] = useState(false)
    const [GBGSettings, setGBGSettings] = useState<any>(defaultGBGSettings)
    const { synchronous, multiplayer, players, totalMoves, movesPerPlayer } = GBGSettings
    const [beads, setBeads] = useState<any[]>([])
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)
    const [topicError, setTopicError] = useState(false)
    const [noBeadsError, setNoBeadsError] = useState(false)

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
        setTopicError(false)
    }

    function selectTopic(option) {
        setTopic(option.name)
        setTopicImageURL(option.imagePath)
        setTopicOptions([])
        setTopicError(false)
    }

    function renderImages() {
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
                                onClick={() => removeImage(index)}
                                style={{ position: 'absolute', right: 0 }}
                            />
                            <button
                                className={styles.imageButton}
                                type='button'
                                onClick={() => openImageModal(image.id)}
                            >
                                <img src={image.url || URL.createObjectURL(image.file)} alt='' />
                            </button>
                            <Row centerY style={{ width: '100%' }}>
                                <Input
                                    type='text'
                                    placeholder='add caption...'
                                    value={image.caption}
                                    onChange={(v) => updateCaption(index, v)}
                                />
                            </Row>
                            <Row centerX className={styles.itemFooter}>
                                {index !== 0 && (
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

    function renderEventTimes() {
        const showEventDates = postType === 'event' && startTime
        const showGBGDates =
            postType === 'glass-bead-game' && GBGSettings.synchronous && GBGSettings.startTime
        const start = postType === 'event' ? startTime : GBGSettings.startTime
        const end = postType === 'event' ? endTime : GBGSettings.endTime
        if (!showEventDates && !showGBGDates) return null
        return (
            <Row centerY className={styles.dates}>
                <CalendarIcon />
                <Row>
                    <p>{findEventTimes(start, end)}</p>
                    <p>{findEventDuration(start, end)}</p>
                </Row>
            </Row>
        )
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
        let showNextBeadButton = !multiplayer && (!totalMoves || beads.length < totalMoves)
        if (postType === 'gbg-from-post' && synchronous) showNextBeadButton = false
        return (
            <Row centerX>
                <Scrollbars className={styles.beads}>
                    <Row>
                        {beads.map((bead, i) => (
                            <Row key={bead.id}>
                                <BeadCard
                                    bead={bead}
                                    postType={bead.type}
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

    function postValid() {
        let valid = true
        const totalChars = findDraftLength(text)
        if (postType === 'text') {
            if (totalChars < 1 && !title && !urlsWithMetaData.length) {
                setNoTextError(true)
                valid = false
            }
            if (totalChars > maxChars) {
                setMaxCharsErrors(true)
                valid = false
            }
        }
        if (postType === 'image') {
            if (!images.length) {
                setNoImagesError(true)
                valid = false
            }
            const totalImageSize = findTotalImageMBs()
            if (totalImageSize > totalMBUploadLimit) {
                setTotalImageSizeError(true)
                valid = false
            }
        }
        if (postType === 'audio') {
            if (!audioFile) {
                setAudioSizeError(false)
                setNoAudioError(true)
                valid = false
            }
        }
        if (postType === 'event') {
            if (totalChars < 1 && !title) {
                setEventTextError(true)
                valid = false
            }
            if (!startTime) {
                setNoEventTimesError(true)
                valid = false
            }
        }
        if (postType === 'poll') {
            if (totalChars < 1 && !title) {
                setPollTextError(true)
                valid = false
            }
            if (pollAnswersLocked && pollAnswers.length < 2) {
                setPollAnswersError(true)
                valid = false
            }
        }
        if (postType === 'glass-bead-game') {
            if (!topic) {
                setTopicError(true)
                valid = false
            }
            if (!synchronous && !multiplayer && !beads.length) {
                setNoBeadsError(true)
                valid = false
            }
        }
        if (postType === 'card') {
            const frontTotalChars = findDraftLength(cardFrontText)
            const backTotalChars = findDraftLength(cardBackText)
            if (!cardFrontImage && frontTotalChars === 0) {
                setCardFrontError(true)
                valid = false
            } else if (!cardBackImage && backTotalChars === 0) {
                setCardBackError(true)
                valid = false
            }
        }
        return valid
    }

    function findTopicGroup() {
        if (postType === 'glass-bead-game') {
            // todo: update when objects merged into array && check for image match
            const arcMatch = GlassBeadGameTopics.archetopics.find((t) => t.name === topic)
            if (arcMatch) return 'archetopics'
            const limMatch = GlassBeadGameTopics.liminal.find((t) => t.name === topic)
            if (limMatch) return 'liminal'
        }
        return null
    }

    function postButtonDisabled() {
        if (urlsWithMetaData.find((u) => u.loading)) return true
        return false
    }

    function findSearchableText(p) {
        const fields = [] as any
        if (p.title) fields.push(p.title)
        if (p.text) fields.push(getDraftPlainText(p.text))
        const urlData = p.urls.map((u) => {
            const urlFields = [] as any
            if (u.url) urlFields.push(u.url)
            if (u.title) urlFields.push(u.title)
            if (u.description) urlFields.push(u.description)
            if (u.domain) urlFields.push(u.domain)
            return urlFields.length ? urlFields.join(' ') : null
        })
        if (urlData.length) fields.push(...urlData)
        return fields.length ? fields.join(' ') : null
    }

    function createPost() {
        if (postValid()) {
            setLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const postData = {
                creatorName: accountData.name,
                creatorHandle: accountData.handle,
                type: postType === 'text' && urlsWithMetaData.length > 0 ? 'url' : postType,
                spaceIds:
                    // remove root space if other spaces present
                    spaces.length > 1
                        ? spaces.filter((s) => s.id !== 1).map((s) => s.id)
                        : spaces.map((s) => s.id),
                title: postType === 'glass-bead-game' ? topic : title,
                text: findDraftLength(text) ? text : null,
                mentions: mentions.map((m) => m.link),
                urls: urlsWithMetaData,
                images: postType === 'image' ? images : [],
                startTime,
                endTime,
                pollType: pollType.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                pollAnswersLocked,
                pollAnswers,
                topicGroup: findTopicGroup(),
                topicImageUrl: topicImageFile ? null : topicImageURL,
                gbgSettings: GBGSettings,
                beads: !synchronous && !multiplayer ? beads : [],
                cardFrontText: findDraftLength(cardFrontText) ? cardFrontText : null,
                cardBackText: findDraftLength(cardBackText) ? cardBackText : null,
                cardFrontWatermark,
                cardBackWatermark,
            } as any
            postData.searchableText = findSearchableText(postData)
            if (sourceId) {
                postData.sourceType = sourceType
                postData.sourceId = sourceId
                postData.linkDescription = linkDescription || null
            }
            if (governance) {
                postData.governance = true
                postData.pollAction = pollAction
                postData.pollThreshold = pollThreshold
            }
            // set up file uploads if required
            let fileData
            let uploadType
            if (postType === 'image') {
                uploadType = 'image-file'
                fileData = new FormData()
                images.forEach((image, index) => {
                    if (image.file) fileData.append('file', image.file, index)
                })
                fileData.append('postData', JSON.stringify(postData))
            }
            if (postType === 'audio') {
                const isBlob = audioFile && !audioFile.name
                uploadType = isBlob ? 'audio-blob' : 'audio-file'
                fileData = new FormData()
                fileData.append('file', isBlob ? audioBlob : audioFile)
                fileData.append('postData', JSON.stringify(postData))
            }
            if (postType === 'card') {
                postData.cardFrontSearchableText = postData.cardFrontText
                    ? getDraftPlainText(postData.cardFrontText)
                    : null
                postData.cardBackSearchableText = postData.cardBackText
                    ? getDraftPlainText(postData.cardBackText)
                    : null
                uploadType = 'image-file'
                fileData = new FormData()
                if (cardFrontImage) fileData.append('file', cardFrontImage, 'front')
                if (cardBackImage) fileData.append('file', cardBackImage, 'back')
                fileData.append('postData', JSON.stringify(postData))
            }
            if (postData.type === 'glass-bead-game') {
                uploadType = 'glass-bead-game'
                fileData = new FormData()
                // upload topic image if required
                if (topicImageFile) fileData.append('topicImage', topicImageFile)
                // add beads to fileData
                postData.beads.forEach((bead, index) => {
                    // add searchable text
                    if (bead.type === 'url') {
                        const u = bead.Urls[0]
                        const urlFields = [] as any
                        if (u.url) urlFields.push(u.url)
                        if (u.title) urlFields.push(u.title)
                        if (u.description) urlFields.push(u.description)
                        if (u.domain) urlFields.push(u.domain)
                        bead.searchableText = urlFields.length ? urlFields.join(' ') : null
                    } else {
                        bead.searchableText =
                            bead.type === 'text' ? getDraftPlainText(bead.text) : null
                    }
                    // add files
                    if (bead.type === 'audio') {
                        const { type, file, blob } = bead.Audios[0]
                        if (type === 'file') fileData.append('audioFile', file, index)
                        else fileData.append('audioBlob', blob, index)
                    } else if (bead.type === 'image') {
                        const { file } = bead.Images[0]
                        if (file) fileData.append('imageFile', file, index)
                    }
                })
                fileData.append('postData', JSON.stringify(postData))
            }
            axios
                .post(
                    `${config.apiURL}/create-post?uploadType=${uploadType}`,
                    fileData || postData,
                    options
                )
                .then((res) => {
                    const allPostSpaceIds = [
                        ...spaces.map((space) => space.id),
                        ...res.data.indirectSpaces.map((s) => s.spaceId),
                    ]
                    const addPostToSpaceFeed =
                        page === 's' &&
                        subPage === 'posts' &&
                        allPostSpaceIds.includes(spaceData.id)
                    const addPostToUserFeed =
                        page === 'u' && subPage === 'posts' && handle === accountData.handle
                    if (addPostToSpaceFeed || addPostToUserFeed || governance) {
                        const newPost = {
                            ...defaultPostData,
                            ...res.data.post,
                            Creator: accountData,
                            DirectSpaces: spaces.map((s) => {
                                return { ...s, state: 'active' }
                            }),
                            Urls: urlsWithMetaData,
                            Event: res.data.event
                                ? {
                                      ...res.data.event,
                                      Going: [],
                                      Interested: [],
                                  }
                                : null,
                        }
                        if (sourceId) newPost.accountLink = true
                        if (postType === 'audio') newPost.Audios = [{ url: res.data.audio.url }]
                        if (postType === 'image') newPost.Images = images
                        if (postType === 'poll')
                            newPost.Poll = {
                                ...res.data.pollData.poll,
                                PollAnswers: res.data.pollData.answers.map((a) => {
                                    return { ...a, Reactions: [] }
                                }),
                            }
                        if (postData.type === 'glass-bead-game') {
                            newPost.Beads = postData.beads.map((bead, i) => {
                                return {
                                    ...bead,
                                    id: res.data.gbg.beads[i].newBead.id,
                                    Reactions: [],
                                    Link: { index: i + 1 },
                                }
                            })
                            newPost.GlassBeadGame = { ...res.data.gbg.game }
                            newPost.Players =
                                GBGSettings.players.map((p) => {
                                    return {
                                        ...p,
                                        UserPost: {
                                            state: p.id === accountData.id ? 'accepted' : 'pending',
                                        },
                                    }
                                }) || []
                        }
                        if (postData.type === 'card')
                            newPost.CardSides = [res.data.card.front, res.data.card.back]
                        // add new post to feed
                        if (addPostToSpaceFeed) setSpacePosts([newPost, ...spacePosts])
                        if (addPostToUserFeed) setUserPosts([newPost, ...userPosts])
                        if (governance) setGovernancePolls([...governancePolls, newPost])
                    }
                    setLoading(false)
                    setSaved(true)
                    setTimeout(() => closeModal(), 1000)
                })
                .catch((error) => {
                    if (!error.response) console.log(error)
                    else {
                        const { message } = error.response.data
                        switch (message) {
                            case 'File size too large':
                                setAudioSizeError(true)
                                break
                            default:
                                break
                        }
                    }
                    setLoading(false)
                })
        }
    }

    useEffect(() => {
        if (game) setPostType('glass-bead-game')
        if (governance) setPostType('poll')
    }, [])

    // remove errors and initialise date picker if post type is event
    useEffect(() => {
        // remove errors
        setNoTextError(false)
        setMaxCharsErrors(false)
        setNoImagesError(false)
        setTotalImageSizeError(false)
        setNoAudioError(false)
        setEventTextError(false)
        setNoEventTimesError(false)
        setPollTextError(false)
        setPollAnswersError(false)
        setTopicError(false)
        setNoBeadsError(false)
        // initialise date picker
        if (postType === 'event') {
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
                    setNoEventTimesError(false)
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
    }, [postType])

    // todo: pass function into input so hook not necissary (requires use of refs..., maybe update gbg settings instead?)
    // update minimum end date when start date changed
    useEffect(() => {
        if (startTime) {
            const endTimeInstance = d3.select('#date-time-end').node()
            if (endTimeInstance) endTimeInstance._flatpickr.set('minDate', new Date(startTime))
        }
    }, [startTime])

    // grab metadata for new urls when added to text
    useEffect(() => {
        if (urlsWithMetaData.length <= maxUrls) {
            // requestIndex used to pause requests until user has finished updating the url
            urlRequestIndex.current += 1
            const requestIndex = urlRequestIndex.current
            setTimeout(() => {
                if (urlRequestIndex.current === requestIndex) {
                    urls.forEach(
                        (url) =>
                            !urlsWithMetaData.find((u) => u.url === url) && scrapeUrlMetaData(url)
                    )
                }
            }, 500)
        }
    }, [urls])

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
        <Modal
            className={`${styles.wrapper} ${styles[postType]}`}
            close={closeModal}
            centerX
            confirmClose={!saved}
        >
            {saved ? (
                <SuccessMessage text='Post created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <Row centerY style={{ marginBottom: 20 }}>
                        <h1 style={{ margin: 0 }}>{findModalHeader()}</h1>
                        {postType === 'glass-bead-game' && (
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
                            {showTitle && postType !== 'glass-bead-game' && (
                                <Row centerY spaceBetween className={styles.title}>
                                    <input
                                        placeholder='Title...'
                                        type='text'
                                        value={title}
                                        maxLength={100}
                                        onChange={(e) => {
                                            setTitle(e.target.value)
                                            setNoTextError(false)
                                            setEventTextError(false)
                                            setPollTextError(false)
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
                            {postType === 'glass-bead-game' && (
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
                                stringifiedDraft={text}
                                maxChars={maxChars}
                                onChange={(value, textMentions, textUrls) => {
                                    setText(value)
                                    setMentions(textMentions)
                                    setUrls(textUrls.slice(0, maxUrls))
                                    setNoTextError(false)
                                    setMaxCharsErrors(false)
                                    setEventTextError(false)
                                    setPollTextError(false)
                                }}
                            />
                            {renderEventTimes()}
                            {postType === 'image' && (
                                <Row centerX style={{ width: '100%' }}>
                                    {images.length > 0 && renderImages()}
                                </Row>
                            )}
                            {postType === 'audio' && audioFile && (
                                <AudioCard
                                    key={audioFile.lastModified}
                                    url={URL.createObjectURL(audioFile)}
                                    staticBars={400}
                                    location='create-post-audio'
                                    style={{ height: 200 }}
                                />
                            )}
                            {postType === 'poll' && (
                                <Column className={styles.poll}>
                                    {pollAnswers.map((answer, index) => (
                                        <PollAnswer
                                            key={answer.id}
                                            index={index}
                                            type={pollType}
                                            answer={answer}
                                            percentage={0}
                                            color={pollColorScale(index)}
                                            remove={() => removePollAnswer(answer.id)}
                                            removable={answer.state !== 'done'}
                                            preview
                                        />
                                    ))}
                                    <Row style={{ width: '100%' }}>
                                        <Input
                                            type='text'
                                            placeholder='New answer...'
                                            value={newPollAnswer}
                                            onChange={(value) => setNewPollAnswer(value)}
                                            style={{ width: '100%', marginRight: 10 }}
                                        />
                                        <Button
                                            color='blue'
                                            text='Add'
                                            disabled={!newPollAnswer}
                                            onClick={addPollAnswer}
                                        />
                                    </Row>
                                </Column>
                            )}
                            {postType === 'card' && (
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
                                                        stringifiedDraft={cardFrontText}
                                                        maxChars={maxChars}
                                                        onChange={(value, textMentions) => {
                                                            setCardFrontError(false)
                                                            setCardFrontText(value)
                                                            setCardFrontMentions(textMentions)
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
                                                        stringifiedDraft={cardBackText}
                                                        maxChars={maxChars}
                                                        onChange={(value, textMentions) => {
                                                            setCardBackError(false)
                                                            setCardBackText(value)
                                                            setCardBackMentions(textMentions)
                                                        }}
                                                    />
                                                </Column>
                                            )}
                                        </Column>
                                    </Column>
                                    {cardImageSizeError && (
                                        <Row className={styles.errors}>
                                            <p>Max image size: {imageMBLimit}MB</p>
                                        </Row>
                                    )}
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
                            {['glass-bead-game', 'gbg-from-post'].includes(postType) && (
                                <Column className={styles.gbg}>
                                    {!synchronous && (
                                        <Column>
                                            {multiplayer && renderGBGInfoRow()}
                                            {/* {(!multiplayer || postType === 'gbg-from-post') &&
                                                renderBeads()} */}
                                        </Column>
                                    )}
                                    {(postType === 'gbg-from-post' ||
                                        (!synchronous && !multiplayer)) &&
                                        renderBeads()}
                                </Column>
                            )}
                            {urlsWithMetaData.map((u) => (
                                <UrlPreview
                                    key={u.url}
                                    type='post'
                                    urlData={u}
                                    loading={u.loading}
                                    remove={removeUrlMetaData}
                                    style={{ marginTop: 10 }}
                                />
                            ))}
                        </Column>
                    </Column>
                    {!['text', 'card'].includes(postType) && (
                        <Row wrap centerY centerX className={styles.contentOptions}>
                            {postType === 'image' && (
                                <>
                                    <Row className={styles.fileUploadInput}>
                                        <label htmlFor='post-images-file-input'>
                                            Upload images
                                            <input
                                                type='file'
                                                id='post-images-file-input'
                                                accept='.png, .jpg, .jpeg, .gif'
                                                onChange={addImageFiles}
                                                multiple
                                                hidden
                                            />
                                        </label>
                                    </Row>
                                    <p style={{ margin: '0 10px 10px 10px' }}>or</p>
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
                                </>
                            )}
                            {postType === 'audio' && (
                                <>
                                    <Row
                                        className={styles.fileUploadInput}
                                        style={{ marginRight: 10 }}
                                    >
                                        <label htmlFor='audio-file-input'>
                                            Upload audio
                                            <input
                                                type='file'
                                                id='audio-file-input'
                                                accept='audio/mpeg'
                                                onChange={selectAudioFile}
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
                                        <h2 style={{ marginLeft: 10 }}>
                                            {formatTimeMMSS(recordingTime)}
                                        </h2>
                                    )}
                                </>
                            )}
                            {postType === 'event' && (
                                <>
                                    <div id='date-time-start-wrapper'>
                                        <Input
                                            id='date-time-start'
                                            type='text'
                                            placeholder='Start time...'
                                        />
                                    </div>
                                    <p style={{ margin: '0 10px 10px 10px' }}>→</p>
                                    <div id='date-time-end-wrapper'>
                                        <Input
                                            id='date-time-end'
                                            type='text'
                                            placeholder='End time... (optional)'
                                        />
                                    </div>
                                    {endTime && <CloseButton size={20} onClick={removeEndDate} />}
                                </>
                            )}
                            {postType === 'poll' && (
                                <>
                                    <Toggle
                                        leftText='Lock answers'
                                        positionLeft={!pollAnswersLocked}
                                        rightColor='blue'
                                        onClick={() => {
                                            setPollAnswersError(false)
                                            setPollAnswersLocked(!pollAnswersLocked)
                                        }}
                                        onOffText
                                        style={{ marginRight: 20 }}
                                    />
                                    {governance && (
                                        <DropDown
                                            title='Action'
                                            options={['None', 'Create spaces']} // 'Assign Moderators'
                                            selectedOption={pollAction}
                                            setSelectedOption={(option) => setPollAction(option)}
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
                                </>
                            )}
                            {postType === 'glass-bead-game' && (
                                <Button
                                    text='Game settings'
                                    color='aqua'
                                    icon={<SettingsIcon />}
                                    onClick={() => setGBGSettingsModalOpen(true)}
                                />
                            )}
                        </Row>
                    )}
                    {!!contentTypes.length && (
                        <Row style={{ marginBottom: 20 }}>
                            {contentTypes.map((type) => (
                                <ContentButton
                                    key={type}
                                    type={type}
                                    postType={postType}
                                    setPostType={setPostType}
                                />
                            ))}
                        </Row>
                    )}
                    <Column centerX className={styles.errors}>
                        {noTextError && <p>No content added</p>}
                        {maxCharsErrors && <p>Text must be less than {maxChars} characters</p>}
                        {noImagesError && <p>No images added</p>}
                        {imageSizeError && <p>Max file size: {imageMBLimit} MBs</p>}
                        {totalImageSizeError && (
                            <p>
                                Total upload size ({findTotalImageMBs()} MBs) is greater than limit
                                of {totalMBUploadLimit} MBs
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
                        {cardBackError && <p>No content added to back of card</p>}
                    </Column>
                    <Button
                        text='Post'
                        color='blue'
                        disabled={postButtonDisabled()}
                        loading={loading}
                        onClick={createPost}
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
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    close={() => setImageModalOpen(false)}
                />
            )}
            {GBGSettingsModalOpen && (
                <GBGSettingsModal
                    settings={GBGSettings}
                    setSettings={(newSettings) => {
                        setGBGSettings(newSettings)
                        setNoBeadsError(false)
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
                        setNoBeadsError(false)
                    }}
                    close={() => setNextBeadModalOpen(false)}
                />
            )}
            {GBGHelpModalOpen && <GBGHelpModal close={() => setGBGHelpModalOpen(false)} />}
        </Modal>
    )
}

export default CreatePostModal
