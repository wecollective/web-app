/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import React, { useContext, useState, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import axios from 'axios'
import Cookies from 'universal-cookie'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_green.css'
import { v4 as uuidv4 } from 'uuid'
import {
    allValid,
    defaultErrorState,
    isValidUrl,
    formatTimeMMSS,
    formatTimeDHM,
} from '@src/Helpers'
import { SpaceContext } from '@contexts/SpaceContext'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import styles from '@styles/components/modals/CreatePostModal.module.scss'
import colors from '@styles/Colors.module.scss'
import Modal from '@components/Modal'
import Column from '@components/Column'
import Row from '@components/Row'
import Input from '@components/Input'
import Button from '@components/Button'
import ProgressBarSteps from '@components/ProgressBarSteps'
import SuccessMessage from '@components/SuccessMessage'
import SearchSelector from '@components/SearchSelector'
import ImageTitle from '@components/ImageTitle'
import CloseButton from '@components/CloseButton'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import PostCardUrlPreview from '@components/Cards/PostCard/PostCardUrlPreview'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import Scrollbars from '@components/Scrollbars'
import StringBeadCard from '@components/Cards/StringBeadCard'
import PostCard from '@components/Cards/PostCard/PostCard'
import { ReactComponent as PlayIcon } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIcon } from '@svgs/pause-solid.svg'
import { ReactComponent as PlusIcon } from '@svgs/plus.svg'
import { ReactComponent as TextIcon } from '@svgs/font-solid.svg'
import { ReactComponent as UrlIcon } from '@svgs/link-solid.svg'
import { ReactComponent as ImageIcon } from '@svgs/image-solid.svg'
import { ReactComponent as AudioIcon } from '@svgs/volume-high-solid.svg'
import { ReactComponent as EventIcon } from '@svgs/calendar-days-solid.svg'
import { ReactComponent as GBGIcon } from '@svgs/castalia-logo.svg'
import { ReactComponent as StringIcon } from '@svgs/string-icon.svg'
import { ReactComponent as ChevronLeftIcon } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as ChevronRightIcon } from '@svgs/chevron-right-solid.svg'
import Markdown from '../Markdown'

