/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import Button from '@components/Button'
import InquiryAnswer from '@components/cards/InquiryAnswer'
import PostCard from '@components/cards/PostCard/PostCard'
import PostCardUrlPreview from '@components/cards/PostCard/PostCardUrlPreview'
import StringBeadCard from '@components/cards/PostCard/StringBeadCard'
import CheckBox from '@components/CheckBox'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Markdown from '@components/Markdown'
import MarkdownEditor from '@components/MarkdownEditor'
import ProgressBarSteps from '@components/ProgressBarSteps'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import Toggle from '@components/Toggle'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import Modal from '@src/components/modals/Modal'
import config from '@src/Config'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import {
    allValid,
    defaultBeadData,
    defaultErrorState,
    defaultPostData,
    formatTimeDHM,
    formatTimeMMSS,
    isValidUrl,
    pluralise,
} from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/CreatePostModal.module.scss'
import { ReactComponent as EventIcon } from '@svgs/calendar-days-solid.svg'
import { ReactComponent as GBGIcon } from '@svgs/castalia-logo.svg'
import { ReactComponent as ChevronDownIcon } from '@svgs/chevron-down-solid.svg'
import { ReactComponent as ChevronLeftIcon } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as ChevronRightIcon } from '@svgs/chevron-right-solid.svg'
import { ReactComponent as ChevronUpIcon } from '@svgs/chevron-up-solid.svg'
import { ReactComponent as DNAIcon } from '@svgs/dna.svg'
import { ReactComponent as TextIcon } from '@svgs/font-solid.svg'
import { ReactComponent as ImageIcon } from '@svgs/image-solid.svg'
import { ReactComponent as UrlIcon } from '@svgs/link-solid.svg'
import { ReactComponent as WeaveIcon } from '@svgs/multiplayer-string-icon.svg'
import { ReactComponent as PauseIcon } from '@svgs/pause-solid.svg'
import { ReactComponent as PlayIcon } from '@svgs/play-solid.svg'
import { ReactComponent as PlusIcon } from '@svgs/plus.svg'
import { ReactComponent as InquiryIcon } from '@svgs/square-poll-vertical-solid.svg'
import { ReactComponent as StringIcon } from '@svgs/string-icon.svg'
import { ReactComponent as AudioIcon } from '@svgs/volume-high-solid.svg'
import axios from 'axios'
import * as d3 from 'd3'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_green.css'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'

const postTypes = [
    {
        name: 'Text',
        description: `**Text**: The most basic post type on weco. Type in some text (with markdown formatting if you like), choose where you want the post to appear, and you're good to go!`,
        steps: ['Post Type: Text', 'Text', 'Spaces', 'Create'],
        icon: <TextIcon />,
    },
    {
        name: 'Url',
        description: `**Url**: Add a URL and we'll scrape its meta-data to display on the post.`,
        steps: ['Post Type: URL', 'URL', 'Description (optional)', 'Spaces', 'Create'],
        icon: <UrlIcon />,
    },
    {
        name: 'Image',
        description: `**Image**: Upload images from your device or via URL, include captions if you want, and re-order them how you like to create an album.`,
        steps: ['Post Type: Image', 'Images', 'Description (optional)', 'Spaces', 'Create'],
        icon: <ImageIcon />,
    },
    {
        name: 'Audio',
        description: `**Audio**: Upload an audio clip from your device or record your own audio file.`,
        steps: ['Post Type: Audio', 'Audio', 'Description (optional)', 'Spaces', 'Create'],
        icon: <AudioIcon />,
    },
    {
        name: 'Event',
        description: `**Event**: Schedule an event with a start and end time to be displayed in your spaces calendar. Mark yourself as 'going' or 'interested' to receive a notification just before the event starts.`,
        steps: ['Post Type: Event', 'Title', 'Description (optional)', 'Date', 'Spaces', 'Create'],
        icon: <EventIcon />,
    },
    {
        name: 'Inquiry',
        description: `**Inquiry**: Ask a question, supply your own answers or leave them open for other users to add to, and keep track of the results. Single choice, multiple choice, or weighted choice voting allowed.`,
        steps: [
            'Post Type: Inquiry',
            'Title',
            'Description (optional)',
            'Settings',
            'Answers',
            'Spaces',
            'Create',
        ],
        icon: <InquiryIcon />,
    },
    {
        name: 'Glass Bead Game',
        description: `**Glass Bead Game**: Create your own Glass Bead Game and connect to other users with realtime audio-video streaming and chat functionality.`,
        steps: [
            'Post Type: Glass Bead Game',
            'Topic',
            'Description (optional)',
            'Date (optional)',
            'Spaces',
            'Create',
        ],
        icon: <GBGIcon />,
    },
    {
        name: 'String',
        description: `**String**: Create a string of connected items (text, URL, audio, or image) in one post.`,
        steps: ['Post Type: String', 'String', 'Description (optional)', 'Spaces', 'Create'],
        icon: <StringIcon />,
    },
    {
        name: 'Weave',
        description: `**Weave**: Set up an asynchronous game where players take turns adding beads (text, URL, audio, or image) to a single string post.`,
        steps: [
            'Post Type: Weave',
            'Description (optional)',
            'People',
            'Settings',
            'Spaces',
            'Create',
        ],
        icon: <WeaveIcon />,
    },
]

const { white, red, orange, yellow, green, blue, purple } = colors
const beadColors = [white, red, orange, yellow, green, blue, purple]

