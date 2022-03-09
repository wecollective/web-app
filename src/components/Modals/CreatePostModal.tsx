/* eslint-disable no-param-reassign */
import React, { useContext, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as d3 from 'd3'
import axios from 'axios'
import Cookies from 'universal-cookie'
import { SpaceContext } from '@contexts/SpaceContext'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import styles from '@styles/components/modals/CreatePostModal.module.scss'
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
// import PostCard from '@components/Cards/PostCard/PostCard'
import { allValid, defaultErrorState, isValidUrl, formatTimeMMSS } from '@src/Functions'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import Scrollbars from '@components/Scrollbars'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'

const CreatePostModal = (): JSX.Element => {
    // todo: set create post modal open in page instead of account context
    const { accountData, setCreatePostModalOpen, createPostModalType } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const [formData, setFormData] = useState({
        postType: {
            value: createPostModalType,
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
    const { postType, text, url, topic, topicGroup, topicImage } = formData
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([])
    const [urlLoading, setUrlLoading] = useState(false)
    const [urlImage, setUrlImage] = useState(null)
    const [urlDomain, setUrlDomain] = useState(null)
    const [urlTitle, setUrlTitle] = useState(null)
    const [urlDescription, setUrlDescription] = useState(null)
    const [selectedTopicGroup, setSelectedTopicGroup] = useState('archetopics')
    const [selectedTopic, setSelectedTopic] = useState<any>(null)
    const [audioFile, setAudioFile] = useState<File>()
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [showRecordControls, setShowRecordControls] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioPostError, setAudioPostError] = useState(false)
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [previewRenderKey, setPreviewRenderKey] = useState(0)
    const audioRecorderRef = useRef<any>(null)
    const audioChunksRef = useRef<any>([])
    const recordingIntervalRef = useRef<any>(null)
    const cookies = new Cookies()
    const audioMBLimit = 100

    function updateValue(name, value) {
        let resetState = {}
        if (name === 'postType') {
            resetState = {
                text: { ...formData.text, state: 'default' },
                url: { ...formData.url, value: '', state: 'default' },
                topic: { ...formData.topic, value: '', state: 'default' },
                topicGroup: { ...formData.topicGroup, value: '', state: 'default' },
                topicImage: { ...formData.topicImage, value: '', state: 'default' },
            }
            setUrlImage(null)
            setUrlDomain(null)
            setUrlTitle(null)
            setUrlDescription(null)
        }
        setFormData({
            ...formData,
            [name]: { ...formData[name], value, state: 'default' },
            ...resetState,
        })
        setPreviewRenderKey((k) => k + 1)
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
        setPreviewRenderKey((k) => k + 1)
    }

    function removeSpace(spaceId) {
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    const scrapeURL = (urlString: string): void => {
        if (isValidUrl(urlString)) {
            setUrlLoading(true)
            axios
                .get(`${config.apiURL}/scrape-url?url=${urlString}`)
                .then((res) => {
                    const { description, domain, image, title } = res.data
                    setUrlDescription(description)
                    setUrlDomain(domain)
                    setUrlImage(image)
                    setUrlTitle(title)
                    setUrlLoading(false)
                    setPreviewRenderKey((k) => k + 1)
                })
                .catch((error) => console.log(error))
        } else {
            console.log('invalid Url')
            // setUrlFlashMessage('invalid Url')
        }
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
        const input = d3.select('#file-input').node()
        if (input && input.files && input.files[0]) {
            if (input.files[0].size > audioMBLimit * 1024 * 1024) {
                setAudioSizeError(true)
                resetAudioState()
            } else {
                setAudioSizeError(false)
                setAudioPostError(false)
                setAudioFile(input.files[0])
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
                    setAudioFile(new File([blob], ''))
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

    function createPost(e) {
        e.preventDefault()
        // add validation with latest values to form data (todo: avoid this set using refs?)
        const newFormData = {
            postType: {
                ...postType,
                required: false,
            },
            text: {
                ...text,
                required: !['Url', 'Audio'].includes(postType.value),
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
            if (postType.value === 'Audio' && !audioFile) {
                if (!audioSizeError) setAudioPostError(true)
            } else {
                setLoading(true)
                const accessToken = cookies.get('accessToken')
                const options = { headers: { Authorization: `Bearer ${accessToken}` } }
                const postData = {
                    type: postType.value.replace(/\s+/g, '-').toLowerCase(),
                    text: text.value || null,
                    url: url.value || null,
                    urlImage,
                    urlDomain,
                    urlTitle,
                    urlDescription,
                    topic: selectedTopic ? selectedTopic.name : topic.value,
                    topicGroup: selectedTopic ? selectedTopicGroup : null,
                    topicImage: selectedTopic ? selectedTopic.imagePath : null,
                    spaceHandles: [spaceData.handle, ...selectedSpaces.map((s) => s.handle)],
                }
                let fileData
                let type
                if (postType.value === 'Audio') {
                    fileData = new FormData()
                    const isBlob = audioFile && !audioFile.name
                    fileData.append(
                        'file',
                        isBlob
                            ? new Blob(audioChunksRef.current, { type: 'audio/mpeg-3' })
                            : audioFile
                    )
                    fileData.append('postData', JSON.stringify(postData))
                    type = isBlob ? 'audio-blob' : 'audio-file'
                    options.headers['Content-Type'] = 'multipart/form-data'
                }
                axios
                    .post(
                        `${config.apiURL}/create-post?type=${type}`,
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
                            ...res.data,
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
                            GlassBeadGame: {
                                topic: selectedTopic ? selectedTopic.name : topic.value,
                                topicGroup: selectedTopic ? selectedTopicGroup : null,
                                topicImage: selectedTopic ? selectedTopic.imagePath : null,
                                GlassBeads: [],
                            },
                            Reactions: [],
                            IncomingLinks: [],
                            OutgoingLinks: [],
                        }
                        setSpacePosts([newPost, ...spacePosts])
                        setTimeout(() => setCreatePostModalOpen(false), 1000)
                    })
                    .catch((error) => {
                        const { message } = error.response.data
                        switch (message) {
                            case 'File size too large':
                                setAudioSizeError(true)
                                break
                            default:
                                console.log('error: ', error)
                                break
                        }
                        setLoading(false)
                    })
            }
        }
    }

    function textTitle() {
        switch (postType.value) {
            case 'Url':
            case 'Audio':
                return 'Text (optional)'
            case 'Glass Bead Game':
                return 'Add a description for the game'
            default:
                return 'Text'
        }
    }

    function textPlaceholder() {
        switch (postType.value) {
            case 'Glass Bead Game':
                return 'description...'
            default:
                return 'text...'
        }
    }

    const postTypeName = ['Text', 'Url', 'Audio'].includes(postType.value)
        ? `${postType.value.toLowerCase()} post`
        : postType.value

    return (
        <Modal close={() => setCreatePostModalOpen(false)} centered>
            <h1>
                Create a new {postTypeName} in{' '}
                <Link to={`/s/${spaceData.handle}`} onClick={() => setCreatePostModalOpen(false)}>
                    {spaceData.name}
                </Link>
            </h1>
            <form onSubmit={createPost}>
                <Column style={{ width: 700 }}>
                    {createPostModalType !== 'Glass Bead Game' && (
                        <DropDownMenu
                            title='Post Type'
                            options={['Text', 'Url', 'Audio', 'Glass Bead Game']}
                            selectedOption={postType.value}
                            setSelectedOption={(value) => updateValue('postType', value)}
                            orientation='horizontal'
                            style={{ marginBottom: 10 }}
                        />
                    )}
                    {postType.value === 'Glass Bead Game' && (
                        <Column style={{ marginTop: 5 }}>
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
                    {postType.value === 'Url' && (
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
                                    <label htmlFor='file-input'>
                                        Upload audio
                                        <input
                                            type='file'
                                            id='file-input'
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
                                        audioId='new-post-audio'
                                        numberOfBars={160}
                                        color='#cbd8ff'
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
                                            audioSource={URL.createObjectURL(audioFile)}
                                            audioId='new-post-audio'
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
                                    <Row>
                                        <Button
                                            text={`${
                                                recording
                                                    ? 'Stop'
                                                    : `${audioFile ? 'Restart' : 'Start'}`
                                            } recording`}
                                            color={recording ? 'red' : 'aqua'}
                                            style={{ marginRight: 10 }}
                                            onClick={toggleAudioRecording}
                                        />
                                    </Row>
                                </Column>
                            )}
                        </Column>
                    )}
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
                    {/* <Column style={{ margin: '20px 0 10px 0' }}>
                        <h2>Post preview</h2>
                        <PostCard
                            key={previewRenderKey}
                            location='preview'
                            post={{
                                text:
                                    postType.value === 'Url'
                                        ? text.value
                                        : text.value || '*sample text*',
                                type: postType.value.toLowerCase().split(' ').join('-'),
                                url: url.value,
                                urlImage,
                                urlDomain,
                                urlTitle,
                                urlDescription,
                                totalComments: 0,
                                totalLikes: 0,
                                totalRatings: 0,
                                totalReposts: 0,
                                totalLinks: 0,
                                Creator: {
                                    handle: accountData.handle,
                                    name: accountData.name,
                                    flagImagePath: accountData.flagImagePath,
                                },
                                DirectSpaces: [
                                    {
                                        ...spaceData,
                                        type: 'post',
                                        state: 'active',
                                    },
                                    ...selectedSpaces.map((s) => {
                                        return {
                                            ...s,
                                            type: 'post',
                                            state: 'active',
                                        }
                                    }),
                                ],
                                GlassBeadGame: {
                                    topic: topic.value,
                                    GlassBeads: [],
                                },
                            }}
                        />
                    </Column> */}
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
                            submit
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