const CreatePostModal = (props: { initialType: string; close: () => void }): JSX.Element => {
    const { initialType, close } = props
    const { accountData } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const postTypes = [
        {
            name: 'Text',
            steps: ['Post Type: Text', 'Text', 'Spaces', 'Create'],
            icon: <TextIcon />,
            description: `**Text**: The most basic post type on weco. Type in some text (with markdown formatting if you like), choose where you want the post to appear, and you're good to go!`,
        },
        {
            name: 'Url',
            steps: ['Post Type: URL', 'URL', 'Text (optional)', 'Spaces', 'Create'],
            icon: <UrlIcon />,
            description: `**Url**: Url description`,
        },
        {
            name: 'Image',
            steps: ['Post Type: Image', 'Images', 'Text (optional)', 'Spaces', 'Create'],
            icon: <ImageIcon />,
            description: `**Image**: Image description`,
        },
        {
            name: 'Audio',
            steps: ['Post Type: Audio', 'Audio', 'Text (optional)', 'Spaces', 'Create'],
            icon: <AudioIcon />,
            description: `**Audio**: Audio description`,
        },
        {
            name: 'Event',
            steps: [
                'Post Type: Event',
                'Title',
                'Description (optional)',
                'Date',
                'Spaces',
                'Create',
            ],
            icon: <EventIcon />,
            description: `**Event**: Event description`,
        },
        {
            name: 'Glass Bead Game',
            steps: [
                'Post Type: Glass Bead Game',
                'Topic',
                'Description (optional)',
                'Date (optional)',
                'Spaces',
                'Create',
            ],
            icon: <GBGIcon />,
            description: `**Glass Bead Game**: Glass Bead Game description`,
        },
        {
            name: 'String',
            steps: ['Post Type: String', 'String', 'Text', 'Spaces', 'Create'],
            icon: <StringIcon />,
            description: `**String**: String description`,
        },
    ]
    const [postType, setPostType] = useState(initialType)
    const [steps, setSteps] = useState<string[]>(['Post Type', 'Text', 'Spaces', 'Create'])
    const [currentStep, setCurrentStep] = useState(1)

    // text
    const [textForm, setTextForm] = useState({
        text: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
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
    const defaultBead = {
        id: uuidv4(),
        type: 'text',
        text: '',
        url: '',
        urlData: null,
        audioFile: null,
        audioBlob: null,
        audioType: '',
        images: [],
    }
    type errorState = 'default' | 'valid' | 'invalid'
    const [newBead, setNewBead] = useState<any>(defaultBead)
    const [string, setString] = useState<any[]>([])
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

    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([
        {
            id: spaceData.id,
            handle: spaceData.handle,
            name: spaceData.name,
            flagImagePath: spaceData.flagImagePath,
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
            const blacklist = [0, ...selectedSpaces.map((s) => s.id)]
            const data = { query, blacklist }
            axios
                .post(`${config.apiURL}/viable-post-spaces`, data)
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
                ...defaultBead,
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
                if (!string.length) setStringPostError(true)
                else if (totalStringSize() >= totalMBUploadLimit) setStringSizeError(true)
                else setCurrentStep(3)
            }
            if (currentStep === 3 && allValid(stringForm, setStringForm)) setCurrentStep(4)
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
            type: postType.toLowerCase().split(' ').join('-'),
            text: '',
            url: '',
            urlImage: '',
            urlDomain: '',
            urlTitle: '',
            urlDescription: '',
            Creator: accountData,
            DirectSpaces: selectedSpaces.map((space) => {
                return { ...space, type: 'post', state: 'active' }
            }),
            PostImages: [] as any[],
            Event: null as any,
            GlassBeadGame: null as any,
            StringPosts: [] as any[],
        }
        if (postType === 'Text') data.text = textForm.text.value
        if (postType === 'Url') {
            data.text = urlForm2.text.value
            data.url = urlForm1.url.value
            data.urlImage = urlData.image
            data.urlDomain = urlData.domain
            data.urlTitle = urlData.title
            data.urlDescription = urlData.description
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
                let beadUrl = ''
                if (bead.type === 'url') beadUrl = bead.url
                if (bead.type === 'audio')
                    beadUrl = URL.createObjectURL(bead.audioFile || bead.audioBlob)
                return {
                    text: bead.text,
                    type: `string-${bead.type}`,
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
        return data
    }

    function createPost() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        const data = findPostData()
        const postData = {
            type: data.type,
            text: data.text,
            title: data.Event ? data.Event.title : '',
            startTime: data.Event ? data.Event.startTime : null,
            endTime: data.Event ? data.Event.endTime : null,
            url: data.url,
            urlImage: data.urlImage,
            urlDomain: data.urlDomain,
            urlTitle: data.urlTitle,
            urlDescription: data.urlDescription,
            topic: data.GlassBeadGame ? data.GlassBeadGame.topic : null,
            topicGroup: data.GlassBeadGame ? data.GlassBeadGame.topicGroup : null,
            topicImage: data.GlassBeadGame ? data.GlassBeadGame.topicImage : null,
            spaceIds: selectedSpaces.map((s) => s.id),
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
            string.forEach((bead, index) => {
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
            fileData.append('stringData', JSON.stringify(string))
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
                const newPost = {
                    ...res.data.post,
                    totalLikes: 0,
                    totalComments: 0,
                    totalReposts: 0,
                    totalRatings: 0,
                    totalLinks: 0,
                    Creator: {
                        handle: accountData.handle,
                        name: accountData.name,
                        flagImagePath: accountData.flagImagePath,
                    },
                    DirectSpaces: [
                        { ...spaceData, type: 'post', state: 'active' },
                        ...selectedSpaces.map((space) => {
                            return { ...space, type: 'post', state: 'active' }
                        }),
                    ],
                    Reactions: [],
                    IncomingLinks: [],
                    OutgoingLinks: [],
                    PostImages: res.data.images || [],
                    Event: res.data.event
                        ? {
                              ...res.data.event,
                              Going: [],
                              Interested: [],
                          }
                        : null,
                    GlassBeadGame: {
                        topic: data.GlassBeadGame ? data.GlassBeadGame.topic : null,
                        topicGroup: data.GlassBeadGame ? data.GlassBeadGame.topicGroup : null,
                        topicImage: data.GlassBeadGame ? data.GlassBeadGame.topicImage : null,
                        GlassBeads: [],
                    },
                    StringPosts: res.data.string
                        ? res.data.string.map((bead, i) => {
                              return {
                                  ...bead.stringPost,
                                  Link: { index: i },
                                  PostImages: bead.imageData || [],
                              }
                          })
                        : [],
                }
                setSpacePosts([newPost, ...spacePosts])
                setTimeout(() => close(), 1000)
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
        if (postType === 'Event' && currentStep === 4) {
            flatpickr('#date-time-start', {
                ...dateTimeOptions,
                defaultDate: eventForm3.startTime.value
                    ? new Date(eventForm3.startTime.value)
                    : undefined,
                appendTo: document.getElementById('date-time-start-wrapper') || undefined,
                onChange: ([value]) => setStartTime(value.toString()),
            })
            flatpickr('#date-time-end', {
                ...dateTimeOptions,
                defaultDate: eventForm3.endTime.value
                    ? new Date(eventForm3.endTime.value)
                    : undefined,
                minDate: eventForm3.startTime.value
                    ? new Date(eventForm3.startTime.value)
                    : undefined,
                appendTo: document.getElementById('date-time-end-wrapper') || undefined,
                onChange: ([value]) => setEndTime(value.toString()),
            })
        }
        if (postType === 'Glass Bead Game' && currentStep === 4) {
            flatpickr('#date-time-start', {
                ...dateTimeOptions,
                defaultDate: GBGForm3.startTime.value
                    ? new Date(GBGForm3.startTime.value)
                    : undefined,
                appendTo: document.getElementById('date-time-start-wrapper') || undefined,
                onChange: ([value]) => setStartTime(value.toString()),
            })
            flatpickr('#date-time-end', {
                ...dateTimeOptions,
                defaultDate: GBGForm3.endTime.value ? new Date(GBGForm3.endTime.value) : undefined,
                minDate: GBGForm3.startTime.value ? new Date(GBGForm3.startTime.value) : undefined,
                appendTo: document.getElementById('date-time-end-wrapper') || undefined,
                onChange: ([value]) => setEndTime(value.toString()),
            })
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
    }, [endTime])

    return (
        <Modal close={close} centered>
            {currentStep === 1 ? (
                <h1>New post</h1>
            ) : (
                <Row centerY className={styles.title}>
                    <h1>New {postType.toLowerCase()} post</h1>
                    <Column centerX centerY>
                        {findPostTypeValue(postType, 'icon')}
                    </Column>
                </Row>
            )}

            {currentStep === 1 && (
                <Column centerX style={{ width: 500, marginBottom: 40 }}>
                    {/* <h3>Post Type</h3> */}
                    <p>Choose a post type:</p>
                    <Row wrap centerX style={{ margin: '20px 0' }}>
                        {postTypes.map((type) => (
                            <Column centerX className={styles.postTypeButton} key={type.name}>
                                <button
                                    type='button'
                                    className={`${postType === type.name && styles.selected}`}
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
                        style={{ textAlign: 'center' }}
                    />
                </Column>
            )}

            {postType === 'Text' && currentStep === 2 && (
                <Column centerX style={{ width: 400, marginBottom: 60 }}>
                    <h3 style={{ marginBottom: 30 }}>Text</h3>
                    <Input
                        type='text-area'
                        placeholder='Add your text here...'
                        rows={4}
                        value={textForm.text.value}
                        state={textForm.text.state}
                        errors={textForm.text.errors}
                        onChange={(value) =>
                            setTextForm({
                                ...textForm,
                                text: { ...textForm.text, value, state: 'default' },
                            })
                        }
                    />
                </Column>
            )}

            {postType === 'Url' && (
                <Column centerX>
                    {currentStep === 2 && (
                        <Column centerX style={{ maxWidth: 600, marginBottom: 60 }}>
                            <h3 style={{ marginBottom: 30 }}>URL</h3>
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
                                style={{ width: 400, marginBottom: 15 }}
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
                        <Column centerX style={{ maxWidth: 600, marginBottom: 60 }}>
                            <h3 style={{ marginBottom: 30 }}>Text (optional)</h3>
                            <Input
                                type='text-area'
                                placeholder='Add a description for your URL here...'
                                rows={4}
                                value={urlForm2.text.value}
                                state={urlForm2.text.state}
                                errors={urlForm2.text.errors}
                                onChange={(value) =>
                                    setUrlForm2({
                                        ...urlForm2,
                                        text: { ...urlForm2.text, value, state: 'default' },
                                    })
                                }
                                style={{ width: 400, marginBottom: 60 }}
                            />
                        </Column>
                    )}
                </Column>
            )}

            {postType === 'Image' && currentStep === 2 && (
                <Column centerX style={{ marginBottom: 60 }}>
                    <h3 style={{ marginBottom: 30 }}>Images</h3>
                    {imagePostError && (
                        <p className='danger' style={{ marginBottom: 10 }}>
                            No images added yet
                        </p>
                    )}
                    <Row centerX style={{ maxWidth: 600 }}>
                        {images.length > 0 && (
                            <Scrollbars className={`${styles.images} row`}>
                                {images.map((image, index) => (
                                    <Column centerX className={styles.image} key={index}>
                                        <CloseButton size={20} onClick={() => removeImage(index)} />
                                        <img
                                            src={image.url || URL.createObjectURL(image.file)}
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
                                                onChange={(v) => updateNewCaption(index, v)}
                                                style={{ marginRight: 5 }}
                                            />
                                            <Button
                                                icon={<PlusIcon />}
                                                color='grey'
                                                onClick={() => updateCaption(index)}
                                                style={{ padding: '0 10px' }}
                                            />
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
                            Total image upload size must be less than {totalMBUploadLimit}
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

            {postType === 'Image' && currentStep === 3 && (
                <Column centerX style={{ maxWidth: 600, marginBottom: 60 }}>
                    <h3 style={{ marginBottom: 30 }}>Text (optional)</h3>
                    <Input
                        type='text-area'
                        placeholder='Add a description for your images here...'
                        rows={4}
                        value={imageForm.text.value}
                        state={imageForm.text.state}
                        errors={imageForm.text.errors}
                        onChange={(value) =>
                            setImageForm({
                                ...imageForm,
                                text: { ...imageForm.text, value, state: 'default' },
                            })
                        }
                        style={{ width: 400, marginBottom: 60 }}
                    />
                </Column>
            )}

            {postType === 'Audio' && currentStep === 2 && (
                <Column centerX>
                    <h3 style={{ marginBottom: 30 }}>Audio</h3>
                    <Column className={styles.errors}>
                        {audioSizeError && <p>Audio too large. Max size: {audioMBLimit}MB</p>}
                        {audioPostError && <p>Audio recording or upload required</p>}
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
                            style={{ width: 500, marginBottom: 20 }}
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
                                    recording ? 'Stop' : `${audioFile ? 'Restart' : 'Start'}`
                                } recording`}
                                color={recording ? 'red' : 'aqua'}
                                onClick={toggleAudioRecording}
                            />
                        </Column>
                    )}
                </Column>
            )}

            {postType === 'Audio' && currentStep === 3 && (
                <Column centerX style={{ maxWidth: 600, marginBottom: 60 }}>
                    <h3 style={{ marginBottom: 30 }}>Text (optional)</h3>
                    <Input
                        type='text-area'
                        placeholder='Add a description for your images here...'
                        rows={4}
                        value={audioForm.text.value}
                        state={audioForm.text.state}
                        errors={audioForm.text.errors}
                        onChange={(value) =>
                            setAudioForm({
                                ...audioForm,
                                text: { ...audioForm.text, value, state: 'default' },
                            })
                        }
                        style={{ width: 400, marginBottom: 60 }}
                    />
                </Column>
            )}

            {postType === 'Event' && currentStep === 2 && (
                <Column centerX style={{ marginBottom: 60, width: 400 }}>
                    <h3 style={{ marginBottom: 30 }}>Title</h3>
                    <Input
                        type='text'
                        placeholder='Add a title for your event...'
                        value={eventForm1.title.value}
                        state={eventForm1.title.state}
                        errors={eventForm1.title.errors}
                        onChange={(value) =>
                            setEventForm1({
                                ...eventForm1,
                                title: { ...eventForm1.title, value, state: 'default' },
                            })
                        }
                    />
                </Column>
            )}

            {postType === 'Event' && currentStep === 3 && (
                <Column centerX style={{ marginBottom: 60, width: 400 }}>
                    <h3 style={{ marginBottom: 30 }}>Description (optional)</h3>
                    <Input
                        type='text-area'
                        placeholder='Add a description for your event...'
                        rows={4}
                        value={eventForm2.description.value}
                        state={eventForm2.description.state}
                        errors={eventForm2.description.errors}
                        onChange={(value) =>
                            setEventForm2({
                                ...eventForm2,
                                description: { ...eventForm2.description, value, state: 'default' },
                            })
                        }
                    />
                </Column>
            )}

            {postType === 'Event' && currentStep === 4 && (
                <Column centerX style={{ marginBottom: 60, width: 600 }}>
                    <h3 style={{ marginBottom: 30 }}>Time</h3>
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

            {postType === 'Glass Bead Game' && currentStep === 2 && (
                <Column centerX style={{ marginBottom: 40 }}>
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
                            <Row wrap centerX style={{ width: 500, height: 280 }}>
                                {GlassBeadGameTopics[topicGroup].map((topic) => (
                                    <Column centerX className={styles.topic} key={topic.name}>
                                        <button
                                            type='button'
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
                    {selectedTopic && topicGroup !== 'custom' && (
                        <Column centerX className={styles.selectedTopic}>
                            <p>Selected topic:</p>
                            <Row centerY className={styles.selectedTopicWrapper}>
                                <ImageTitle
                                    type='space'
                                    imagePath={selectedTopic.imagePath}
                                    imageSize={40}
                                    title={selectedTopic.name}
                                    fontSize={14}
                                    style={{ marginRight: 15 }}
                                />
                                <CloseButton size={17} onClick={() => setSelectedTopic(null)} />
                            </Row>
                        </Column>
                    )}
                    {topicError && <p className='danger'>No topic selected</p>}
                </Column>
            )}

            {postType === 'Glass Bead Game' && currentStep === 3 && (
                <Column centerX style={{ marginBottom: 60, width: 400 }}>
                    <h3 style={{ marginBottom: 30 }}>Description (optional)</h3>
                    <Input
                        type='text-area'
                        placeholder='Add a description for your game...'
                        rows={4}
                        value={GBGForm2.description.value}
                        state={GBGForm2.description.state}
                        errors={GBGForm2.description.errors}
                        onChange={(value) =>
                            setGBGForm2({
                                ...GBGForm2,
                                description: { ...GBGForm2.description, value, state: 'default' },
                            })
                        }
                    />
                </Column>
            )}

            {postType === 'Glass Bead Game' && currentStep === 4 && (
                <Column centerX style={{ marginBottom: 60, width: 600 }}>
                    <h3 style={{ marginBottom: 30 }}>Date (optional)</h3>
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

            {postType === 'String' && currentStep === 2 && (
                <Column style={{ maxWidth: 600 }}>
                    <Column centerX>
                        {stringPostError && (
                            <p className='danger' style={{ marginBottom: 20 }}>
                                No beads added to string
                            </p>
                        )}
                        {stringSizeError && (
                            <p className='danger' style={{ marginBottom: 20 }}>
                                Total string upload size must be less than {totalMBUploadLimit}
                                MB. (Current size: {totalStringSize().toFixed(2)}MB)
                            </p>
                        )}
                    </Column>
                    <Row centerX className={styles.beadTypeButtons}>
                        <button
                            type='button'
                            className={`${newBead.type === 'text' && styles.selected}`}
                            onClick={() => setNewBead({ ...newBead, type: 'text' })}
                        >
                            <TextIcon />
                        </button>
                        <button
                            type='button'
                            className={`${newBead.type === 'url' && styles.selected}`}
                            onClick={() => setNewBead({ ...newBead, type: 'url' })}
                        >
                            <UrlIcon />
                        </button>
                        <button
                            type='button'
                            className={`${newBead.type === 'audio' && styles.selected}`}
                            onClick={() => setNewBead({ ...newBead, type: 'audio' })}
                        >
                            <AudioIcon />
                        </button>
                        <button
                            type='button'
                            className={`${newBead.type === 'image' && styles.selected}`}
                            onClick={() => setNewBead({ ...newBead, type: 'image' })}
                        >
                            <ImageIcon />
                        </button>
                    </Row>
                    <Column centerX>
                        {newBead.type === 'text' && (
                            <Input
                                id='new-bead-text'
                                type='text-area'
                                placeholder='text...'
                                rows={1}
                                state={stringTextState}
                                errors={stringTextErrors}
                                value={newBead.text}
                                onChange={(v) => {
                                    setStringTextErrors([])
                                    setStringTextState('default')
                                    setNewBead({ ...newBead, text: v })
                                }}
                                style={{ width: 400 }}
                            />
                        )}
                        {newBead.type === 'url' && (
                            <Column centerX>
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
                                    style={{ width: 400 }}
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
                            <Column centerX>
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
                                        style={{ marginBottom: 20, width: 400 }}
                                    >
                                        <p>{newBead.audioFile.name}</p>
                                        <AudioVisualiser
                                            audioElementId='new-post-audio'
                                            audioURL={URL.createObjectURL(newBead.audioFile)}
                                            staticBars={1200}
                                            staticColor={colors.audioVisualiserColor}
                                            dynamicBars={160}
                                            dynamicColor={colors.audioVisualiserColor}
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
                                                {audioPlaying ? <PauseIcon /> : <PlayIcon />}
                                            </button>
                                            <AudioTimeSlider
                                                audioElementId='new-post-audio'
                                                audioURL={URL.createObjectURL(newBead.audioFile)}
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
                                            color={recording ? 'red' : 'blue'}
                                            onClick={toggleAudioRecording}
                                        />
                                    </Column>
                                )}
                            </Column>
                        )}
                        {newBead.type === 'image' && (
                            <Column centerX>
                                {imagePostError && (
                                    <p className='danger' style={{ marginBottom: 10 }}>
                                        No images added yet
                                    </p>
                                )}
                                <Row centerX style={{ width: 550 }}>
                                    {images.length > 0 && (
                                        <Scrollbars className={`${styles.beadImages} row`}>
                                            {images.map((image, index) => (
                                                <Column className={styles.image} key={index}>
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
                                                    <Row centerY style={{ width: 180 }}>
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
                                    <p className='danger' style={{ marginBottom: 10 }}>
                                        Max file size: {imageMBLimit}MB
                                    </p>
                                )}
                                {toalImageSizeError && (
                                    <p className='danger' style={{ marginBottom: 10 }}>
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
                                <Row style={{ width: 400, marginTop: 5 }}>
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
                        <Button
                            text='Add bead'
                            color='aqua'
                            disabled={
                                (newBead.type === 'text' && !newBead.text) ||
                                (newBead.type === 'url' &&
                                    (newBead.urlData === null || urlLoading)) ||
                                (newBead.type === 'audio' && newBead.audioFile === null) ||
                                (newBead.type === 'image' && !images.length)
                            }
                            onClick={addBeadToString}
                            style={{ margin: '20px 0' }}
                        />
                    </Column>
                    {string.length > 0 && (
                        <Scrollbars className={`${styles.beadDraw} row`}>
                            {string.map((bead, index) => (
                                <Column key={bead.id}>
                                    <StringBeadCard
                                        bead={bead}
                                        index={index}
                                        removeBead={removeBead}
                                    />
                                    <Row centerX className={styles.beadFooter}>
                                        {index !== 0 && (
                                            <button
                                                type='button'
                                                onClick={() => moveBead(index, -1)}
                                            >
                                                <ChevronLeftIcon />
                                            </button>
                                        )}
                                        {index < string.length - 1 && (
                                            <button
                                                type='button'
                                                onClick={() => moveBead(index, 1)}
                                            >
                                                <ChevronRightIcon />
                                            </button>
                                        )}
                                    </Row>
                                </Column>
                            ))}
                            <span style={{ marginLeft: -7, width: 7, flexShrink: 0 }} />
                        </Scrollbars>
                    )}
                </Column>
            )}

            {postType === 'String' && currentStep === 3 && (
                <Column centerX style={{ marginBottom: 60, width: 400 }}>
                    <h3 style={{ marginBottom: 30 }}>Description (optional)</h3>
                    <Input
                        type='text-area'
                        placeholder='Add a description for your game...'
                        rows={4}
                        value={stringForm.description.value}
                        state={stringForm.description.state}
                        errors={stringForm.description.errors}
                        onChange={(value) =>
                            setStringForm({
                                ...stringForm,
                                description: { ...stringForm.description, value, state: 'default' },
                            })
                        }
                    />
                </Column>
            )}

            {currentStep === steps.length - 1 && (
                <Column centerX>
                    <h3 style={{ marginBottom: 30 }}>Spaces</h3>
                    <p>Choose where you want the post to appear:</p>
                    <SearchSelector
                        type='space'
                        placeholder='space name or handle...'
                        onSearchQuery={(query) => findSpaces(query)}
                        onOptionSelected={(space) => addSpace(space)}
                        options={spaceOptions}
                        style={{ width: 300, margin: '20px 0' }}
                    />
                    {selectedSpaces.length > 0 && (
                        <Row centerX wrap style={{ marginBottom: 20, maxWidth: 400 }}>
                            {selectedSpaces.map((space) => (
                                <Row key={space.id} centerY style={{ margin: '0 10px 10px 0' }}>
                                    <ImageTitle
                                        type='space'
                                        imagePath={space.flagImagePath}
                                        title={`${space.name} (${space.handle})`}
                                        imageSize={35}
                                        fontSize={16}
                                        style={{ marginRight: 5 }}
                                    />
                                    <CloseButton size={17} onClick={() => removeSpace(space.id)} />
                                </Row>
                            ))}
                        </Row>
                    )}
                    {selectedSpacesError && <p className='danger'>No spaces selected</p>}
                </Column>
            )}

            {currentStep === steps.length && (
                <Column centerX style={{ width: 800, marginBottom: 60 }}>
                    <h3 style={{ marginBottom: 30 }}>Create</h3>
                    <p style={{ marginBottom: 30 }}>
                        Here's a preview of what your post will look like to other users:
                    </p>
                    <PostCard location='preview' post={findPostData()} />
                </Column>
            )}

            <Row centerX style={{ margin: '20px 0' }}>
                {currentStep > 1 && !saved && (
                    <Button
                        text='Back'
                        color='purple'
                        disabled={urlLoading || loading}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        style={{ marginRight: 10 }}
                    />
                )}
                {currentStep < steps.length && (
                    <Button text='Next' disabled={urlLoading} color='blue' onClick={moveForward} />
                )}
                {currentStep === steps.length && !saved && (
                    <Button
                        text={`Create ${postType === 'Glass Bead Game' ? 'game' : 'post'}`}
                        disabled={loading}
                        loading={loading}
                        color='blue'
                        onClick={createPost}
                    />
                )}
                {saved && <SuccessMessage text='Post created!' />}
            </Row>
            <ProgressBarSteps steps={steps} currentStep={currentStep} style={{ width: 500 }} />
        </Modal>
    )
}

export default CreatePostModal