const CreatePostModal = (): JSX.Element => {
    const {
        accountData,
        setCreatePostModalOpen,
        createPostModalSettings,
        setCreatePostModalSettings,
    } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)

    let initialType = 'Text'
    if (createPostModalSettings.type === 'string-from-post') initialType = 'String'
    let initialStep = 1
    if (createPostModalSettings.type === 'string-from-post') initialStep = 2

    const [postType, setPostType] = useState(initialType)
    const [steps, setSteps] = useState<string[]>(['Post Type', 'Text', 'Spaces', 'Create'])
    const [currentStep, setCurrentStep] = useState(initialStep)

    // todo: set up validateItem function and remove unnecessary object nesting in state
    // text
    const [textForm, setTextForm] = useState({
        text: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (v.length < 1) errors.push('Required')
                if (v.length > 5000) errors.push('Must be less than 5K characters')
                return errors
            },
        },
    })

    // url
    const [urlForm1, setUrlForm1] = useState({
        url: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (!isValidUrl(v) ? ['Must be a valid URL'] : []),
        },
    })
    const [urlForm2, setUrlForm2] = useState({
        text: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })
    const [urlLoading, setUrlLoading] = useState(false)
    const [urlData, setUrlData] = useState<any>(null)

    // image
    const [images, setImages] = useState<any[]>([])
    const [imageURL, setImageURL] = useState('')
    const [imageSizeError, setImageSizeError] = useState(false)
    const [toalImageSizeError, setTotalImageSizeError] = useState(false)
    const [imagePostError, setImagePostError] = useState(false)
    const imageMBLimit = 2
    const totalImageSize =
        images.map((image) => (image.file ? image.file.size : 0)).reduce((a, b) => a + b, 0) /
        (1024 * 1024)
    const [imageForm, setImageForm] = useState({
        text: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })

    // audio
    const [audioFile, setAudioFile] = useState<File>()
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [showRecordControls, setShowRecordControls] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioPostError, setAudioPostError] = useState(false)
    const audioRecorderRef = useRef<any>(null)
    const audioChunksRef = useRef<any>([])
    const recordingIntervalRef = useRef<any>(null)
    const audioMBLimit = 5
    const [audioForm, setAudioForm] = useState({
        text: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })

    // event
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [duration, setDuration] = useState<string | null>(null)
    const [eventForm1, setEventForm1] = useState({
        title: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 500) errors.push('Must be less than 500 characters')
                return errors
            },
        },
    })
    const [eventForm2, setEventForm2] = useState({
        description: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })
    const [eventForm3, setEventForm3] = useState({
        startTime: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (!v ? ['Required'] : []),
        },
        endTime: {
            ...defaultErrorState,
            value: '',
            required: false,
        },
    })

    // inquiry
    const [inquiryForm1, setInquiryForm1] = useState({
        title: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 500) errors.push('Must be less than 500 characters')
                return errors
            },
        },
    })
    const [inquiryForm2, setInquiryForm2] = useState({
        description: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })
    const [inquiryType, setInquiryType] = useState<
        'single-choice' | 'multiple-choice' | 'weighted-choice'
    >('single-choice')
    const [answersLocked, setAnswersLocked] = useState(true)
    const [inquiryForm3, setInquiryForm3] = useState({
        endTime: {
            ...defaultErrorState,
            value: '',
            required: false,
        },
    })
    const [newAnswer, setNewAnswer] = useState('')
    const [answers, setAnswers] = useState<any[]>([])
    const [answersError, setAnswersError] = useState(false)
    const colorScale = d3
        .scaleSequential()
        .domain([0, answers.length])
        .interpolator(d3.interpolateViridis)

    // glass bead game
    const [topicGroup, setTopicGroup] = useState('archetopics')
    const [selectedTopic, setSelectedTopic] = useState<any>(null)
    const [topicError, setTopicError] = useState(false)
    const [GBGForm1, setGBGForm1] = useState({
        topic: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 200) errors.push('Must be less than 200 characters')
                return errors
            },
        },
    })
    const [GBGForm2, setGBGForm2] = useState({
        description: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })
    const [GBGForm3, setGBGForm3] = useState({
        startTime: {
            ...defaultErrorState,
            value: '',
            required: false,
        },
        endTime: {
            ...defaultErrorState,
            value: '',
            required: false,
        },
    })

    // string
    const [newBead, setNewBead] = useState<any>(defaultBeadData)
    const [string, setString] = useState<any[]>([])
    type errorState = 'default' | 'valid' | 'invalid'
    const [stringTextState, setStringTextState] = useState<errorState>('default')
    const [stringTextErrors, setStringTextErrors] = useState<string[]>([])
    const [stringPostError, setStringPostError] = useState(false)
    const [stringSizeError, setStringSizeError] = useState(false)
    const [stringForm, setStringForm] = useState({
        description: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })

    // weave
    const [multiplayerStringForm1, setMultiplayerStringForm1] = useState({
        description: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
        },
    })
    const [allUsersAllowed, setAllUsersAllowed] = useState(true)
    const [allowedBeadTypes, setAllowedBeadTypes] = useState(['Text', 'Url', 'Audio', 'Image'])
    const [userSearchLoading, setUserSearchLoading] = useState(false)
    const [userOptions, setUserOptions] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<any[]>([
        {
            id: accountData.id,
            handle: accountData.handle,
            name: accountData.name,
            flagImagePath: accountData.flagImagePath,
            color: null,
        },
    ])
    const [selectedUsersError, setSelectedUsersError] = useState(false)
    const [multiplayerStringForm2, setMultiplayerStringForm2] = useState({
        numberOfMoves: {
            ...defaultErrorState,
            value: 10,
            validate: (v) => (+v < 1 || +v > 50 ? ['Must be between 1 and 50 moves'] : []),
        },
    })
    const [multiplayerStringForm3, setMultiplayerStringForm3] = useState({
        numberOfTurns: {
            ...defaultErrorState,
            value: 1,
            validate: (v) => (+v < 1 || +v > 20 ? ['Must be between 1 and 20 turns'] : []),
        },
    })
    const [playerColorsOn, setPlayerColorsOn] = useState(false)
    const [selectedPlayerId, setSelectedPlayerId] = useState<null | number>(null)
    const [characterLimitOn, setCharacterLimitOn] = useState(false)
    const [characterLimit, setCharacterLimit] = useState(140)
    const [characterLimitError, setCharacterLimitError] = useState(false)
    const [audioTimeLimitOn, setAudioTimeLimitOn] = useState(false)
    const [audioTimeLimit, setAudioTimeLimit] = useState(60) // seconds
    const [audioTimeLimitError, setAudioTimeLimitError] = useState(false)
    const [moveTimeWindowOn, setMoveTimeWindowOn] = useState(false)
    const [moveTimeWindow, setMoveTimeWindow] = useState({
        days: 1,
        hours: 0,
        minutes: 0,
    })
    const [moveTimeWindowError, setMoveTimeWindowError] = useState(false)

    // selected spaces
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([
        {
            id: spaceData.id ? spaceData.id : 1,
            handle: spaceData.id ? spaceData.handle : 'all',
            name: spaceData.id ? spaceData.name : 'All',
            flagImagePath: spaceData.id
                ? spaceData.flagImagePath
                : 'https://weco-prod-space-flag-images.s3.eu-west-1.amazonaws.com/1614556880362',
        },
    ])
    const [selectedSpacesError, setSelectedSpacesError] = useState(false)

    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const totalMBUploadLimit = 10
    const cookies = new Cookies()

    function findSpaces(query) {
        if (!query) setSpaceOptions([])
        else {
            const blacklist = [...selectedSpaces.map((s) => s.id)]
            const data = { query, blacklist }
            axios
                .post(`${config.apiURL}/find-spaces`, data)
                .then((res) => setSpaceOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function addSpace(space) {
        setSpaceOptions([])
        setSelectedSpacesError(false)
        setSelectedSpaces((s) => [...s, space])
    }

    function removeSpace(spaceId) {
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    function findUsers(query) {
        if (!query) setUserOptions([])
        else {
            setUserSearchLoading(true)
            const data = { query, blacklist: selectedUsers.map((u) => u.id) }
            axios
                .post(`${config.apiURL}/find-users`, data)
                .then((res) => {
                    setUserOptions(res.data)
                    setUserSearchLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    function addUser(user) {
        setUserOptions([])
        setSelectedUsersError(false)
        setSelectedUsers((u) => [...u, user])
    }

    function removeUser(userId) {
        setSelectedUsers((u) => [...u.filter((user) => user.id !== userId)])
    }

    function scrapeURL(urlString) {
        setUrlData(null)
        if (isValidUrl(urlString)) {
            setUrlData(null)
            setUrlForm1({
                ...urlForm1,
                url: { ...urlForm1.url, value: urlString, state: 'default', errors: [] },
            })
            setUrlLoading(true)
            axios
                .get(`${config.apiURL}/scrape-url?url=${urlString}`)
                .then((res) => {
                    if (postType === 'String') {
                        setNewBead({
                            ...newBead,
                            url: urlString,
                            urlData: res.data,
                        })
                    } else {
                        setUrlData(res.data)
                        setUrlForm1({
                            ...urlForm1,
                            url: { ...urlForm1.url, value: urlString, state: 'valid' },
                        })
                    }
                    setUrlLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setUrlForm1({
                ...urlForm1,
                url: {
                    ...urlForm1.url,
                    value: urlString,
                    state: 'invalid',
                    errors: ['Must be a valid URL'],
                },
            })
        }
    }

    function addImageFiles() {
        setImageSizeError(false)
        setImagePostError(false)
        const input = document.getElementById('image-post-file-input') as HTMLInputElement
        if (input && input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i += 1) {
                if (input.files[i].size > imageMBLimit * 1024 * 1024) setImageSizeError(true)
                else
                    setImages((img) => [
                        ...img,
                        { id: uuidv4(), file: input && input.files && input.files[i] },
                    ])
            }
        }
    }

    function addImageURL() {
        setImages([...images, { id: uuidv4(), url: imageURL }])
        setImageURL('')
        setImageSizeError(false)
        setImagePostError(false)
    }

    function removeImage(index) {
        setImages([...images.filter((image, i) => i !== index)])
    }

    function moveImage(index, increment) {
        const newImages = [...images]
        const image = newImages[index]
        newImages.splice(index, 1)
        newImages.splice(index + increment, 0, image)
        setImages(newImages)
    }

    function updateNewCaption(index, value) {
        const newImages = [...images]
        newImages[index].newCaption = value
        setImages(newImages)
    }

    function updateCaption(index) {
        const newImages = [...images]
        newImages[index].caption = newImages[index].newCaption
        newImages[index].newCaption = ''
        setImages(newImages)
    }

    function resetAudioState() {
        setAudioFile(undefined)
        setAudioPostError(false)
        setRecordingTime(0)
        audioChunksRef.current = []
        const input = d3.select('#audio-file-input').node()
        if (input) input.value = ''
    }

    function selectAudioFile() {
        setShowRecordControls(false)
        const input = d3.select('#audio-file-input').node()
        if (input && input.files && input.files[0]) {
            if (input.files[0].size > audioMBLimit * 1024 * 1024) {
                setAudioSizeError(true)
                resetAudioState()
            } else {
                // todo: move to add bead function
                setAudioSizeError(false)
                setAudioPostError(false)
                if (postType === 'String') {
                    setNewBead({
                        ...newBead,
                        audioFile: input.files[0],
                        audioType: 'file',
                    })
                } else setAudioFile(input.files[0])
            }
        }
    }

    function toggleAudioRecording() {
        if (recording) {
            audioRecorderRef.current.stop()
            setRecording(false)
        } else {
            resetAudioState()
            navigator.mediaDevices.getUserMedia({ audio: true }).then((audio) => {
                audioRecorderRef.current = new MediaRecorder(audio)
                audioRecorderRef.current.ondataavailable = (e) => {
                    audioChunksRef.current.push(e.data)
                }
                audioRecorderRef.current.onstart = () => {
                    recordingIntervalRef.current = setInterval(() => {
                        setRecordingTime((t) => t + 1)
                    }, 1000)
                }
                audioRecorderRef.current.onstop = () => {
                    clearInterval(recordingIntervalRef.current)
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/mpeg-3' })
                    if (postType === 'String') {
                        setNewBead({
                            ...newBead,
                            audioFile: new File([blob], ''),
                            audioBlob: blob,
                            audioType: 'recording',
                        })
                    } else setAudioFile(new File([blob], ''))
                }
                audioRecorderRef.current.start()
                setRecording(true)
            })
        }
    }

    function toggleAudio() {
        const audio = d3.select('#new-post-audio').node()
        if (audio) {
            if (audio.paused) audio.play()
            else audio.pause()
        }
    }

    function addBeadToString() {
        // validate bead
        let valid = false
        if (newBead.type === 'text') {
            valid = newBead.text.length < 5000
            setStringTextErrors(valid ? [] : ['Must be less than 5K characters'])
            setStringTextState(valid ? 'default' : 'invalid')
        } else if (newBead.type === 'image' && totalImageSize >= totalMBUploadLimit) {
            setTotalImageSizeError(true)
        } else valid = true
        if (valid) {
            if (newBead.type === 'image') {
                newBead.images = images.map((image, index) => {
                    return { index, ...image }
                })
            }
            setString([...string, newBead])
            setNewBead({
                ...defaultBeadData,
                id: uuidv4(),
                type: newBead.type,
            })
            // reset state
            setStringPostError(false)
            setImages([])
            setTotalImageSizeError(false)
            resetAudioState()
            const input = document.getElementById('new-bead-text')
            if (input) input.style.height = ''
        }
    }

    function removeBead(index) {
        setString([...string.filter((bead, i) => i !== index)])
        setStringSizeError(false)
    }

    function moveBead(index, increment) {
        const newString = [...string]
        const bead = newString[index]
        newString.splice(index, 1)
        newString.splice(index + increment, 0, bead)
        setString(newString)
    }

    function totalStringSize() {
        const filesSizes = [] as number[]
        string.forEach((bead) => {
            if (bead.type === 'audio') filesSizes.push(bead.audioFile.size)
            if (bead.type === 'image') {
                bead.images.forEach((image) => {
                    if (image.file) filesSizes.push(image.file.size)
                })
            }
        })
        return filesSizes.reduce((a, b) => a + b, 0) / (1024 * 1024)
    }

    function updateAllowedBeadTypes(type, checked) {
        if (checked) setAllowedBeadTypes([...allowedBeadTypes, type])
        else setAllowedBeadTypes([...allowedBeadTypes.filter((t) => t !== type)])
    }

    function sortAndStringifyAllowedBeadTypes(typesArray) {
        const orderedArray = [] as string[]
        if (typesArray.find((t) => t === 'Text')) orderedArray.push('Text')
        if (typesArray.find((t) => t === 'Url')) orderedArray.push('Url')
        if (typesArray.find((t) => t === 'Audio')) orderedArray.push('Audio')
        if (typesArray.find((t) => t === 'Image')) orderedArray.push('Image')
        return orderedArray.join(',')
    }

    function updatePlayerPosition(from, to) {
        const newPlayers = [...selectedUsers]
        const player = newPlayers[from]
        newPlayers.splice(from, 1)
        newPlayers.splice(to, 0, player)
        setSelectedUsers(newPlayers)
    }

    function invalidTimeWindow() {
        const greaterThanMax =
            moveTimeWindow.days === 365 && (moveTimeWindow.hours || moveTimeWindow.minutes)
        const lessThanMin =
            moveTimeWindow.days === 0 && moveTimeWindow.hours === 0 && moveTimeWindow.minutes < 20
        return greaterThanMax || lessThanMin
    }

    function moveForward() {
        if (currentStep === 1) setCurrentStep(2)

        if (postType === 'Text' && currentStep === 2 && allValid(textForm, setTextForm))
            setCurrentStep(3)

        if (postType === 'Url') {
            if (currentStep === 2) {
                if (urlData) setCurrentStep(3)
                else
                    setUrlForm1({
                        ...urlForm1,
                        url: {
                            ...urlForm1.url,
                            state: 'invalid',
                            errors: ['Must be a valid URL'],
                        },
                    })
            }
            if (currentStep === 3 && allValid(urlForm2, setUrlForm2)) setCurrentStep(4)
        }

        if (postType === 'Image') {
            if (currentStep === 2) {
                if (!images.length) setImagePostError(true)
                else if (totalImageSize >= totalMBUploadLimit) setTotalImageSizeError(true)
                else setCurrentStep(3)
            }
            if (currentStep === 3 && allValid(imageForm, setImageForm)) setCurrentStep(4)
        }

        if (postType === 'Audio') {
            if (currentStep === 2) {
                if (!audioFile && !audioSizeError) setAudioPostError(true)
                else setCurrentStep(3)
            }
            if (currentStep === 3 && allValid(audioForm, setAudioForm)) setCurrentStep(4)
        }

        if (postType === 'Event') {
            if (currentStep === 2 && allValid(eventForm1, setEventForm1)) setCurrentStep(3)
            if (currentStep === 3 && allValid(eventForm2, setEventForm2)) setCurrentStep(4)
            if (currentStep === 4 && allValid(eventForm3, setEventForm3)) setCurrentStep(5)
        }

        if (postType === 'Inquiry') {
            if (currentStep === 2 && allValid(inquiryForm1, setInquiryForm1)) setCurrentStep(3)
            if (currentStep === 3 && allValid(inquiryForm2, setInquiryForm2)) setCurrentStep(4)
            if (currentStep === 4) setCurrentStep(5)
            if (currentStep === 5) {
                if (answersLocked && !answers.length) setAnswersError(true)
                else setCurrentStep(6)
            }
        }

        if (postType === 'Glass Bead Game') {
            if (currentStep === 2) {
                if (allValid(GBGForm1, setGBGForm1)) setCurrentStep(3)
                else if (topicGroup !== 'custom' && !selectedTopic) setTopicError(true)
            }
            if (currentStep === 3 && allValid(GBGForm2, setGBGForm2)) setCurrentStep(4)
            if (currentStep === 4 && allValid(GBGForm3, setGBGForm3)) setCurrentStep(5)
        }

        if (postType === 'String') {
            if (currentStep === 2) {
                const noNewBeads =
                    string.length < (createPostModalSettings.type === 'string-from-post' ? 2 : 1)
                if (noNewBeads) setStringPostError(true)
                else if (totalStringSize() >= totalMBUploadLimit) setStringSizeError(true)
                else setCurrentStep(3)
            }
            if (currentStep === 3 && allValid(stringForm, setStringForm)) setCurrentStep(4)
        }

        if (postType === 'Weave') {
            if (currentStep === 2 && allValid(multiplayerStringForm1, setMultiplayerStringForm1))
                setCurrentStep(3)
            if (currentStep === 3) {
                if (allUsersAllowed || selectedUsers.length > 1) setCurrentStep(4)
                else setSelectedUsersError(true)
            }
            if (currentStep === 4) {
                if (
                    (allUsersAllowed
                        ? allValid(multiplayerStringForm2, setMultiplayerStringForm2)
                        : allValid(multiplayerStringForm3, setMultiplayerStringForm3)) &&
                    allowedBeadTypes.length
                ) {
                    if (
                        allowedBeadTypes.includes('Text') &&
                        characterLimitOn &&
                        (characterLimit < 1 || characterLimit > 1000)
                    )
                        setCharacterLimitError(true)
                    else if (
                        allowedBeadTypes.includes('Audio') &&
                        audioTimeLimitOn &&
                        (audioTimeLimit < 10 || audioTimeLimit > 300)
                    )
                        setAudioTimeLimitError(true)
                    else if (!allUsersAllowed && moveTimeWindowOn && invalidTimeWindow()) {
                        setMoveTimeWindowError(true)
                    } else {
                        setCharacterLimitError(false)
                        setAudioTimeLimitError(false)
                        setMoveTimeWindowError(false)
                        setCurrentStep(5)
                    }
                }
            }
        }

        if (currentStep === steps.length - 1) {
            if (selectedSpaces.length) setCurrentStep(steps.length)
            else setSelectedSpacesError(true)
        }
    }

    function findPostTypeValue(type, value) {
        const postTypeData = postTypes.find((item) => item.name === type)
        return postTypeData ? postTypeData[value] : null
    }

    function updatePostType(type) {
        const postTypeSteps = findPostTypeValue(type, 'steps')
        setSteps(postTypeSteps || [])
        setPostType(type)
    }

    function findPostData() {
        const data = {
            ...defaultPostData,
            type: postType.toLowerCase().split(' ').join('-'),
            Creator: {
                id: accountData.id,
                handle: accountData.handle,
                name: accountData.name,
                flagImagePath: accountData.flagImagePath,
            },
            DirectSpaces: selectedSpaces.map((space) => {
                return { ...space, type: 'post', state: 'active' }
            }),
            sourcePostId: createPostModalSettings.source ? createPostModalSettings.source.id : null,
            sourceCreatorId: createPostModalSettings.source
                ? createPostModalSettings.source.Creator.id
                : null,
        }
        if (postType === 'Text') data.text = textForm.text.value
        if (postType === 'Url') {
            data.text = urlForm2.text.value
            data.url = urlForm1.url.value
            data.urlImage = urlData.image || null
            data.urlDomain = urlData.domain || null
            data.urlTitle = urlData.title || null
            data.urlDescription = urlData.description || null
        }
        if (postType === 'Image') {
            data.text = imageForm.text.value
            data.PostImages = images.map((image, index) => {
                return {
                    id: image.id,
                    index,
                    caption: image.caption,
                    url: image.url || URL.createObjectURL(image.file),
                }
            })
        }
        if (postType === 'Audio') {
            data.text = audioForm.text.value
            data.url = audioFile ? URL.createObjectURL(audioFile) : ''
        }
        if (postType === 'Event') {
            data.text = eventForm2.description.value
            data.Event = {
                title: eventForm1.title.value,
                startTime: eventForm3.startTime.value,
                endTime: eventForm3.endTime.value,
                Going: [],
                Interested: [],
            }
        }
        if (postType === 'Inquiry') {
            data.text = inquiryForm2.description.value
            data.Inquiry = {
                title: inquiryForm1.title.value,
                type: inquiryType,
                endTime: inquiryForm3.endTime.value,
                answersLocked,
                InquiryAnswers: answers.map((a) => {
                    return { ...a, Reactions: [] }
                }),
            }
        }
        if (postType === 'Glass Bead Game') {
            data.text = GBGForm2.description.value
            data.GlassBeadGame = {
                topic: GBGForm1.topic.value,
                topicGroup,
                topicImage:
                    topicGroup !== 'custom'
                        ? GlassBeadGameTopics[topicGroup].find(
                              (t) => t.name === GBGForm1.topic.value
                          ).imagePath
                        : null,
                GlassBeads: [],
            }
            data.Event = GBGForm3.startTime.value
                ? {
                      startTime: GBGForm3.startTime.value,
                      endTime: GBGForm3.endTime.value,
                      Going: [],
                      Interested: [],
                  }
                : null
        }
        if (postType === 'String') {
            data.text = stringForm.description.value
            data.StringPosts = string.map((bead, index) => {
                if (bead.role === 'source') return bead
                let beadUrl = ''
                if (bead.type === 'url') beadUrl = bead.url
                if (bead.type === 'audio')
                    beadUrl = URL.createObjectURL(bead.audioFile || bead.audioBlob)
                return {
                    id: bead.id,
                    text: bead.text,
                    type: `string-${bead.type}`,
                    color: bead.color,
                    url: beadUrl,
                    urlDescription: bead.urlData ? bead.urlData.description : null,
                    urlDomain: bead.urlData ? bead.urlData.domain : null,
                    urlImage: bead.urlData ? bead.urlData.image : null,
                    urlTitle: bead.urlData ? bead.urlData.title : null,
                    Link: { index },
                    PostImages: bead.images.map((image, i) => {
                        return {
                            id: image.id,
                            index: i,
                            caption: image.caption,
                            url: image.file ? URL.createObjectURL(image.file) : image.url,
                        }
                    }),
                }
            })
        }
        if (postType === 'Weave') {
            data.text = multiplayerStringForm1.description.value
            data.StringPlayers = selectedUsers.map((user, index) => {
                return {
                    ...user,
                    UserPost: {
                        index,
                        state: user.id === accountData.id ? 'accepted' : 'pending',
                    },
                }
            })
            data.Weave = {
                numberOfMoves: allUsersAllowed ? multiplayerStringForm2.numberOfMoves.value : null,
                numberOfTurns: allUsersAllowed ? null : multiplayerStringForm3.numberOfTurns.value,
                moveDuration: null,
                allowedBeadTypes: sortAndStringifyAllowedBeadTypes(allowedBeadTypes),
                characterLimit:
                    allowedBeadTypes.includes('Text') && characterLimitOn ? characterLimit : null,
                audioTimeLimit:
                    allowedBeadTypes.includes('Audio') && audioTimeLimitOn ? audioTimeLimit : null,
                moveTimeWindow:
                    !allUsersAllowed && moveTimeWindowOn
                        ? moveTimeWindow.days * 24 * 60 +
                          moveTimeWindow.hours * 60 +
                          moveTimeWindow.minutes
                        : null,
                privacy: allUsersAllowed ? 'all-users-allowed' : 'only-selected-users',
            }
        }
        return data
    }

    function formatBeadData(bead, index) {
        return {
            ...bead,
            url: bead.type === 'audio' ? URL.createObjectURL(bead.audioFile) : bead.url,
            urlName: bead.urlData ? bead.urlData.name : null,
            urlDomain: bead.urlData ? bead.urlData.domain : null,
            urlTitle: bead.urlData ? bead.urlData.title : null,
            urlImage: bead.urlData ? bead.urlData.image : null,
            Link: { index },
            PostImages: bead.images.map((image, i) => {
                return {
                    id: image.id,
                    index: i,
                    caption: image.caption,
                    url: image.file ? URL.createObjectURL(image.file) : image.url,
                }
            }),
        }
    }

    function togglePlayerColors() {
        if (playerColorsOn) {
            // remove colors
            setSelectedUsers(
                selectedUsers.map((player) => {
                    return { ...player, color: colors.white }
                })
            )
        } else {
            // add colors
            setSelectedUsers(
                selectedUsers.map((player, index) => {
                    return { ...player, color: beadColors[index + 1] }
                })
            )
        }
        setPlayerColorsOn(!playerColorsOn)
    }

    function changePlayerColor(color) {
        const newPlayers = [...selectedUsers]
        const selectedPlayer = newPlayers.find((p) => p.id === selectedPlayerId)
        if (selectedPlayer) selectedPlayer.color = color
        setSelectedUsers(newPlayers)
        setSelectedPlayerId(null)
    }

    function trimNumber(number, maxValue) {
        // if invalid number: return 0
        // if greater than max value: return max value
        return number ? (number > maxValue ? maxValue : number) : 0
    }

    function createPost() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        const data = findPostData()
        const postData = {
            creatorName: accountData.name,
            creatorHandle: accountData.handle,
            spaceIds: selectedSpaces.map((s) => s.id),
            type: data.type,
            text: data.text,
            url: data.url,
            // url posts
            urlImage: data.urlImage,
            urlDomain: data.urlDomain,
            urlTitle: data.urlTitle,
            urlDescription: data.urlDescription,
            // event posts
            title: data.Event ? data.Event.title : '',
            startTime: data.Event ? data.Event.startTime : null,
            endTime: data.Event ? data.Event.endTime : null,
            // inquiry posts
            inquiryTitle: inquiryForm1.title.value,
            inquiryEndTime: inquiryForm3.endTime.value,
            answersLocked,
            inquiryType,
            inquiryAnswers: JSON.stringify(answers),
            // glass bead games
            topic: data.GlassBeadGame ? data.GlassBeadGame.topic : null,
            topicGroup: data.GlassBeadGame ? data.GlassBeadGame.topicGroup : null,
            topicImage: data.GlassBeadGame ? data.GlassBeadGame.topicImage : null,
            // weaves
            privacy: data.Weave ? data.Weave.privacy : null,
            playerData: JSON.stringify(
                selectedUsers.map((p) => {
                    return {
                        id: p.id,
                        color: p.color,
                    }
                })
            ),
            numberOfMoves: data.Weave ? data.Weave.numberOfMoves : null,
            numberOfTurns: data.Weave ? data.Weave.numberOfTurns : null,
            allowedBeadTypes: data.Weave ? data.Weave.allowedBeadTypes : null,
            characterLimit: data.Weave ? data.Weave.characterLimit : null,
            audioTimeLimit: data.Weave ? data.Weave.audioTimeLimit : null,
            moveTimeWindow: data.Weave ? data.Weave.moveTimeWindow : null,
            // strings and weaves:
            sourcePostId: data.sourcePostId,
            sourceCreatorId: data.sourceCreatorId,
        }
        let fileData
        let uploadType
        if (postType === 'Audio') {
            const isBlob = audioFile && !audioFile.name
            uploadType = isBlob ? 'audio-blob' : 'audio-file'
            fileData = new FormData()
            fileData.append(
                'file',
                isBlob ? new Blob(audioChunksRef.current, { type: 'audio/mpeg-3' }) : audioFile
            )
            fileData.append('postData', JSON.stringify(postData))
            options.headers['Content-Type'] = 'multipart/form-data'
        }
        if (postType === 'Image') {
            uploadType = 'image-post'
            fileData = new FormData()
            images.forEach((image, index) => {
                if (image.file) fileData.append('file', image.file, index)
            })
            fileData.append('imageData', JSON.stringify(images))
            fileData.append('postData', JSON.stringify(postData))
        }
        if (postType === 'String') {
            uploadType = 'string'
            fileData = new FormData()
            const filteredString = string.filter((b) => b.role !== 'source')
            filteredString.forEach((bead, index) => {
                if (bead.type === 'audio') {
                    if (bead.audioType === 'file')
                        fileData.append('audioFile', bead.audioFile, index)
                    else fileData.append('audioRecording', bead.audioBlob, index)
                } else if (bead.type === 'image') {
                    bead.images.forEach((image, i) => {
                        if (image.file) fileData.append('image', image.file, `${index}-${i}`)
                    })
                }
            })
            fileData.append('stringData', JSON.stringify(filteredString))
            fileData.append('postData', JSON.stringify(postData))
        }
        axios
            .post(
                `${config.apiURL}/create-post?uploadType=${uploadType}`,
                fileData || postData,
                options
            )
            .then((res) => {
                setLoading(false)
                setSaved(true)
                setCurrentStep(steps.length + 1)
                if (selectedSpaces.map((space) => space.id).includes(spaceData.id)) {
                    let stringPosts = [] as any[]
                    if (res.data.string)
                        stringPosts = [
                            ...res.data.string.map((bead, i) => {
                                return {
                                    ...bead.stringPost,
                                    Link: { index: i },
                                    PostImages: bead.imageData || [],
                                }
                            }),
                        ]
                    if (createPostModalSettings.type === 'string-from-post') {
                        stringPosts.unshift({
                            ...createPostModalSettings.source,
                            Link: { index: 0, relationship: 'source' },
                        })
                    }
                    const newPost = {
                        ...data,
                        ...res.data.post,
                        IndirectSpaces: [
                            ...res.data.indirectRelationships.map((item) => {
                                return { id: item.holonId }
                            }),
                        ],
                        PostImages: res.data.images || [],
                        Event: res.data.event
                            ? {
                                  ...res.data.event,
                                  Going: [],
                                  Interested: [],
                              }
                            : null,
                        Inquiry:
                            postType === 'Inquiry'
                                ? {
                                      ...data.Inquiry,
                                      InquiryAnswers: res.data.inquiryAnswers.map((a) => {
                                          return { ...a, Reactions: [] }
                                      }),
                                  }
                                : null,
                        StringPosts: stringPosts,
                    }
                    setSpacePosts([newPost, ...spacePosts])
                }
                setTimeout(() => {
                    setCreatePostModalOpen(false)
                    setCreatePostModalSettings({ type: 'text' })
                }, 1000)
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

    const dateTimeOptions = {
        enableTime: true,
        clickOpens: true,
        disableMobile: true,
        minDate: new Date(),
        minuteIncrement: 1,
        altInput: true,
    }

    useEffect(() => {
        const { type, source } = createPostModalSettings
        if (type === 'string-from-post') {
            setString([
                {
                    ...source,
                    role: 'source',
                    type: `string-${source.type}`,
                    Link: { index: 0, relationship: 'source' },
                },
            ])
        }
    }, [])

    useEffect(() => {
        if (postType === 'Event' && currentStep === 4) {
            const now = new Date()
            const startTimePast = new Date(eventForm3.startTime.value) < now
            const endTimePast = new Date(eventForm3.endTime.value) < now
            const defaultStartDate = eventForm3.startTime.value
                ? startTimePast
                    ? now
                    : new Date(eventForm3.startTime.value)
                : undefined
            const defaultEndDate = eventForm3.endTime.value
                ? endTimePast
                    ? now
                    : new Date(eventForm3.endTime.value)
                : undefined
            flatpickr('#date-time-start', {
                ...dateTimeOptions,
                defaultDate: defaultStartDate,
                appendTo: document.getElementById('date-time-start-wrapper') || undefined,
                onChange: ([value]) => setStartTime(value.toString()),
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
        if (postType === 'Glass Bead Game' && currentStep === 4) {
            const now = new Date()
            const startTimePast = new Date(GBGForm3.startTime.value) < now
            const endTimePast = new Date(GBGForm3.endTime.value) < now
            const defaultStartDate = GBGForm3.startTime.value
                ? startTimePast
                    ? now
                    : new Date(GBGForm3.startTime.value)
                : undefined
            const defaultEndDate = GBGForm3.endTime.value
                ? endTimePast
                    ? now
                    : new Date(GBGForm3.endTime.value)
                : undefined
            flatpickr('#date-time-start', {
                ...dateTimeOptions,
                defaultDate: defaultStartDate,
                appendTo: document.getElementById('date-time-start-wrapper') || undefined,
                onChange: ([value]) => setStartTime(value.toString()),
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
        if (postType === 'Inquiry' && currentStep === 4) {
            const now = new Date()
            const endTimePast = new Date(inquiryForm3.endTime.value) < now
            const defaultEndDate = inquiryForm3.endTime.value
                ? endTimePast
                    ? now
                    : new Date(inquiryForm3.endTime.value)
                : undefined
            flatpickr('#date-time-end', {
                ...dateTimeOptions,
                defaultDate: defaultEndDate,
                minDate: now,
                appendTo: document.getElementById('date-time-end-wrapper') || undefined,
                onChange: ([value]) => setEndTime(value.toString()),
            })
            if (endTimePast && defaultEndDate) setStartTime(defaultEndDate.toString())
        }
    }, [currentStep])

    useEffect(() => {
        if (startTime) {
            const startTimeDate = new Date(startTime)
            if (postType === 'Event') {
                setEventForm3({
                    ...eventForm3,
                    startTime: {
                        ...eventForm3.startTime,
                        value: startTime,
                        state: 'valid',
                        errors: [],
                    },
                })
            }
            if (postType === 'Glass Bead Game') {
                setGBGForm3({
                    ...GBGForm3,
                    startTime: {
                        ...GBGForm3.startTime,
                        value: startTime,
                        state: 'valid',
                        errors: [],
                    },
                })
            }
            const endTimeInstance = d3.select('#date-time-end').node()._flatpickr
            endTimeInstance.set('minDate', startTimeDate)
            if (endTime) {
                const endTimeDate = new Date(endTime)
                const difference = (endTimeDate.getTime() - startTimeDate.getTime()) / 1000
                if (difference < 0) {
                    setEndTime(startTime)
                    endTimeInstance.setDate(startTimeDate)
                    setDuration(formatTimeDHM(0))
                } else setDuration(formatTimeDHM(difference))
            }
        }
    }, [startTime])

    useEffect(() => {
        if (startTime && endTime) {
            const difference = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
            setDuration(formatTimeDHM(difference))
            if (postType === 'Event') {
                setEventForm3({
                    ...eventForm3,
                    endTime: {
                        ...eventForm3.endTime,
                        value: endTime,
                    },
                })
            }
            if (postType === 'Glass Bead Game') {
                setGBGForm3({
                    ...GBGForm3,
                    endTime: {
                        ...GBGForm3.endTime,
                        value: endTime,
                    },
                })
            }
        }
        if (postType === 'Inquiry') {
            setInquiryForm3({
                ...inquiryForm3,
                endTime: {
                    ...inquiryForm3.endTime,
                    value: endTime,
                },
            })
        }
    }, [endTime])

    return (
        <Modal
            className={styles.wrapper}
            close={() => {
                setCreatePostModalOpen(false)
                setCreatePostModalSettings({ type: 'text' })
            }}
            centered
            confirmClose
        >
            {saved ? (
                <SuccessMessage text='Post created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    {currentStep === 1 ? (
                        <h1>New post</h1>
                    ) : (
                        <Column centerX className={styles.title}>
                            {createPostModalSettings.type === 'string-from-post' ? (
                                <p>Create string from post</p>
                            ) : (
                                <p>{postType}</p>
                            )}
                            <Column centerX centerY>
                                {findPostTypeValue(postType, 'icon')}
                            </Column>
                        </Column>
                    )}

                    {currentStep === 1 && (
                        <Column centerX style={{ maxWidth: 500 }}>
                            <p>Choose a post type:</p>
                            <Row wrap centerX style={{ margin: '20px 0' }}>
                                {postTypes.map((type) => (
                                    <Column
                                        centerX
                                        className={styles.postTypeButton}
                                        key={type.name}
                                    >
                                        <button
                                            type='button'
                                            className={`${
                                                postType === type.name && styles.selected
                                            }`}
                                            onClick={() => updatePostType(type.name)}
                                        >
                                            {findPostTypeValue(type.name, 'icon')}
                                        </button>
                                        <p>{type.name}</p>
                                    </Column>
                                ))}
                            </Row>
                            <Markdown
                                text={findPostTypeValue(postType, 'description')}
                                style={{ textAlign: 'center', marginBottom: 20 }}
                            />
                        </Column>
                    )}

                    {postType === 'Text' && currentStep === 2 && (
                        <Column centerX style={{ maxWidth: 500, marginBottom: 30 }}>
                            <MarkdownEditor
                                initialValue={textForm.text.value}
                                // text={textForm.text.value}
                                onChange={(value) => {
                                    setTextForm({
                                        ...textForm,
                                        text: { ...textForm.text, value, state: 'default' },
                                    })
                                }}
                                state={textForm.text.state}
                                errors={textForm.text.errors}
                            />
                        </Column>
                    )}

                    {postType === 'Url' && (
                        <Column centerX style={{ width: '100%', maxWidth: 500 }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <Input
                                        type='text'
                                        // prefix='https://'
                                        placeholder='Add your URL here...'
                                        loading={urlLoading}
                                        state={urlForm1.url.state}
                                        errors={urlForm1.url.errors}
                                        value={urlForm1.url.value}
                                        onChange={(value) => {
                                            setUrlForm1({
                                                ...urlForm1,
                                                url: { ...urlForm1.url, value, state: 'default' },
                                            })
                                            scrapeURL(value)
                                        }}
                                        style={{ width: '100%', maxWidth: 400, marginBottom: 15 }}
                                    />
                                    {urlData && (
                                        <Column className={styles.urlPreviewWrapper}>
                                            <PostCardUrlPreview
                                                url={urlForm1.url.value}
                                                image={urlData.image}
                                                domain={urlData.domain}
                                                title={urlData.title}
                                                description={urlData.description}
                                            />
                                        </Column>
                                    )}
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={urlForm2.text.value}
                                        onChange={(value) => {
                                            setUrlForm2({
                                                ...urlForm2,
                                                text: { ...urlForm2.text, value, state: 'default' },
                                            })
                                        }}
                                        state={urlForm2.text.state}
                                        errors={urlForm2.text.errors}
                                    />
                                </Column>
                            )}
                        </Column>
                    )}

                    {postType === 'Image' && (
                        <Column centerX style={{ width: '100%', maxWidth: 600 }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    {imagePostError && (
                                        <p className='danger' style={{ marginBottom: 10 }}>
                                            No images added yet
                                        </p>
                                    )}
                                    <Row centerX style={{ width: '100%' }}>
                                        {images.length > 0 && (
                                            <Scrollbars className={`${styles.images} row`}>
                                                {images.map((image, index) => (
                                                    <Column
                                                        centerX
                                                        className={styles.image}
                                                        key={index}
                                                    >
                                                        <CloseButton
                                                            size={20}
                                                            onClick={() => removeImage(index)}
                                                        />
                                                        <img
                                                            src={
                                                                image.url ||
                                                                URL.createObjectURL(image.file)
                                                            }
                                                            alt=''
                                                        />
                                                        {image.caption && <p>{image.caption}</p>}
                                                        <Row centerY style={{ width: 220 }}>
                                                            <Input
                                                                type='text'
                                                                placeholder={`${
                                                                    image.caption ? 'change' : 'add'
                                                                } caption...`}
                                                                value={image.newCaption}
                                                                onChange={(v) =>
                                                                    updateNewCaption(index, v)
                                                                }
                                                                style={{ marginRight: 5 }}
                                                            />
                                                            <Button
                                                                icon={<PlusIcon />}
                                                                color='grey'
                                                                onClick={() => updateCaption(index)}
                                                                style={{ padding: '0 10px' }}
                                                            />
                                                        </Row>
                                                        <Row centerX className={styles.itemFooter}>
                                                            {index !== 0 && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        moveImage(index, -1)
                                                                    }
                                                                >
                                                                    <ChevronLeftIcon />
                                                                </button>
                                                            )}
                                                            {index < images.length - 1 && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        moveImage(index, 1)
                                                                    }
                                                                >
                                                                    <ChevronRightIcon />
                                                                </button>
                                                            )}
                                                        </Row>
                                                    </Column>
                                                ))}
                                            </Scrollbars>
                                        )}
                                    </Row>
                                    {imageSizeError && (
                                        <p className='danger' style={{ marginBottom: 10 }}>
                                            Max file size: {imageMBLimit}MB
                                        </p>
                                    )}
                                    {toalImageSizeError && (
                                        <p className='danger' style={{ marginBottom: 10 }}>
                                            Total image upload size must be less than{' '}
                                            {totalMBUploadLimit}
                                            MB. (Current size: {totalImageSize.toFixed(2)}MB)
                                        </p>
                                    )}
                                    <Row className={styles.fileUploadInput}>
                                        <label htmlFor='image-post-file-input'>
                                            Upload images
                                            <input
                                                type='file'
                                                id='image-post-file-input'
                                                accept='.png, .jpg, .jpeg, .gif'
                                                onChange={addImageFiles}
                                                multiple
                                                hidden
                                            />
                                        </label>
                                    </Row>
                                    <p>or paste an image URL:</p>
                                    <Row style={{ marginTop: 5 }}>
                                        <Input
                                            type='text'
                                            placeholder='image url...'
                                            value={imageURL}
                                            onChange={(v) => setImageURL(v)}
                                            style={{ margin: '0 10px 10px 0' }}
                                        />
                                        <Button
                                            text='Add'
                                            color='aqua'
                                            disabled={imageURL === ''}
                                            onClick={addImageURL}
                                        />
                                    </Row>
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column
                                    centerX
                                    style={{ width: '100%', maxWidth: 500, marginBottom: 30 }}
                                >
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={imageForm.text.value}
                                        onChange={(value) => {
                                            setImageForm({
                                                ...imageForm,
                                                text: {
                                                    ...imageForm.text,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }}
                                        state={imageForm.text.state}
                                        errors={imageForm.text.errors}
                                    />
                                </Column>
                            )}
                        </Column>
                    )}

                    {postType === 'Audio' && (
                        <Column centerX style={{ width: '100%' }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ width: '100%' }}>
                                    <Column className={styles.errors}>
                                        {audioSizeError && (
                                            <p>Audio too large. Max size: {audioMBLimit}MB</p>
                                        )}
                                        {audioPostError && (
                                            <p>Audio recording or upload required</p>
                                        )}
                                    </Column>
                                    <Row style={{ marginBottom: 20 }}>
                                        <Button
                                            text='Record audio'
                                            color='blue'
                                            style={{ marginRight: 10 }}
                                            onClick={() => {
                                                resetAudioState()
                                                setAudioSizeError(false)
                                                setShowRecordControls(true)
                                            }}
                                        />
                                        <Row className={styles.fileUploadInput}>
                                            <label htmlFor='audio-file-input'>
                                                Upload audio
                                                <input
                                                    type='file'
                                                    id='audio-file-input'
                                                    accept='.mp3'
                                                    onChange={selectAudioFile}
                                                    hidden
                                                />
                                            </label>
                                        </Row>
                                    </Row>
                                    {audioFile && (
                                        <Column
                                            key={audioFile.lastModified}
                                            style={{ width: '100%', marginBottom: 20 }}
                                        >
                                            <p>{audioFile.name}</p>
                                            <AudioVisualiser
                                                audioElementId='new-post-audio'
                                                audioURL={URL.createObjectURL(audioFile)}
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
                                                    audioElementId='new-post-audio'
                                                    audioURL={URL.createObjectURL(audioFile)}
                                                    location='preview'
                                                    onPlay={() => setAudioPlaying(true)}
                                                    onPause={() => setAudioPlaying(false)}
                                                    onEnded={() => setAudioPlaying(false)}
                                                />
                                            </Row>
                                        </Column>
                                    )}
                                    {showRecordControls && (
                                        <Column centerX style={{ marginBottom: 20 }}>
                                            <h2>{formatTimeMMSS(recordingTime)}</h2>
                                            <Button
                                                text={`${
                                                    recording
                                                        ? 'Stop'
                                                        : `${audioFile ? 'Restart' : 'Start'}`
                                                } recording`}
                                                color={recording ? 'red' : 'aqua'}
                                                onClick={toggleAudioRecording}
                                            />
                                        </Column>
                                    )}
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column centerX style={{ maxWidth: 500, marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={audioForm.text.value}
                                        onChange={(value) => {
                                            setAudioForm({
                                                ...audioForm,
                                                text: {
                                                    ...audioForm.text,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }}
                                        state={audioForm.text.state}
                                        errors={audioForm.text.errors}
                                    />
                                </Column>
                            )}
                        </Column>
                    )}

                    {postType === 'Event' && (
                        <Column centerX style={{ width: '100%' }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <Input
                                        type='text'
                                        placeholder='Add a title for your event...'
                                        value={eventForm1.title.value}
                                        state={eventForm1.title.state}
                                        errors={eventForm1.title.errors}
                                        onChange={(value) =>
                                            setEventForm1({
                                                ...eventForm1,
                                                title: {
                                                    ...eventForm1.title,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }
                                    />
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column centerX style={{ maxWidth: 500, marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={eventForm2.description.value}
                                        onChange={(value) => {
                                            setEventForm2({
                                                ...eventForm2,
                                                description: {
                                                    ...eventForm2.description,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }}
                                        state={eventForm2.description.state}
                                        errors={eventForm2.description.errors}
                                    />
                                </Column>
                            )}
                            {currentStep === 4 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <Row className={styles.dateTimePicker}>
                                        <div id='date-time-start-wrapper'>
                                            <Input
                                                id='date-time-start'
                                                title='Start time'
                                                type='text'
                                                placeholder='select start time...'
                                                state={eventForm3.startTime.state}
                                                errors={eventForm3.startTime.errors}
                                            />
                                        </div>
                                        <div id='date-time-end-wrapper'>
                                            <Input
                                                id='date-time-end'
                                                title='End time (optional)'
                                                type='text'
                                                placeholder='select end time...'
                                                state={eventForm3.endTime.state}
                                                errors={eventForm3.endTime.errors}
                                            />
                                        </div>
                                    </Row>
                                    {duration && <p>Duration: {duration}</p>}
                                </Column>
                            )}
                        </Column>
                    )}

                    {postType === 'Inquiry' && (
                        <Column centerX style={{ width: '100%' }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Title</p>
                                    <Input
                                        type='text'
                                        placeholder='Add a title...'
                                        value={inquiryForm1.title.value}
                                        state={inquiryForm1.title.state}
                                        errors={inquiryForm1.title.errors}
                                        onChange={(value) =>
                                            setInquiryForm1({
                                                ...inquiryForm1,
                                                title: {
                                                    ...inquiryForm1.title,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }
                                        style={{ maxWidth: 400 }}
                                    />
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column centerX style={{ maxWidth: 500, marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={inquiryForm2.description.value}
                                        onChange={(value) => {
                                            setInquiryForm2({
                                                ...inquiryForm2,
                                                description: {
                                                    ...inquiryForm2.description,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }}
                                        state={inquiryForm2.description.state}
                                        errors={inquiryForm2.description.errors}
                                    />
                                </Column>
                            )}
                            {currentStep === 4 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Settings</p>
                                    <Row>
                                        <Button
                                            text='Single choice'
                                            color={
                                                inquiryType === 'single-choice' ? 'blue' : 'grey'
                                            }
                                            onClick={() => setInquiryType('single-choice')}
                                            style={{
                                                marginRight: 10,
                                                marginBottom: 10,
                                            }}
                                        />
                                        <Button
                                            text='Multiple choice'
                                            color={
                                                inquiryType === 'multiple-choice' ? 'blue' : 'grey'
                                            }
                                            onClick={() => setInquiryType('multiple-choice')}
                                            style={{
                                                marginRight: 10,
                                                marginBottom: 10,
                                            }}
                                        />
                                        <Button
                                            text='Weighted choice'
                                            color={
                                                inquiryType === 'weighted-choice' ? 'blue' : 'grey'
                                            }
                                            onClick={() => setInquiryType('weighted-choice')}
                                            style={{
                                                marginRight: 10,
                                                marginBottom: 10,
                                            }}
                                        />
                                    </Row>
                                    <Row
                                        centerX
                                        style={{
                                            maxWidth: 400,
                                            textAlign: 'center',
                                            marginBottom: 30,
                                        }}
                                    >
                                        {inquiryType === 'single-choice' && (
                                            <p>
                                                <i>Participants can only select one answer</i>
                                            </p>
                                        )}
                                        {inquiryType === 'multiple-choice' && (
                                            <p>
                                                <i>Participants can select multiple answers</i>
                                            </p>
                                        )}
                                        {inquiryType === 'weighted-choice' && (
                                            <p>
                                                <i>
                                                    Participants each have 100 points which can be
                                                    spread across answers in proportion to their
                                                    preference
                                                </i>
                                            </p>
                                        )}
                                    </Row>
                                    {/* <Column
                                        centerX
                                        className={styles.dateTimePicker}
                                        style={{ maxWidth: 400, margin: 0 }}
                                    >
                                        <p style={{ marginBottom: 10 }}>
                                            Choose an end time for the inquiry after which voting is
                                            locked (optional):
                                        </p>
                                        <div id='date-time-end-wrapper'>
                                            <Input
                                                id='date-time-end'
                                                type='text'
                                                placeholder='end time...'
                                                state={inquiryForm3.endTime.state}
                                                errors={inquiryForm3.endTime.errors}
                                            />
                                        </div>
                                    </Column> */}
                                </Column>
                            )}
                            {currentStep === 5 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Answers</p>
                                    {/* <Row centerY style={{ marginBottom: 30 }}>
                                        <p>Allow participants to add their own answers:</p>
                                        <Toggle
                                            leftText='No'
                                            rightText='Yes'
                                            rightColor='blue'
                                            positionLeft={answersLocked}
                                            onClick={() => {
                                                if (answersLocked) setAnswersError(false)
                                                setAnswersLocked(!answersLocked)
                                            }}
                                            style={{ marginLeft: 20 }}
                                        />
                                    </Row> */}
                                    <Row style={{ width: '100%', marginBottom: 20 }}>
                                        <Input
                                            type='text'
                                            placeholder='New answer...'
                                            value={newAnswer}
                                            onChange={(value) => setNewAnswer(value)}
                                            style={{ width: '100%', marginRight: 10 }}
                                        />
                                        <Button
                                            color='blue'
                                            text='Add'
                                            onClick={() => {
                                                setAnswers([
                                                    ...answers,
                                                    {
                                                        id: uuidv4(),
                                                        text: newAnswer,
                                                        Reactions: [],
                                                    },
                                                ])
                                                setNewAnswer('')
                                                setAnswersError(false)
                                            }}
                                        />
                                    </Row>
                                    <Column style={{ maxWidth: 600 }}>
                                        {answers.map((answer, index) => (
                                            <InquiryAnswer
                                                key={answer.id}
                                                index={index}
                                                type={inquiryType}
                                                answer={answer}
                                                totalVotes={0}
                                                totalPoints={0}
                                                color={colorScale(index)}
                                                close={() =>
                                                    setAnswers(
                                                        answers.filter((a) => a.id !== answer.id)
                                                    )
                                                }
                                                preview
                                            />
                                        ))}
                                    </Column>
                                    {answersError && (
                                        <p className='danger'>At least one answer required</p>
                                    )}
                                </Column>
                            )}
                        </Column>
                    )}

                    {postType === 'Glass Bead Game' && (
                        <Column centerX style={{ width: '100%' }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ maxWidth: 500, marginBottom: 20 }}>
                                    <h3 style={{ marginBottom: 10 }}>Choose a topic:</h3>
                                    <Row className={styles.topicGroupButtons}>
                                        <Button
                                            text='Archetopics'
                                            color={topicGroup === 'archetopics' ? 'blue' : 'grey'}
                                            onClick={() => {
                                                setGBGForm1({
                                                    ...GBGForm1,
                                                    topic: {
                                                        ...GBGForm1.topic,
                                                        value: '',
                                                        state: 'default',
                                                    },
                                                })
                                                setSelectedTopic(null)
                                                setTopicError(false)
                                                setTopicGroup('archetopics')
                                            }}
                                        />
                                        <Button
                                            text='Liminal'
                                            color={topicGroup === 'liminal' ? 'blue' : 'grey'}
                                            onClick={() => {
                                                setGBGForm1({
                                                    ...GBGForm1,
                                                    topic: {
                                                        ...GBGForm1.topic,
                                                        value: '',
                                                        state: 'default',
                                                    },
                                                })
                                                setSelectedTopic(null)
                                                setTopicError(false)
                                                setTopicGroup('liminal')
                                            }}
                                        />
                                        <Button
                                            text='Custom'
                                            color={topicGroup === 'custom' ? 'blue' : 'grey'}
                                            onClick={() => {
                                                setGBGForm1({
                                                    ...GBGForm1,
                                                    topic: {
                                                        ...GBGForm1.topic,
                                                        value: '',
                                                        state: 'default',
                                                    },
                                                })
                                                setTopicError(false)
                                                setSelectedTopic(null)
                                                setTopicGroup('custom')
                                            }}
                                        />
                                    </Row>

                                    {topicGroup === 'custom' ? (
                                        <Input
                                            type='text'
                                            placeholder='Custom topic...'
                                            value={GBGForm1.topic.value}
                                            state={GBGForm1.topic.state}
                                            errors={GBGForm1.topic.errors}
                                            onChange={(value) =>
                                                setGBGForm1({
                                                    ...GBGForm1,
                                                    topic: {
                                                        ...GBGForm1.topic,
                                                        value,
                                                        state: 'default',
                                                    },
                                                })
                                            }
                                            style={{ marginBottom: 15 }}
                                        />
                                    ) : (
                                        <Scrollbars className={styles.topics}>
                                            <Row
                                                wrap
                                                centerX
                                                style={{ width: '100%', height: 280 }}
                                            >
                                                {GlassBeadGameTopics[topicGroup].map((topic) => (
                                                    <Column
                                                        centerX
                                                        className={styles.topic}
                                                        key={topic.name}
                                                    >
                                                        <button
                                                            type='button'
                                                            className={
                                                                selectedTopic &&
                                                                selectedTopic.name === topic.name
                                                                    ? styles.selected
                                                                    : ''
                                                            }
                                                            onClick={() => {
                                                                setTopicError(false)
                                                                setSelectedTopic(topic)
                                                                setGBGForm1({
                                                                    ...GBGForm1,
                                                                    topic: {
                                                                        ...GBGForm1.topic,
                                                                        value: topic.name,
                                                                        state: 'default',
                                                                    },
                                                                })
                                                            }}
                                                        >
                                                            <img src={topic.imagePath} alt='' />
                                                        </button>
                                                        <p>{topic.name}</p>
                                                    </Column>
                                                ))}
                                            </Row>
                                        </Scrollbars>
                                    )}
                                    {topicError && <p className='danger'>No topic selected</p>}
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column centerX style={{ maxWidth: 500, marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={GBGForm2.description.value}
                                        onChange={(value) => {
                                            setGBGForm2({
                                                ...GBGForm2,
                                                description: {
                                                    ...GBGForm2.description,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }}
                                        state={GBGForm2.description.state}
                                        errors={GBGForm2.description.errors}
                                    />
                                </Column>
                            )}
                            {currentStep === 4 && (
                                <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                                    <Row className={styles.dateTimePicker}>
                                        <div id='date-time-start-wrapper'>
                                            <Input
                                                id='date-time-start'
                                                title='Start time (optional)'
                                                type='text'
                                                placeholder='select start time...'
                                                state={GBGForm3.startTime.state}
                                                errors={GBGForm3.startTime.errors}
                                            />
                                        </div>
                                        <div id='date-time-end-wrapper'>
                                            <Input
                                                id='date-time-end'
                                                title='End time (optional)'
                                                type='text'
                                                placeholder='select end time...'
                                                state={GBGForm3.endTime.state}
                                                errors={GBGForm3.endTime.errors}
                                            />
                                        </div>
                                    </Row>
                                    {duration && <p>Duration: {duration}</p>}
                                </Column>
                            )}
                        </Column>
                    )}

                    {postType === 'String' && (
                        <Column centerX style={{ width: '100%' }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ width: '100%', maxWidth: 700 }}>
                                    <Column centerX>
                                        {stringPostError && (
                                            <p className='danger' style={{ marginBottom: 20 }}>
                                                No beads added to string
                                            </p>
                                        )}
                                        {stringSizeError && (
                                            <p className='danger' style={{ marginBottom: 20 }}>
                                                Total string upload size must be less than{' '}
                                                {totalMBUploadLimit}
                                                MB. (Current size: {totalStringSize().toFixed(2)}MB)
                                            </p>
                                        )}
                                    </Column>
                                    <Row centerX className={styles.beadTypeButtons}>
                                        <button
                                            type='button'
                                            className={`${
                                                newBead.type === 'text' && styles.selected
                                            }`}
                                            onClick={() => setNewBead({ ...newBead, type: 'text' })}
                                        >
                                            <TextIcon />
                                        </button>
                                        <button
                                            type='button'
                                            className={`${
                                                newBead.type === 'url' && styles.selected
                                            }`}
                                            onClick={() => setNewBead({ ...newBead, type: 'url' })}
                                        >
                                            <UrlIcon />
                                        </button>
                                        <button
                                            type='button'
                                            className={`${
                                                newBead.type === 'audio' && styles.selected
                                            }`}
                                            onClick={() =>
                                                setNewBead({ ...newBead, type: 'audio' })
                                            }
                                        >
                                            <AudioIcon />
                                        </button>
                                        <button
                                            type='button'
                                            className={`${
                                                newBead.type === 'image' && styles.selected
                                            }`}
                                            onClick={() =>
                                                setNewBead({ ...newBead, type: 'image' })
                                            }
                                        >
                                            <ImageIcon />
                                        </button>
                                    </Row>
                                    <Column centerX style={{ width: '100%' }}>
                                        {newBead.type === 'text' && (
                                            <MarkdownEditor
                                                key={newBead.id}
                                                initialValue={newBead.text}
                                                onChange={(value) => {
                                                    setStringTextErrors([])
                                                    setStringTextState('default')
                                                    setNewBead({ ...newBead, text: value })
                                                }}
                                                state={stringTextState}
                                                errors={stringTextErrors}
                                            />
                                        )}
                                        {newBead.type === 'url' && (
                                            <Column centerX style={{ width: '100%' }}>
                                                <Input
                                                    type='text'
                                                    placeholder='url...'
                                                    // state={newBead.url.state}
                                                    // errors={newBead.url.errors}
                                                    value={newBead.url}
                                                    loading={urlLoading}
                                                    onChange={(value) => {
                                                        setNewBead({ ...newBead, url: value })
                                                        scrapeURL(value)
                                                    }}
                                                    style={{ width: '100%' }}
                                                />
                                                {newBead.urlData && (
                                                    <PostCardUrlPreview
                                                        url={newBead.url}
                                                        image={newBead.urlData.image}
                                                        domain={newBead.urlData.domain}
                                                        title={newBead.urlData.title}
                                                        description={newBead.urlData.description}
                                                        style={{ marginTop: 10 }}
                                                    />
                                                )}
                                            </Column>
                                        )}
                                        {newBead.type === 'audio' && (
                                            <Column centerX style={{ width: '100%' }}>
                                                <Row style={{ marginBottom: 10 }}>
                                                    <Button
                                                        text='Record audio'
                                                        color='grey'
                                                        style={{ marginRight: 10 }}
                                                        onClick={() => {
                                                            resetAudioState()
                                                            setAudioSizeError(false)
                                                            setShowRecordControls(true)
                                                        }}
                                                    />
                                                    <Row className={styles.beadUploadInput}>
                                                        <label htmlFor='audio-file-input'>
                                                            Upload audio
                                                            <input
                                                                type='file'
                                                                id='audio-file-input'
                                                                accept='.mp3'
                                                                onChange={selectAudioFile}
                                                                hidden
                                                            />
                                                        </label>
                                                    </Row>
                                                </Row>
                                                {newBead.audioFile && (
                                                    <Column
                                                        key={newBead.audioFile.lastModified}
                                                        style={{ marginBottom: 20, width: '100%' }}
                                                    >
                                                        <p>{newBead.audioFile.name}</p>
                                                        <AudioVisualiser
                                                            audioElementId='new-post-audio'
                                                            audioURL={URL.createObjectURL(
                                                                newBead.audioFile
                                                            )}
                                                            staticBars={1200}
                                                            staticColor={
                                                                colors.audioVisualiserColor
                                                            }
                                                            dynamicBars={160}
                                                            dynamicColor={
                                                                colors.audioVisualiserColor
                                                            }
                                                            style={{
                                                                height: 80,
                                                                margin: '20px 0 10px 0',
                                                            }}
                                                        />
                                                        <Row centerY>
                                                            <button
                                                                className={styles.playButton}
                                                                type='button'
                                                                aria-label='toggle-audio'
                                                                onClick={toggleAudio}
                                                            >
                                                                {audioPlaying ? (
                                                                    <PauseIcon />
                                                                ) : (
                                                                    <PlayIcon />
                                                                )}
                                                            </button>
                                                            <AudioTimeSlider
                                                                audioElementId='new-post-audio'
                                                                audioURL={URL.createObjectURL(
                                                                    newBead.audioFile
                                                                )}
                                                                location='preview'
                                                                onPlay={() => setAudioPlaying(true)}
                                                                onPause={() =>
                                                                    setAudioPlaying(false)
                                                                }
                                                                onEnded={() =>
                                                                    setAudioPlaying(false)
                                                                }
                                                            />
                                                        </Row>
                                                    </Column>
                                                )}
                                                {showRecordControls && (
                                                    <Column centerX style={{ marginBottom: 20 }}>
                                                        <h2>{formatTimeMMSS(recordingTime)}</h2>
                                                        <Button
                                                            text={`${
                                                                recording
                                                                    ? 'Stop'
                                                                    : `${
                                                                          audioFile
                                                                              ? 'Restart'
                                                                              : 'Start'
                                                                      }`
                                                            } recording`}
                                                            color={recording ? 'red' : 'blue'}
                                                            onClick={toggleAudioRecording}
                                                        />
                                                    </Column>
                                                )}
                                            </Column>
                                        )}
                                        {newBead.type === 'image' && (
                                            <Column centerX style={{ width: '100%' }}>
                                                {imagePostError && (
                                                    <p
                                                        className='danger'
                                                        style={{ marginBottom: 10 }}
                                                    >
                                                        No images added yet
                                                    </p>
                                                )}
                                                <Row centerX style={{ width: '100%' }}>
                                                    {images.length > 0 && (
                                                        <Scrollbars
                                                            className={`${styles.images} row`}
                                                        >
                                                            {images.map((image, index) => (
                                                                <Column
                                                                    className={styles.image}
                                                                    key={index}
                                                                >
                                                                    <CloseButton
                                                                        size={20}
                                                                        onClick={() =>
                                                                            removeImage(index)
                                                                        }
                                                                    />
                                                                    <img
                                                                        src={
                                                                            image.url ||
                                                                            URL.createObjectURL(
                                                                                image.file
                                                                            )
                                                                        }
                                                                        alt=''
                                                                    />
                                                                    {image.caption && (
                                                                        <p>{image.caption}</p>
                                                                    )}
                                                                    <Row
                                                                        centerY
                                                                        style={{ width: 180 }}
                                                                    >
                                                                        <Input
                                                                            type='text'
                                                                            placeholder={`${
                                                                                image.caption
                                                                                    ? 'change'
                                                                                    : 'add'
                                                                            } caption...`}
                                                                            value={image.newCaption}
                                                                            onChange={(v) =>
                                                                                updateNewCaption(
                                                                                    index,
                                                                                    v
                                                                                )
                                                                            }
                                                                            style={{
                                                                                marginRight: 5,
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            icon={<PlusIcon />}
                                                                            color='grey'
                                                                            onClick={() =>
                                                                                updateCaption(index)
                                                                            }
                                                                            style={{
                                                                                padding: '0 10px',
                                                                            }}
                                                                        />
                                                                    </Row>
                                                                </Column>
                                                            ))}
                                                        </Scrollbars>
                                                    )}
                                                </Row>
                                                {imageSizeError && (
                                                    <p
                                                        className='danger'
                                                        style={{ marginBottom: 10 }}
                                                    >
                                                        Max file size: {imageMBLimit}MB
                                                    </p>
                                                )}
                                                {toalImageSizeError && (
                                                    <p
                                                        className='danger'
                                                        style={{ marginBottom: 10 }}
                                                    >
                                                        Total image upload size must be less than{' '}
                                                        {totalMBUploadLimit}MB. (Current size:{' '}
                                                        {totalImageSize.toFixed(2)}MB)
                                                    </p>
                                                )}
                                                <Row className={styles.beadUploadInput}>
                                                    <label htmlFor='image-post-file-input'>
                                                        Upload images
                                                        <input
                                                            type='file'
                                                            id='image-post-file-input'
                                                            accept='.png, .jpg, .jpeg, .gif'
                                                            onChange={addImageFiles}
                                                            multiple
                                                            hidden
                                                        />
                                                    </label>
                                                </Row>
                                                <p>or paste an image URL:</p>
                                                <Row style={{ width: '100%', marginTop: 5 }}>
                                                    <Input
                                                        type='text'
                                                        placeholder='image url...'
                                                        value={imageURL}
                                                        onChange={(v) => setImageURL(v)}
                                                        style={{ margin: '0 10px 10px 0' }}
                                                    />
                                                    <Button
                                                        text='Add'
                                                        color='grey'
                                                        disabled={imageURL === ''}
                                                        onClick={addImageURL}
                                                    />
                                                </Row>
                                            </Column>
                                        )}
                                        <Row centerY className={styles.colorButtons}>
                                            {beadColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type='button'
                                                    aria-label='color'
                                                    onClick={() =>
                                                        setNewBead({ ...newBead, color })
                                                    }
                                                    className={`${
                                                        newBead.color === color && styles.selected
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </Row>
                                        <Button
                                            text='Add bead'
                                            color='aqua'
                                            disabled={
                                                (newBead.type === 'text' &&
                                                    newBead.text.length < 1) ||
                                                (newBead.type === 'url' &&
                                                    (newBead.urlData === null || urlLoading)) ||
                                                (newBead.type === 'audio' &&
                                                    newBead.audioFile === null) ||
                                                (newBead.type === 'image' && !images.length)
                                            }
                                            onClick={addBeadToString}
                                            style={{ margin: '20px 0' }}
                                        />
                                    </Column>
                                    {string.length > 0 && (
                                        <Scrollbars className={`${styles.beadDraw} row`}>
                                            {string.map((bead, index) => (
                                                <Row key={bead.id}>
                                                    <Column>
                                                        <StringBeadCard
                                                            bead={
                                                                bead.role === 'source'
                                                                    ? bead
                                                                    : formatBeadData(bead, index)
                                                            }
                                                            beadIndex={index}
                                                            location='create-string-modal'
                                                            removeBead={removeBead}
                                                            style={{
                                                                marginRight:
                                                                    string.length > 2 &&
                                                                    index === string.length - 1
                                                                        ? 7
                                                                        : 0,
                                                            }}
                                                        />
                                                        <Row centerX className={styles.itemFooter}>
                                                            {(string[0].role === 'source'
                                                                ? index > 1
                                                                : index > 0) && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        moveBead(index, -1)
                                                                    }
                                                                >
                                                                    <ChevronLeftIcon />
                                                                </button>
                                                            )}
                                                            {(string[0].role === 'source'
                                                                ? index > 0 &&
                                                                  index < string.length - 1
                                                                : index < string.length - 1) && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        moveBead(index, 1)
                                                                    }
                                                                >
                                                                    <ChevronRightIcon />
                                                                </button>
                                                            )}
                                                        </Row>
                                                    </Column>
                                                    {index < string.length - 1 && (
                                                        <Row centerY className={styles.beadDivider}>
                                                            <DNAIcon />
                                                        </Row>
                                                    )}
                                                </Row>
                                            ))}
                                            <span
                                                style={{ marginLeft: -7, width: 7, flexShrink: 0 }}
                                            />
                                        </Scrollbars>
                                    )}
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column centerX style={{ maxWidth: 500, marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={stringForm.description.value}
                                        onChange={(value) => {
                                            setStringForm({
                                                ...stringForm,
                                                description: {
                                                    ...stringForm.description,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }}
                                        state={stringForm.description.state}
                                        errors={stringForm.description.errors}
                                    />
                                </Column>
                            )}
                        </Column>
                    )}

                    {postType === 'Weave' && (
                        <Column centerX style={{ width: '100%' }}>
                            {currentStep === 2 && (
                                <Column centerX style={{ maxWidth: 500, marginBottom: 30 }}>
                                    <p style={{ marginBottom: 20 }}>Description (optional):</p>
                                    <MarkdownEditor
                                        initialValue={multiplayerStringForm1.description.value}
                                        onChange={(value) => {
                                            setMultiplayerStringForm1({
                                                ...multiplayerStringForm1,
                                                description: {
                                                    ...multiplayerStringForm1.description,
                                                    value,
                                                    state: 'default',
                                                },
                                            })
                                        }}
                                        state={multiplayerStringForm1.description.state}
                                        errors={multiplayerStringForm1.description.errors}
                                    />
                                </Column>
                            )}
                            {currentStep === 3 && (
                                <Column centerX style={{ width: '100%' }}>
                                    <p>Choose who else you want to be able to join the game:</p>
                                    <Toggle
                                        leftText='Anyone'
                                        rightText='Only specified users'
                                        rightColor='blue'
                                        positionLeft={allUsersAllowed}
                                        onClick={() => {
                                            if (!allUsersAllowed) {
                                                setSelectedUsersError(false)
                                                setSelectedUsers([
                                                    {
                                                        id: accountData.id,
                                                        handle: accountData.handle,
                                                        name: accountData.name,
                                                        flagImagePath: accountData.flagImagePath,
                                                    },
                                                ])
                                            }
                                            setAllUsersAllowed(!allUsersAllowed)
                                        }}
                                        style={{ margin: '40px 0 20px 0' }}
                                    />
                                    {!allUsersAllowed && (
                                        <Column centerX>
                                            <SearchSelector
                                                type='user'
                                                placeholder='Search for users...'
                                                onSearchQuery={(query) => findUsers(query)}
                                                onOptionSelected={(space) => addUser(space)}
                                                options={userOptions}
                                                loading={userSearchLoading}
                                                style={{ width: '100%', margin: '20px 0 30px 0' }}
                                            />
                                            {selectedUsers.length > 1 && (
                                                <Column centerX style={{ marginBottom: 20 }}>
                                                    {selectedUsers
                                                        .filter((u) => u.id !== accountData.id)
                                                        .map((user) => (
                                                            <Row
                                                                key={user.id}
                                                                centerY
                                                                style={{ margin: '0 10px 10px 0' }}
                                                            >
                                                                <ImageTitle
                                                                    type='space'
                                                                    imagePath={user.flagImagePath}
                                                                    title={`${user.name} (${user.handle})`}
                                                                    imageSize={35}
                                                                    fontSize={16}
                                                                    style={{ marginRight: 5 }}
                                                                />
                                                                <CloseButton
                                                                    size={17}
                                                                    onClick={() =>
                                                                        removeUser(user.id)
                                                                    }
                                                                />
                                                            </Row>
                                                        ))}
                                                </Column>
                                            )}
                                            {selectedUsersError && (
                                                <p className='danger'>Other users required</p>
                                            )}
                                        </Column>
                                    )}
                                </Column>
                            )}
                            {currentStep === 4 && (
                                <Column centerX style={{ width: '100%', marginBottom: 20 }}>
                                    <p>Game settings</p>
                                    <Row centerY style={{ margin: '30px 0 20px 0' }}>
                                        {allUsersAllowed ? (
                                            <Input
                                                type='text'
                                                title='Total moves:'
                                                value={multiplayerStringForm2.numberOfMoves.value}
                                                state={multiplayerStringForm2.numberOfMoves.state}
                                                errors={multiplayerStringForm2.numberOfMoves.errors}
                                                onChange={(value) =>
                                                    setMultiplayerStringForm2({
                                                        ...multiplayerStringForm2,
                                                        numberOfMoves: {
                                                            ...multiplayerStringForm2.numberOfMoves,
                                                            value: +value,
                                                            state: 'default',
                                                        },
                                                    })
                                                }
                                            />
                                        ) : (
                                            <Input
                                                type='text'
                                                title='Moves per player:'
                                                value={multiplayerStringForm3.numberOfTurns.value}
                                                state={multiplayerStringForm3.numberOfTurns.state}
                                                errors={multiplayerStringForm3.numberOfTurns.errors}
                                                onChange={(value) =>
                                                    setMultiplayerStringForm3({
                                                        ...multiplayerStringForm3,
                                                        numberOfTurns: {
                                                            ...multiplayerStringForm3.numberOfTurns,
                                                            value: +value,
                                                            state: 'default',
                                                        },
                                                    })
                                                }
                                            />
                                        )}
                                    </Row>
                                    <Column centerX style={{ marginBottom: 10 }}>
                                        <p>Allowed bead types:</p>
                                        <Row wrap centerX style={{ marginTop: 10 }}>
                                            <CheckBox
                                                text='Text'
                                                checked={allowedBeadTypes.includes('Text')}
                                                onChange={(c) => updateAllowedBeadTypes('Text', c)}
                                                style={{ marginRight: 10, marginBottom: 10 }}
                                            />
                                            <CheckBox
                                                text='Url'
                                                checked={allowedBeadTypes.includes('Url')}
                                                onChange={(checked) =>
                                                    updateAllowedBeadTypes('Url', checked)
                                                }
                                                style={{ marginRight: 10, marginBottom: 10 }}
                                            />
                                            <CheckBox
                                                text='Audio'
                                                checked={allowedBeadTypes.includes('Audio')}
                                                onChange={(checked) =>
                                                    updateAllowedBeadTypes('Audio', checked)
                                                }
                                                style={{ marginRight: 10, marginBottom: 10 }}
                                            />
                                            <CheckBox
                                                text='Image'
                                                checked={allowedBeadTypes.includes('Image')}
                                                onChange={(checked) =>
                                                    updateAllowedBeadTypes('Image', checked)
                                                }
                                                style={{ marginBottom: 10 }}
                                            />
                                        </Row>
                                    </Column>
                                    {!allUsersAllowed && (
                                        <Column centerX>
                                            <p>Player order:</p>
                                            <Column style={{ marginTop: 10 }}>
                                                {selectedUsers.map((user, index) => (
                                                    <Row
                                                        key={user.id}
                                                        centerY
                                                        style={{ margin: '0 10px 10px 0' }}
                                                    >
                                                        <button
                                                            type='button'
                                                            className={`${styles.position} ${
                                                                playerColorsOn && styles.clickable
                                                            }`}
                                                            style={{
                                                                backgroundColor: playerColorsOn
                                                                    ? user.color
                                                                    : 'white',
                                                            }}
                                                            onClick={() =>
                                                                playerColorsOn &&
                                                                setSelectedPlayerId(user.id)
                                                            }
                                                        >
                                                            {index + 1}
                                                        </button>
                                                        <div className={styles.positionControls}>
                                                            {index > 0 && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        updatePlayerPosition(
                                                                            index,
                                                                            index - 1
                                                                        )
                                                                    }
                                                                >
                                                                    <ChevronUpIcon />
                                                                </button>
                                                            )}
                                                            {index < selectedUsers.length - 1 && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        updatePlayerPosition(
                                                                            index,
                                                                            index + 1
                                                                        )
                                                                    }
                                                                >
                                                                    <ChevronDownIcon />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <ImageTitle
                                                            type='space'
                                                            imagePath={user.flagImagePath}
                                                            title={`${user.name} (${user.handle})`}
                                                            imageSize={35}
                                                            fontSize={16}
                                                            style={{ marginRight: 5 }}
                                                        />
                                                    </Row>
                                                ))}
                                            </Column>
                                            {selectedPlayerId && (
                                                <Modal
                                                    centered
                                                    close={() => setSelectedPlayerId(null)}
                                                >
                                                    <h1>Choose the players color:</h1>
                                                    <Row centerY className={styles.colorButtons}>
                                                        {beadColors.map((color) => (
                                                            <button
                                                                key={color}
                                                                type='button'
                                                                aria-label='color'
                                                                onClick={() =>
                                                                    changePlayerColor(color)
                                                                }
                                                                style={{
                                                                    backgroundColor: color,
                                                                }}
                                                            />
                                                        ))}
                                                    </Row>
                                                </Modal>
                                            )}
                                        </Column>
                                    )}
                                    {!allowedBeadTypes.length && (
                                        <p className='danger' style={{ marginTop: 10 }}>
                                            At least one bead type must be allowed
                                        </p>
                                    )}
                                    {!allUsersAllowed && (
                                        <Row centerY style={{ margin: '10px 0' }}>
                                            <p>Fix player colors:</p>
                                            <Toggle
                                                leftText='Off'
                                                rightText='On'
                                                rightColor='blue'
                                                positionLeft={!playerColorsOn}
                                                onClick={() => togglePlayerColors()}
                                                style={{ marginLeft: 20 }}
                                            />
                                        </Row>
                                    )}
                                    {allowedBeadTypes.includes('Text') && (
                                        <Column centerX style={{ marginTop: 20 }}>
                                            <Row centerY style={{ marginBottom: 10 }}>
                                                <p>Character limit:</p>
                                                <Toggle
                                                    leftText='Off'
                                                    rightText='On'
                                                    rightColor='blue'
                                                    positionLeft={!characterLimitOn}
                                                    onClick={() =>
                                                        setCharacterLimitOn(!characterLimitOn)
                                                    }
                                                    style={{ marginLeft: 20 }}
                                                />
                                            </Row>
                                            {characterLimitOn && (
                                                <Row
                                                    wrap
                                                    centerY
                                                    centerX
                                                    style={{ marginBottom: 10 }}
                                                >
                                                    <Button
                                                        text='140 chars'
                                                        color={
                                                            characterLimit === 140 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() => {
                                                            setCharacterLimitError(false)
                                                            setCharacterLimit(140)
                                                        }}
                                                        style={{
                                                            marginRight: 10,
                                                            marginBottom: 10,
                                                        }}
                                                    />
                                                    <Button
                                                        text='280 chars'
                                                        color={
                                                            characterLimit === 280 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() => {
                                                            setCharacterLimitError(false)
                                                            setCharacterLimit(280)
                                                        }}
                                                        style={{
                                                            marginRight: 10,
                                                            marginBottom: 10,
                                                        }}
                                                    />
                                                    <Row centerY style={{ marginBottom: 10 }}>
                                                        <Input
                                                            type='text'
                                                            value={characterLimit}
                                                            onChange={(v) => {
                                                                setCharacterLimitError(false)
                                                                setCharacterLimit(+v)
                                                            }}
                                                            style={{
                                                                width: 70,
                                                                marginRight: 10,
                                                            }}
                                                        />
                                                        <p>chars</p>
                                                    </Row>
                                                </Row>
                                            )}
                                        </Column>
                                    )}
                                    {allowedBeadTypes.includes('Text') &&
                                        characterLimitOn &&
                                        characterLimitError && (
                                            <p className='danger' style={{ marginBottom: 10 }}>
                                                Character limit must be between 1 and 1K
                                            </p>
                                        )}
                                    {allowedBeadTypes.includes('Audio') && (
                                        <Column centerX style={{ marginTop: 20 }}>
                                            <Row centerY style={{ marginBottom: 10 }}>
                                                <p>Audio time limit:</p>
                                                <Toggle
                                                    leftText='Off'
                                                    rightText='On'
                                                    rightColor='blue'
                                                    positionLeft={!audioTimeLimitOn}
                                                    onClick={() =>
                                                        setAudioTimeLimitOn(!audioTimeLimitOn)
                                                    }
                                                    style={{ marginLeft: 20 }}
                                                />
                                            </Row>
                                            {audioTimeLimitOn && (
                                                <Row
                                                    wrap
                                                    centerY
                                                    centerX
                                                    style={{ marginBottom: 10 }}
                                                >
                                                    <Button
                                                        text='1 min'
                                                        color={
                                                            audioTimeLimit === 60 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() => {
                                                            setAudioTimeLimitError(false)
                                                            setAudioTimeLimit(60)
                                                        }}
                                                        style={{
                                                            marginRight: 10,
                                                            marginBottom: 10,
                                                        }}
                                                    />
                                                    <Button
                                                        text='2 min'
                                                        color={
                                                            audioTimeLimit === 120 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() => {
                                                            setAudioTimeLimitError(false)
                                                            setAudioTimeLimit(120)
                                                        }}
                                                        style={{
                                                            marginRight: 10,
                                                            marginBottom: 10,
                                                        }}
                                                    />
                                                    <Button
                                                        text='3 min'
                                                        color={
                                                            audioTimeLimit === 180 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() => {
                                                            setAudioTimeLimitError(false)
                                                            setAudioTimeLimit(180)
                                                        }}
                                                        style={{
                                                            marginRight: 20,
                                                            marginBottom: 10,
                                                        }}
                                                    />
                                                    <Row centerY style={{ marginBottom: 10 }}>
                                                        <Input
                                                            type='text'
                                                            value={audioTimeLimit}
                                                            onChange={(v) => {
                                                                setAudioTimeLimitError(false)
                                                                setAudioTimeLimit(+v)
                                                            }}
                                                            style={{
                                                                width: 70,
                                                                marginRight: 10,
                                                            }}
                                                        />
                                                        <p>seconds</p>
                                                    </Row>
                                                </Row>
                                            )}
                                        </Column>
                                    )}
                                    {allowedBeadTypes.includes('Audio') &&
                                        audioTimeLimitOn &&
                                        audioTimeLimitError && (
                                            <p className='danger' style={{ marginBottom: 10 }}>
                                                Audio time limit must be between 10 secs and 5 mins
                                            </p>
                                        )}
                                    {!allUsersAllowed && (
                                        <Column centerX style={{ marginTop: 20 }}>
                                            <Row centerY style={{ marginBottom: 10 }}>
                                                <p>Time window for moves:</p>
                                                <Toggle
                                                    leftText='Off'
                                                    rightText='On'
                                                    rightColor='blue'
                                                    positionLeft={!moveTimeWindowOn}
                                                    onClick={() =>
                                                        setMoveTimeWindowOn(!moveTimeWindowOn)
                                                    }
                                                    style={{ marginLeft: 20 }}
                                                />
                                            </Row>
                                            {moveTimeWindowOn && (
                                                <Column centerX style={{ marginBottom: 10 }}>
                                                    <Row
                                                        wrap
                                                        centerY
                                                        centerX
                                                        style={{ marginBottom: 10 }}
                                                    >
                                                        <Row
                                                            centerY
                                                            style={{
                                                                marginRight: 20,
                                                                marginBottom: 10,
                                                            }}
                                                        >
                                                            <Input
                                                                type='text'
                                                                value={moveTimeWindow.days}
                                                                onChange={(v) => {
                                                                    setMoveTimeWindowError(false)
                                                                    setMoveTimeWindow({
                                                                        ...moveTimeWindow,
                                                                        days: trimNumber(+v, 365),
                                                                    })
                                                                }}
                                                                style={{
                                                                    width: 60,
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                            <p>
                                                                day{pluralise(moveTimeWindow.days)}
                                                            </p>
                                                        </Row>
                                                        <Row
                                                            centerY
                                                            style={{
                                                                marginRight: 20,
                                                                marginBottom: 10,
                                                            }}
                                                        >
                                                            <Input
                                                                type='text'
                                                                value={moveTimeWindow.hours}
                                                                onChange={(v) => {
                                                                    setMoveTimeWindowError(false)
                                                                    setMoveTimeWindow({
                                                                        ...moveTimeWindow,
                                                                        hours: trimNumber(+v, 24),
                                                                    })
                                                                }}
                                                                style={{
                                                                    width: 60,
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                            <p>
                                                                hour
                                                                {pluralise(moveTimeWindow.hours)}
                                                            </p>
                                                        </Row>
                                                        <Row
                                                            centerY
                                                            style={{
                                                                marginRight: 20,
                                                                marginBottom: 10,
                                                            }}
                                                        >
                                                            <Input
                                                                type='text'
                                                                value={moveTimeWindow.minutes}
                                                                onChange={(v) => {
                                                                    setMoveTimeWindowError(false)
                                                                    setMoveTimeWindow({
                                                                        ...moveTimeWindow,
                                                                        minutes: trimNumber(+v, 60),
                                                                    })
                                                                }}
                                                                style={{
                                                                    width: 60,
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                            <p style={{ marginBottom: 10 }}>
                                                                minute
                                                                {pluralise(moveTimeWindow.minutes)}
                                                            </p>
                                                        </Row>
                                                    </Row>
                                                    {moveTimeWindowError && (
                                                        <p className='danger'>
                                                            The time window for moves must be
                                                            between 20 mins and 1 year
                                                        </p>
                                                    )}
                                                </Column>
                                            )}
                                        </Column>
                                    )}
                                </Column>
                            )}
                        </Column>
                    )}

                    {currentStep === steps.length - 1 && (
                        <Column centerX style={{ width: '100%' }}>
                            <p>Choose where you want the post to appear:</p>
                            <SearchSelector
                                type='space'
                                placeholder='space name or handle...'
                                onSearchQuery={(query) => findSpaces(query)}
                                onOptionSelected={(space) => addSpace(space)}
                                options={spaceOptions}
                                style={{ margin: '20px 0' }}
                            />
                            {selectedSpaces.length > 0 && (
                                <Row centerX wrap style={{ marginBottom: 20, maxWidth: 400 }}>
                                    {selectedSpaces.map((space) => (
                                        <Row
                                            key={space.id}
                                            centerY
                                            style={{ margin: '0 10px 10px 0' }}
                                        >
                                            <ImageTitle
                                                type='space'
                                                imagePath={space.flagImagePath}
                                                title={`${space.name} (${space.handle})`}
                                                imageSize={35}
                                                fontSize={16}
                                                style={{ marginRight: 5 }}
                                            />
                                            <CloseButton
                                                size={17}
                                                onClick={() => removeSpace(space.id)}
                                            />
                                        </Row>
                                    ))}
                                </Row>
                            )}
                            {selectedSpacesError && <p className='danger'>No spaces selected</p>}
                        </Column>
                    )}

                    {currentStep === steps.length && (
                        <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                            <p style={{ marginBottom: 30 }}>
                                Here&apos;s a preview of what your post will look like to other
                                users:
                            </p>
                            <Column className={styles.postPreviewWrapper}>
                                <PostCard location='preview' post={findPostData()} />
                            </Column>
                        </Column>
                    )}

                    <Row centerX style={{ margin: '10px 0 20px 0' }}>
                        {currentStep > 1 &&
                            (currentStep > 2 ||
                                createPostModalSettings.type !== 'string-from-post') && (
                                <Button
                                    text='Back'
                                    color='purple'
                                    disabled={urlLoading || loading}
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    style={{ marginRight: 10 }}
                                />
                            )}
                        {currentStep < steps.length && (
                            <Button
                                text='Next'
                                disabled={urlLoading}
                                color='blue'
                                onClick={moveForward}
                            />
                        )}
                        {currentStep === steps.length && (
                            <Button
                                text={`Create ${postType === 'Glass Bead Game' ? 'game' : 'post'}`}
                                disabled={loading}
                                loading={loading}
                                color='blue'
                                onClick={createPost}
                            />
                        )}
                    </Row>
                    <ProgressBarSteps steps={steps} currentStep={currentStep} />
                </Column>
            )}
        </Modal>
    )
}

export default CreatePostModal
