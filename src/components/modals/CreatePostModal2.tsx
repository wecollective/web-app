/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import PollAnswer from '@components/cards/PollAnswer'
import Audio from '@components/cards/PostCard/PostTypes/Audio'
import StringBeadCard from '@components/cards/PostCard/StringBeadCard'
import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import GBGHelpModal from '@components/modals/GBGHelpModal'
import GBGSettingsModal from '@components/modals/GBGSettingsModal'
import ImageModal from '@components/modals/ImageModal'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import Toggle from '@components/Toggle'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import PostSpaces from '@src/components/cards/PostCard/PostSpaces'
import UrlPreview from '@src/components/cards/PostCard/UrlPreview'
// import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import CloseButton from '@components/CloseButton'
import DropDown from '@components/DropDown'
import AddPostSpacesModal from '@components/modals/AddPostSpacesModal'
import Scrollbars from '@components/Scrollbars'
import config from '@src/Config'
import {
    audioMBLimit,
    capitalise,
    defaultErrorState,
    defaultGBGSettings,
    findDraftLength,
    findEventDuration,
    findEventTimes,
    formatTimeMMSS,
    imageMBLimit,
} from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/CreatePostModal2.module.scss'
import {
    AudioIcon,
    CalendarIcon,
    CastaliaIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    HelpIcon,
    ImageIcon,
    PlusIcon,
    PollIcon,
    SettingsIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_green.css'
import React, { useContext, useEffect, useRef, useState } from 'react'
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

const ContentButton = (props: {
    type: string
    postType: string
    setPostType: (type: string) => void
}): JSX.Element => {
    const { type, postType, setPostType } = props
    const typeIcons = {
        image: <ImageIcon />,
        audio: <AudioIcon />,
        event: <CalendarIcon />,
        poll: <PollIcon />,
        gbg: <CastaliaIcon />,
    }
    return (
        <button
            className={postType === type ? styles.selected : ''}
            type='button'
            title={capitalise(type)}
            onClick={() => setPostType(postType === type ? 'text' : type)}
        >
            {typeIcons[type]}
        </button>
    )
}

const CreatePostModal = (): JSX.Element => {
    const {
        accountData,
        setCreatePostModalOpen,
        createPostModalSettings,
        setCreatePostModalSettings,
        setAlertModalOpen,
        setAlertMessage,
    } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const [loading, setLoading] = useState(false)
    const [postType, setPostType] = useState('text')
    const [spaces, setSpaces] = useState<any[]>([spaceData.id ? spaceData : defaultSelectedSpace])
    const [showTitle, setShowTitle] = useState(true)
    const [title, setTitle] = useState('')
    const [text, setText] = useState({
        ...defaultErrorState,
        value: '',
        validate: (v) => {
            const errors: string[] = []
            const totalCharacters = findDraftLength(v)
            if (totalCharacters < 1) errors.push('Required')
            if (totalCharacters > 5000) errors.push('Must be less than 5K characters')
            return errors
        },
    })
    const [mentions, setMentions] = useState<any[]>([])
    const [urls, setUrls] = useState<any[]>([])
    const [urlsWithMetaData, setUrlsWithMetaData] = useState<any[]>([])
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [saved, setSaved] = useState(false)
    const [spacesModalOpen, setSpacesModalOpen] = useState(false)
    const cookies = new Cookies()
    const urlRequestIndex = useRef(0)
    const contentButtonTypes = ['image', 'audio', 'event', 'poll', 'gbg']

    function closeModal() {
        setCreatePostModalOpen(false)
        setCreatePostModalSettings({ type: 'text' })
    }

    function scrapeUrlMetaData(url) {
        setUrlsWithMetaData((us) => [...us, { url, loading: true }])
        axios.get(`${config.apiURL}/scrape-url?url=${url}`).then((res) => {
            setUrlsWithMetaData((us) => {
                const newUrlsMetaData = [...us.filter((u) => u.url !== url)]
                newUrlsMetaData.push({ url, loading: false, ...res.data })
                return newUrlsMetaData
            })
        })
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
    const [toalImageSizeError, setTotalImageSizeError] = useState(false)
    const [imagePostError, setImagePostError] = useState(false)

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
        setImagePostError(false)
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
        setImagePostError(false)
    }

    function removeImage(index) {
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
        const megaByte = 1048576
        const totalBytes = images
            .filter((i) => i.file)
            .map((i) => i.file.size)
            .reduce((a, b) => a + b, 0)
        return +(totalBytes / megaByte).toFixed(2)
    }

    // audio
    const [audioFile, setAudioFile] = useState<File | undefined>()
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [noAudioError, setNoAudioError] = useState(false)
    const audioRecorder = useRef<any>(null)
    const audioChunks = useRef<any>([])
    const recordingInterval = useRef<any>(null)

    function resetAudioState() {
        setAudioFile(undefined)
        setNoAudioError(false)
        setRecordingTime(0)
        audioChunks.current = []
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
            audioRecorder.current.stop()
            setRecording(false)
        } else {
            resetAudioState()
            navigator.mediaDevices.getUserMedia({ audio: true }).then((audioStream) => {
                audioRecorder.current = new MediaRecorder(audioStream)
                audioRecorder.current.ondataavailable = (e) => {
                    audioChunks.current.push(e.data)
                }
                audioRecorder.current.onstart = () => {
                    recordingInterval.current = setInterval(() => {
                        setRecordingTime((t) => t + 1)
                    }, 1000)
                }
                audioRecorder.current.onstop = () => {
                    clearInterval(recordingInterval.current)
                    const blob = new Blob(audioChunks.current, { type: 'audio/mpeg-3' })
                    setAudioFile(new File([blob], ''))
                }
                audioRecorder.current.start()
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
    const [pollAnswersLocked, setPollAnswersLocked] = useState(true)
    const [newPollAnswer, setNewPollAnswer] = useState('')
    const [pollAnswers, setPollAnswers] = useState<any[]>([])
    const [pollError, setPollError] = useState(false)
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
            },
        ])
        setNewPollAnswer('')
        setPollError(false)
    }

    function removePollAnswer(id) {
        setPollAnswers(pollAnswers.filter((a) => a.id !== id))
    }

    // gbg
    const [GBGSettingsModalOpen, setGBGSettingsModalOpen] = useState(false)
    const [GBGHelpModalOpen, setGBGHelpModalOpen] = useState(false)
    const [GBGSettings, setGBGSettings] = useState(defaultGBGSettings)
    const [beads, setBeads] = useState<any[]>([])
    const [showBeadTools, setShowBeadTools] = useState(false)

    function saveGBGSettings(settings) {
        console.log('saveGBGSettings: ', settings)
    }

    const showGBGDates = postType === 'gbg' && GBGSettings.synchronous && GBGSettings.startTime
    const showDates = (postType === 'event' || showGBGDates) && startTime

    function createPost() {
        console.log('create post!')
        setSaved(true)
        setTimeout(() => closeModal(), 1000)
    }

    useEffect(() => {
        console.log('first useeffect')
    }, [])

    // initialise date picker if post type is event
    useEffect(() => {
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
    }, [postType])

    // update minimum end date when start date changed
    useEffect(() => {
        if (startTime) {
            const endTimeInstance = d3.select('#date-time-end').node()._flatpickr
            if (endTimeInstance) endTimeInstance.set('minDate', new Date(startTime))
        }
    }, [startTime])

    // grab metadata for new urls when added to text
    useEffect(() => {
        if (urlsWithMetaData.length <= 5) {
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

    return (
        <Modal
            className={`${styles.wrapper} ${styles[postType]}`}
            close={closeModal}
            centered
            confirmClose={!saved}
        >
            {saved ? (
                <SuccessMessage text='Post created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <h1>New post</h1>
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
                            <button
                                className={styles.addSpacesButton}
                                type='button'
                                title='Click to add spaces'
                                onClick={() => setSpacesModalOpen(true)}
                            >
                                + Spaces
                            </button>
                        </Row>
                        <Column className={styles.content}>
                            {showTitle && (
                                <Row centerY spaceBetween className={styles.title}>
                                    <input
                                        placeholder={postType === 'gbg' ? 'Topic...' : 'Title...'}
                                        type='text'
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <CloseButton size={20} onClick={() => setShowTitle(false)} />
                                </Row>
                            )}
                            <DraftTextEditor
                                type='post'
                                stringifiedDraft={text.value}
                                maxChars={5000}
                                state={text.state}
                                errors={text.errors}
                                onChange={(value, textMentions, textUrls) => {
                                    setText({ ...text, value, state: 'default' })
                                    setMentions(textMentions)
                                    setUrls(textUrls)
                                }}
                            />
                            {showDates && (
                                <Row centerY className={styles.dates}>
                                    <CalendarIcon />
                                    <Row>
                                        <p>{findEventTimes(startTime, endTime)}</p>
                                        <p>{findEventDuration(startTime, endTime)}</p>
                                    </Row>
                                </Row>
                            )}
                            {postType === 'image' && (
                                <Row centerX style={{ width: '100%' }}>
                                    {images.length > 0 && (
                                        <Scrollbars className={styles.images}>
                                            <Row>
                                                {images.map((image, index) => (
                                                    <Column
                                                        centerX
                                                        className={`${styles.imageWrapper} ${
                                                            styles[findImageSize()]
                                                        }`}
                                                        key={image.id}
                                                    >
                                                        <CloseButton
                                                            size={20}
                                                            onClick={() => removeImage(index)}
                                                            style={{
                                                                position: 'absolute',
                                                                right: 0,
                                                            }}
                                                        />
                                                        <button
                                                            className={styles.imageButton}
                                                            type='button'
                                                            onClick={() => openImageModal(image.id)}
                                                        >
                                                            <img
                                                                src={
                                                                    image.url ||
                                                                    URL.createObjectURL(image.file)
                                                                }
                                                                alt=''
                                                            />
                                                        </button>
                                                        <Row centerY style={{ width: '100%' }}>
                                                            <Input
                                                                type='text'
                                                                placeholder='add caption...'
                                                                value={image.caption}
                                                                onChange={(v) =>
                                                                    updateCaption(index, v)
                                                                }
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
                                            </Row>
                                        </Scrollbars>
                                    )}
                                </Row>
                            )}
                            {postType === 'audio' && audioFile && (
                                <Audio
                                    key={audioFile.lastModified}
                                    // todo: make optional prop
                                    id={0}
                                    url={URL.createObjectURL(audioFile)}
                                    location='create-post-audio'
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
                                            totalVotes={0}
                                            totalPoints={0}
                                            color={pollColorScale(index)}
                                            close={() => removePollAnswer(answer.id)}
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
                                    {pollError && (
                                        <p className='danger'>At least one answer required</p>
                                    )}
                                </Column>
                            )}
                            {postType === 'gbg' && (
                                <Column className={styles.gbg}>
                                    {GBGSettings.synchronous ? (
                                        <Button
                                            text='Open game room'
                                            color='gbg-white'
                                            size='medium'
                                            style={{ width: 150, marginTop: 15 }}
                                            disabled
                                        />
                                    ) : (
                                        <Column>
                                            {GBGSettings.multiplayer &&
                                                GBGSettings.openToAllUsers && (
                                                    <Row centerY className={styles.openToAllUsers}>
                                                        <UsersIcon />
                                                        <p>Open to all users</p>
                                                    </Row>
                                                )}
                                            <Row centerX>
                                                <Scrollbars className={styles.beadDraw}>
                                                    <Row>
                                                        {beads.map((bead, i) => (
                                                            <Row key={bead.id}>
                                                                <StringBeadCard
                                                                    bead={bead}
                                                                    // postId={id}
                                                                    postType={bead.type}
                                                                    beadIndex={i}
                                                                    location='preview'
                                                                    style={null}
                                                                />
                                                                {/* {(i < stringPosts.length - 1 ||
                                                                movesLeft) && (
                                                                <Row
                                                                    centerY
                                                                    className={styles.beadDivider}
                                                                >
                                                                    <DNAIcon />
                                                                </Row>
                                                            )} */}
                                                            </Row>
                                                        ))}
                                                        {GBGSettings.multiplayer &&
                                                        !GBGSettings.openToAllUsers ? (
                                                            <p>test</p>
                                                        ) : (
                                                            <button
                                                                type='button'
                                                                className={styles.newBeadButton}
                                                                onClick={() =>
                                                                    setShowBeadTools(true)
                                                                }
                                                                style={{
                                                                    marginRight:
                                                                        beads.length > 1 ? 15 : 0,
                                                                }}
                                                            >
                                                                <PlusIcon />
                                                                <p>
                                                                    Click to create the{' '}
                                                                    {beads.length
                                                                        ? 'next'
                                                                        : 'first'}{' '}
                                                                    bead
                                                                </p>
                                                            </button>
                                                        )}
                                                    </Row>
                                                </Scrollbars>
                                            </Row>
                                        </Column>
                                    )}
                                </Column>
                            )}
                            {['text', 'event'].includes(postType) &&
                                urlsWithMetaData.map((u) => (
                                    <UrlPreview
                                        key={u.url}
                                        urlData={u}
                                        loading={u.loading}
                                        removeUrl={removeUrlMetaData}
                                        style={{ marginTop: 10 }}
                                    />
                                ))}
                        </Column>
                    </Column>
                    <Column className={styles.contentOptions}>
                        {postType === 'image' && (
                            <Column>
                                <Row centerY style={{ marginBottom: 20 }}>
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
                                    <p style={{ marginRight: 10 }}>or</p>
                                    <Input
                                        type='text'
                                        placeholder='add image url...'
                                        value={imageURL}
                                        onChange={(v) => setImageURL(v)}
                                        style={{ width: 200, marginRight: 10 }}
                                    />
                                    <Button
                                        text='Add'
                                        color='aqua'
                                        disabled={imageURL === ''}
                                        onClick={addImageURL}
                                    />
                                </Row>
                                {imageSizeError && (
                                    <Column className={styles.errors}>
                                        {imageSizeError && (
                                            <p className='danger' style={{ marginBottom: 10 }}>
                                                Max file size: {imageMBLimit}MB
                                            </p>
                                        )}
                                    </Column>
                                )}
                            </Column>
                        )}
                        {postType === 'audio' && (
                            <Column>
                                <Row centerY style={{ marginBottom: 20 }}>
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
                                </Row>
                                {(audioSizeError || noAudioError) && (
                                    <Column className={styles.errors}>
                                        {audioSizeError && (
                                            <p>Audio file too large. Max size: {audioMBLimit}MB</p>
                                        )}
                                        {noAudioError && <p>Recording or upload required</p>}
                                    </Column>
                                )}
                            </Column>
                        )}
                        {postType === 'event' && (
                            <Row
                                centerY
                                className={styles.dateTimePicker}
                                style={{ marginBottom: 20 }}
                            >
                                <div id='date-time-start-wrapper'>
                                    <Input
                                        id='date-time-start'
                                        type='text'
                                        placeholder='Start time...'
                                    />
                                </div>
                                <p>→</p>
                                <div id='date-time-end-wrapper'>
                                    <Input
                                        id='date-time-end'
                                        type='text'
                                        placeholder='End time... (optional)'
                                    />
                                </div>
                                {endTime && <CloseButton size={20} onClick={removeEndDate} />}
                            </Row>
                        )}
                        {postType === 'poll' && (
                            <Row centerY style={{ marginBottom: 20 }}>
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
                                <Toggle
                                    leftText='Lock answers'
                                    rightText={pollAnswersLocked ? 'ON' : 'OFF'}
                                    positionLeft={!pollAnswersLocked}
                                    rightColor='blue'
                                    onClick={() => setPollAnswersLocked(!pollAnswersLocked)}
                                />
                            </Row>
                        )}
                        {postType === 'gbg' && (
                            <Row style={{ marginBottom: 20 }}>
                                <Button
                                    text='Game settings'
                                    color='aqua'
                                    icon={<SettingsIcon />}
                                    onClick={() => setGBGSettingsModalOpen(true)}
                                />
                                <button
                                    className={styles.helpButton}
                                    type='button'
                                    onClick={() => setGBGHelpModalOpen(true)}
                                >
                                    <HelpIcon />
                                </button>
                            </Row>
                        )}
                    </Column>
                    <Row className={styles.contentButtons}>
                        {contentButtonTypes.map((type) => (
                            <ContentButton
                                key={type}
                                type={type}
                                postType={postType}
                                setPostType={setPostType}
                            />
                        ))}
                    </Row>
                    <Button text='Create post' color='blue' onClick={createPost} />
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
                    saveSettings={(settings) => saveGBGSettings(settings)}
                    close={() => setGBGSettingsModalOpen(false)}
                />
            )}
            {GBGHelpModalOpen && <GBGHelpModal close={() => setGBGHelpModalOpen(false)} />}
        </Modal>
    )
}

export default CreatePostModal
