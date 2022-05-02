/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import React, { useContext, useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
import SuccessMessage from '@components/SuccessMessage'
import DropDownMenu from '@components/DropDownMenu'
import SearchSelector from '@components/SearchSelector'
import ImageTitle from '@components/ImageTitle'
import CloseButton from '@components/CloseButton'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import PostCardUrlPreview from '@components/Cards/PostCard/PostCardUrlPreview'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import Scrollbars from '@components/Scrollbars'
import StringBeadCard from '@components/Cards/StringBeadCard'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'
import { ReactComponent as TextIconSVG } from '@svgs/font-solid.svg'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'
import { ReactComponent as AudioIconSVG } from '@svgs/volume-high-solid.svg'
import { ReactComponent as ImageIconSVG } from '@svgs/image-solid.svg'
import { ReactComponent as ChevronLeftSVG } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as ChevronRightSVG } from '@svgs/chevron-right-solid.svg'

const CreatePostModal = (props: { type: string; close: () => void }): JSX.Element => {
    const { type, close } = props
    const { accountData } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const [formData, setFormData] = useState({
        postType: {
            value: type,
            ...defaultErrorState,
        },
        text: {
            value: '',
            ...defaultErrorState,
        },
        url: {
            value: '',
            ...defaultErrorState,
        },
        title: {
            value: '',
            ...defaultErrorState,
        },
        eventStartTime: {
            value: '',
            ...defaultErrorState,
        },
        eventEndTime: {
            value: '',
            ...defaultErrorState,
        },
        topic: {
            value: '',
            ...defaultErrorState,
        },
        topicGroup: {
            value: '',
            ...defaultErrorState,
        },
        topicImage: {
            value: '',
            ...defaultErrorState,
        },
    })
    const {
        postType,
        text,
        url,
        title,
        eventStartTime,
        eventEndTime,
        topic,
        topicGroup,
        topicImage,
    } = formData
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    // url
    const [urlLoading, setUrlLoading] = useState(false)
    const [urlInvalid, setUrlInvalid] = useState(false)
    const [urlData, setUrlData] = useState<any>(null)
    // image
    const [images, setImages] = useState<any[]>([])
    const [imageURL, setImageURL] = useState('')
    const [imageSizeError, setImageSizeError] = useState(false)
    const [toalImageSizeError, setTotalImageSizeError] = useState(false)
    const [imagePostError, setImagePostError] = useState(false)
    const imageMBLimit = 2
    const totalImageMBLimit = 20
    const totalImageSize =
        images.map((image) => (image.file ? image.file.size : 0)).reduce((a, b) => a + b, 0) /
        (1024 * 1024)
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
    // event
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [duration, setDuration] = useState<string | number>('Undefined')
    // glass bead game
    const [selectedTopicGroup, setSelectedTopicGroup] = useState('archetopics')
    const [selectedTopic, setSelectedTopic] = useState<any>(null)
    // string
    const defaultBead = {
        id: uuidv4(),
        type: 'text',
        text: '',
        url: '',
        urlData: null,
        audioFile: null,
        images: [],
    }
    const [newBead, setNewBead] = useState<any>(defaultBead)
    const [string, setString] = useState<any[]>([])

    const cookies = new Cookies()

    function addBeadToString() {
        // todo: validate new bead
        if (newBead.type === 'image') {
            newBead.images = images.map((image, index) => {
                return { index, ...image }
            })
            setImages([])
        }
        setString([...string, newBead])
        setNewBead({
            ...defaultBead,
            type: newBead.type,
        })
        // reset state
        // todo: reset audio state
        const input = document.getElementById('new-bead-text')
        if (input) input.style.height = ''
    }

    function removeBead(index) {
        setString([...string.filter((bead, i) => i !== index)])
    }

    function moveBead(index, increment) {
        const newString = [...string]
        const bead = newString[index]
        newString.splice(index, 1)
        newString.splice(index + increment, 0, bead)
        setString(newString)
    }

    function updateValue(name, value) {
        let resetState = {}
        if (name === 'postType') {
            resetState = {
                text: { ...formData.text, state: 'default' },
                url: { ...formData.url, value: '', state: 'default' },
                title: { ...formData.title, value: '', state: 'default' },
                eventStartTime: { ...formData.eventStartTime, value: '', state: 'default' },
                eventEndTime: { ...formData.eventEndTime, value: '', state: 'default' },
                topic: { ...formData.topic, value: '', state: 'default' },
                topicGroup: { ...formData.topicGroup, value: '', state: 'default' },
                topicImage: { ...formData.topicImage, value: '', state: 'default' },
            }
            setUrlData(null)
            setUrlInvalid(false)
            setDuration('Undefined')
            setStartTime('')
            setEndTime('')
        }
        setFormData({
            ...formData,
            [name]: { ...formData[name], value, state: 'default' },
            ...resetState,
        })
    }

    function findSpaces(query) {
        if (!query) setSpaceOptions([])
        else {
            const blacklist = [spaceData.id, ...selectedSpaces.map((s) => s.id)]
            const data = { query, blacklist }
            axios
                .post(`${config.apiURL}/viable-post-spaces`, data)
                .then((res) => setSpaceOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function addSpace(space) {
        setSpaceOptions([])
        setSelectedSpaces((s) => [...s, space])
    }

    function removeSpace(spaceId) {
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    function scrapeURL(urlString) {
        if (isValidUrl(urlString)) {
            setUrlData(null)
            setUrlInvalid(false)
            setUrlLoading(true)
            axios
                .get(`${config.apiURL}/scrape-url?url=${urlString}`)
                .then((res) => {
                    if (postType.value === 'String') {
                        setNewBead({
                            ...newBead,
                            url: urlString,
                            urlData: res.data,
                        })
                    } else setUrlData(res.data)
                    setUrlLoading(false)
                })
                .catch((error) => console.log(error))
        } else {
            setUrlInvalid(!!urlString)
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
        const input = d3.select('#file-input').node()
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
                setAudioSizeError(false)
                setAudioPostError(false)
                if (postType.value === 'String') {
                    setNewBead({
                        ...newBead,
                        audioFile: input.files[0],
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
                    if (postType.value === 'String') {
                        setNewBead({
                            ...newBead,
                            audioFile: new File([blob], ''),
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

    function createPost() {
        // add validation with latest values to form data (todo: avoid this set using refs?)
        const newFormData = {
            postType: {
                ...postType,
                required: false,
            },
            text: {
                ...text,
                required: !['Url', 'Image', 'Audio'].includes(postType.value),
                validate: (v) => {
                    const errors: string[] = []
                    if (!v) errors.push('Required')
                    if (v.length > 5000) errors.push('Must be less than 5K characters')
                    return errors
                },
            },
            url: {
                ...url,
                required: postType.value === 'Url',
                validate: (v) => (!isValidUrl(v) ? ['Must be a valid URL'] : []),
            },
            eventStartTime: {
                ...eventStartTime,
                required: postType.value === 'Event',
                validate: (v) => (!v ? ['Required'] : []),
            },
            eventEndTime: {
                ...eventEndTime,
                required: false,
            },
            title: {
                ...title,
                required: postType.value === 'Event',
                validate: (v) => (!v ? ['Required'] : []),
            },
            topic: {
                ...topic,
                required: postType.value === 'Glass Bead Game',
                validate: (v) => (!selectedTopic && !v ? ['Required'] : []),
            },
            topicGroup: {
                ...topicGroup,
                required: false,
            },
            topicImage: {
                ...topicImage,
                required: false,
            },
        }

        if (allValid(newFormData, setFormData)) {
            if (postType.value === 'Image' && !images.length) setImagePostError(true)
            else if (postType.value === 'Image' && totalImageSize >= totalImageMBLimit)
                setTotalImageSizeError(true)
            else if (postType.value === 'Audio' && !audioFile && !audioSizeError)
                setAudioPostError(true)
            else {
                setLoading(true)
                const accessToken = cookies.get('accessToken')
                const options = { headers: { Authorization: `Bearer ${accessToken}` } }
                const postData = {
                    type: postType.value.replace(/\s+/g, '-').toLowerCase(),
                    text: text.value,
                    title: title.value,
                    startTime: eventStartTime.value || null,
                    endTime: eventEndTime.value || null,
                    url: url.value,
                    urlImage: urlData ? urlData.image : null,
                    urlDomain: urlData ? urlData.domain : null,
                    urlTitle: urlData ? urlData.title : null,
                    urlDescription: urlData ? urlData.description : null,
                    topic: selectedTopic ? selectedTopic.name : topic.value,
                    topicGroup: selectedTopic ? selectedTopicGroup : null,
                    topicImage: selectedTopic ? selectedTopic.imagePath : null,
                    spaceIds: [spaceData.id, ...selectedSpaces.map((s) => s.id)],
                }
                let fileData
                let uploadType
                if (postType.value === 'Audio') {
                    const isBlob = audioFile && !audioFile.name
                    uploadType = isBlob ? 'audio-blob' : 'audio-file'
                    fileData = new FormData()
                    // isBlob check not required as audio file already converted to blob
                    fileData.append(
                        'file',
                        isBlob
                            ? new Blob(audioChunksRef.current, { type: 'audio/mpeg-3' })
                            : audioFile
                    )
                    fileData.append('postData', JSON.stringify(postData))
                    options.headers['Content-Type'] = 'multipart/form-data'
                }
                if (postType.value === 'Image') {
                    uploadType = 'image-post'
                    fileData = new FormData()
                    images.forEach((image, index) => {
                        // originalname set as index for use on backend
                        if (image.file) fileData.append('file', image.file, index)
                    })
                    fileData.append('imageData', JSON.stringify(images))
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
                        // todo: update direct spaces
                        const DirectSpaces = [spaceData, ...selectedSpaces]
                        DirectSpaces.forEach((s) => {
                            s.type = 'post'
                            s.state = 'active'
                        })
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
                            DirectSpaces,
                            Reactions: [],
                            IncomingLinks: [],
                            OutgoingLinks: [],
                            PostImages: res.data.images ? [...res.data.images] : [],
                            Event: {
                                ...res.data.event,
                                Going: [],
                                Interested: [],
                            },
                            GlassBeadGame: {
                                topic: selectedTopic ? selectedTopic.name : topic.value,
                                topicGroup: selectedTopic ? selectedTopicGroup : null,
                                topicImage: selectedTopic ? selectedTopic.imagePath : null,
                                GlassBeads: [],
                            },
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
        }
    }

    function textTitle() {
        switch (postType.value) {
            case 'Url':
            case 'Image':
            case 'Audio':
                return 'Text (optional)'
            case 'Event':
                return 'Description'
            case 'Glass Bead Game':
                return 'Add a description for the game'
            default:
                return 'Text'
        }
    }

    function textPlaceholder() {
        switch (postType.value) {
            case 'Event':
                return 'event description...'
            case 'Glass Bead Game':
                return 'description...'
            default:
                return 'text...'
        }
    }

    const postTypeName = ['Text', 'Url', 'Image', 'Audio', 'Event'].includes(postType.value)
        ? `${postType.value.toLowerCase()} post`
        : postType.value

    const dateTimeOptions = {
        enableTime: true,
        clickOpens: true,
        disableMobile: true,
        minDate: new Date(),
        minuteIncrement: 1,
        altInput: true,
    }

    useEffect(() => {
        if (['Event', 'Glass Bead Game'].includes(postType.value)) {
            flatpickr('#date-time-start', {
                ...dateTimeOptions,
                appendTo: document.getElementById('date-time-start-wrapper') || undefined,
                onChange: ([value]) => setStartTime(value.toString()),
            })
            flatpickr('#date-time-end', {
                ...dateTimeOptions,
                appendTo: document.getElementById('date-time-end-wrapper') || undefined,
                onChange: ([value]) => setEndTime(value.toString()),
            })
        }
    }, [postType.value])

    useEffect(() => {
        if (startTime) {
            const startTimeDate = new Date(startTime)
            updateValue('eventStartTime', startTimeDate)
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
            updateValue('eventEndTime', endTime)
        }
    }, [endTime])

    return (
        <Modal close={close} centered>
            <h1>
                Create a new {postTypeName} in{' '}
                <Link to={`/s/${spaceData.handle}`} onClick={close}>
                    {spaceData.name}
                </Link>
            </h1>
            <form onSubmit={createPost}>
                <Column style={{ width: 700 }}>
                    {type !== 'Glass Bead Game' && (
                        <DropDownMenu
                            title='Post Type'
                            options={[
                                'Text',
                                'Url',
                                'Image',
                                'Audio',
                                'Event',
                                'Glass Bead Game',
                                'String',
                            ]}
                            selectedOption={postType.value}
                            setSelectedOption={(value) => updateValue('postType', value)}
                            orientation='horizontal'
                            style={{ marginBottom: 10 }}
                        />
                    )}
                    {postType.value === 'Url' && (
                        <Column>
                            <Input
                                title='Url'
                                type='text'
                                placeholder='url...'
                                style={{ marginBottom: 15 }}
                                loading={urlLoading}
                                state={url.state}
                                errors={url.errors}
                                value={url.value}
                                onChange={(value) => {
                                    updateValue('url', value)
                                    scrapeURL(value)
                                }}
                            />
                            {urlInvalid && <p className={styles.invalidUrl}>Invalid URL</p>}
                            {urlData && (
                                <Column className={styles.urlPreviewWrapper}>
                                    <PostCardUrlPreview
                                        url={url.value}
                                        image={urlData.image}
                                        domain={urlData.domain}
                                        title={urlData.title}
                                        description={urlData.description}
                                    />
                                </Column>
                            )}
                        </Column>
                    )}
                    {postType.value === 'Image' && (
                        <Column style={{ marginTop: 10 }}>
                            {imagePostError && (
                                <p className='danger' style={{ marginBottom: 10 }}>
                                    No images added yet
                                </p>
                            )}
                            <Row centerX>
                                {images.length > 0 && (
                                    <Scrollbars className={`${styles.images} row`}>
                                        {images.map((image, index) => (
                                            <Column centerX className={styles.image} key={index}>
                                                <CloseButton
                                                    size={20}
                                                    onClick={() => removeImage(index)}
                                                />
                                                <img
                                                    src={
                                                        image.url || URL.createObjectURL(image.file)
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
                                                        onChange={(v) => updateNewCaption(index, v)}
                                                        style={{ marginRight: 5 }}
                                                    />
                                                    <Button
                                                        icon={<PlusIconSVG />}
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
                                    Total image upload size must be less than {totalImageMBLimit}MB.
                                    (Current size: {totalImageSize.toFixed(2)}MB)
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
                    {postType.value === 'Audio' && (
                        <Column>
                            <Column className={styles.errors}>
                                {audioSizeError && (
                                    <p>Audio too large. Max size: {audioMBLimit}MB</p>
                                )}
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
                                <Column key={audioFile.lastModified} style={{ marginBottom: 20 }}>
                                    <p>{audioFile.name}</p>
                                    <AudioVisualiser
                                        audioElementId='new-post-audio'
                                        audioURL={URL.createObjectURL(audioFile)}
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
                    {postType.value === 'Event' && (
                        <Column>
                            <div className={styles.dateTimePicker}>
                                <div id='date-time-start-wrapper'>
                                    <Input
                                        id='date-time-start'
                                        title='Start time'
                                        type='text'
                                        placeholder='select start time...'
                                        state={eventStartTime.state}
                                        errors={eventStartTime.errors}
                                    />
                                </div>
                                <div id='date-time-end-wrapper'>
                                    <Input
                                        id='date-time-end'
                                        title='End time (optional)'
                                        type='text'
                                        placeholder='select end time...'
                                        state={eventEndTime.state}
                                        errors={eventEndTime.errors}
                                    />
                                </div>
                                <Input
                                    title='Duration'
                                    type='text'
                                    placeholder='Undefined'
                                    value={duration}
                                    disabled
                                    style={{ width: 'auto' }}
                                />
                            </div>
                            <Input
                                title='Title'
                                type='text'
                                placeholder='event title...'
                                style={{ marginBottom: 15 }}
                                state={title.state}
                                errors={title.errors}
                                value={title.value}
                                onChange={(value) => updateValue('title', value)}
                            />
                        </Column>
                    )}
                    {postType.value === 'Glass Bead Game' && (
                        <Column style={{ marginTop: 5 }}>
                            <div className={styles.dateTimePicker}>
                                <div id='date-time-start-wrapper'>
                                    <Input
                                        id='date-time-start'
                                        title='Start time (optional)'
                                        type='text'
                                        placeholder='select start time...'
                                        state={eventStartTime.state}
                                        errors={eventStartTime.errors}
                                    />
                                </div>
                                <div id='date-time-end-wrapper'>
                                    <Input
                                        id='date-time-end'
                                        title='End time (optional)'
                                        type='text'
                                        placeholder='select end time...'
                                        state={eventEndTime.state}
                                        errors={eventEndTime.errors}
                                    />
                                </div>
                                <Input
                                    title='Duration'
                                    type='text'
                                    placeholder='Undefined'
                                    value={duration}
                                    disabled
                                    style={{ width: 'auto' }}
                                />
                            </div>
                            <Input
                                title='Create a custom topic for the game'
                                type='text'
                                placeholder={selectedTopic ? 'topic selected' : 'custom topic...'}
                                state={topic.state}
                                errors={topic.errors}
                                value={topic.value}
                                disabled={selectedTopic}
                                onChange={(value) => updateValue('topic', value)}
                                style={{ marginBottom: 15 }}
                            />
                            <p>Or select a topic from one of the topic groups below</p>
                            <Row style={{ margin: '10px 0' }}>
                                <Button
                                    text='Archetopics'
                                    color={selectedTopicGroup === 'archetopics' ? 'blue' : 'grey'}
                                    onClick={() => setSelectedTopicGroup('archetopics')}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='Liminal'
                                    color={selectedTopicGroup === 'liminal' ? 'blue' : 'grey'}
                                    onClick={() => setSelectedTopicGroup('liminal')}
                                />
                            </Row>
                            <Scrollbars className={styles.topics}>
                                <Row wrap>
                                    {GlassBeadGameTopics[selectedTopicGroup].map((t) => (
                                        <Row className={styles.topicWrapper} key={t.name}>
                                            <ImageTitle
                                                type='space'
                                                imagePath={t.imagePath}
                                                imageSize={25}
                                                title={t.name}
                                                fontSize={12}
                                                onClick={() => {
                                                    setSelectedTopic(t)
                                                    updateValue('topic', '')
                                                }}
                                            />
                                        </Row>
                                    ))}
                                </Row>
                            </Scrollbars>
                            {selectedTopic && (
                                <Column className={styles.selectedTopic}>
                                    <p>Selected topic:</p>
                                    <Row centerY className={styles.selectedTopicWrapper}>
                                        <ImageTitle
                                            type='space'
                                            imagePath={selectedTopic.imagePath}
                                            imageSize={25}
                                            title={selectedTopic.name}
                                            fontSize={12}
                                            style={{ marginRight: 10 }}
                                        />
                                        <CloseButton
                                            size={17}
                                            onClick={() => setSelectedTopic(null)}
                                        />
                                    </Row>
                                </Column>
                            )}
                        </Column>
                    )}
                    {postType.value === 'String' && (
                        <Column>
                            <Row centerX className={styles.beadTypeButtons}>
                                <button
                                    type='button'
                                    className={`${newBead.type === 'text' && styles.selected}`}
                                    onClick={() => setNewBead({ ...newBead, type: 'text' })}
                                >
                                    <TextIconSVG />
                                </button>
                                <button
                                    type='button'
                                    className={`${newBead.type === 'url' && styles.selected}`}
                                    onClick={() => setNewBead({ ...newBead, type: 'url' })}
                                >
                                    <LinkIconSVG />
                                </button>
                                <button
                                    type='button'
                                    className={`${newBead.type === 'audio' && styles.selected}`}
                                    onClick={() => setNewBead({ ...newBead, type: 'audio' })}
                                >
                                    <AudioIconSVG />
                                </button>
                                <button
                                    type='button'
                                    className={`${newBead.type === 'image' && styles.selected}`}
                                    onClick={() => setNewBead({ ...newBead, type: 'image' })}
                                >
                                    <ImageIconSVG />
                                </button>
                            </Row>
                            <Column centerX className={styles.newBead}>
                                {newBead.type === 'text' && (
                                    <Input
                                        id='new-bead-text'
                                        type='text-area'
                                        placeholder='text...'
                                        rows={1}
                                        // state={newBead.text.state}
                                        // errors={newBead.text.errors}
                                        value={newBead.text}
                                        onChange={(v) => setNewBead({ ...newBead, text: v })}
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
                                        {urlInvalid && (
                                            <p className={styles.invalidUrl}>Invalid URL</p>
                                        )}
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
                                                    audioURL={URL.createObjectURL(
                                                        newBead.audioFile
                                                    )}
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
                                                        {audioPlaying ? (
                                                            <PauseIconSVG />
                                                        ) : (
                                                            <PlayIconSVG />
                                                        )}
                                                    </button>
                                                    <AudioTimeSlider
                                                        audioElementId='new-post-audio'
                                                        audioURL={URL.createObjectURL(
                                                            newBead.audioFile
                                                        )}
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
                                        <Row centerX style={{ width: 600 }}>
                                            {images.length > 0 && (
                                                <Scrollbars className={`${styles.beadImages} row`}>
                                                    {images.map((image, index) => (
                                                        <Column
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
                                                            {image.caption && (
                                                                <p>{image.caption}</p>
                                                            )}
                                                            <Row centerY style={{ width: 180 }}>
                                                                <Input
                                                                    type='text'
                                                                    placeholder={`${
                                                                        image.caption
                                                                            ? 'change'
                                                                            : 'add'
                                                                    } caption...`}
                                                                    value={image.newCaption}
                                                                    onChange={(v) =>
                                                                        updateNewCaption(index, v)
                                                                    }
                                                                    style={{ marginRight: 5 }}
                                                                />
                                                                <Button
                                                                    icon={<PlusIconSVG />}
                                                                    color='grey'
                                                                    onClick={() =>
                                                                        updateCaption(index)
                                                                    }
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
                                                Total image upload size must be less than{' '}
                                                {totalImageMBLimit}MB. (Current size:{' '}
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
                                    disabled={urlLoading}
                                    onClick={addBeadToString}
                                    style={{ margin: '20px 0' }}
                                />
                            </Column>
                            {string.length > 0 && (
                                <Scrollbars className={`${styles.beadDraw} row`}>
                                    {string.map((bead, index) => (
                                        <Column>
                                            <StringBeadCard
                                                key={bead.id}
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
                                                        <ChevronLeftSVG />
                                                    </button>
                                                )}
                                                {index < string.length - 1 && (
                                                    <button
                                                        type='button'
                                                        onClick={() => moveBead(index, 1)}
                                                    >
                                                        <ChevronRightSVG />
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
                    {postType.value !== 'String' && (
                        <Input
                            title={textTitle()}
                            type='text-area'
                            placeholder={textPlaceholder()}
                            style={{ marginBottom: 15 }}
                            rows={3}
                            state={text.state}
                            errors={text.errors}
                            value={text.value}
                            onChange={(value) => updateValue('text', value)}
                        />
                    )}
                    <SearchSelector
                        type='space'
                        title='Add any other spaces you want the post to appear in'
                        placeholder='space name or handle...'
                        style={{ marginBottom: 10 }}
                        onSearchQuery={(query) => findSpaces(query)}
                        onOptionSelected={(space) => addSpace(space)}
                        options={spaceOptions}
                    />
                    {selectedSpaces.length > 0 && (
                        <Row wrap>
                            {selectedSpaces.map((space) => (
                                <Row centerY style={{ margin: '0 10px 10px 0' }}>
                                    <ImageTitle
                                        type='user'
                                        imagePath={space.flagImagePath}
                                        title={`${space.name} (${space.handle})`}
                                        imageSize={27}
                                        style={{ marginRight: 3 }}
                                    />
                                    <CloseButton size={17} onClick={() => removeSpace(space.id)} />
                                </Row>
                            ))}
                        </Row>
                    )}
                </Column>
                <Row style={{ marginTop: 40 }}>
                    {!saved ? (
                        <Button
                            text={`Create ${
                                postType.value === 'Glass Bead Game' ? 'game' : 'post'
                            }`}
                            color='blue'
                            disabled={urlLoading}
                            loading={loading}
                            onClick={createPost}
                        />
                    ) : (
                        <SuccessMessage text='Post created!' />
                    )}
                </Row>
            </form>
        </Modal>
    )
}

export default CreatePostModal
