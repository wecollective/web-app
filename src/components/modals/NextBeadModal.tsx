/* eslint-disable react/no-array-index-key */
import Button from '@components/Button'
import StringBeadCard from '@components/cards/PostCard/StringBeadCard2'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import Input from '@components/Input'
import MarkdownEditor from '@components/MarkdownEditor'
import Modal from '@components/Modal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import SuccessMessage from '@components/SuccessMessage'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { defaultErrorState, formatTimeMMSS, isValidUrl } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/NextBeadModal.module.scss'
import { ReactComponent as ChevronLeftIcon } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as ChevronRightIcon } from '@svgs/chevron-right-solid.svg'
import { ReactComponent as TextIcon } from '@svgs/font-solid.svg'
import { ReactComponent as ImageIcon } from '@svgs/image-solid.svg'
import { ReactComponent as UrlIcon } from '@svgs/link-solid.svg'
import { ReactComponent as PlusIcon } from '@svgs/plus.svg'
import { ReactComponent as AudioIcon } from '@svgs/volume-high-solid.svg'
import axios from 'axios'
import * as d3 from 'd3'
import getBlobDuration from 'get-blob-duration'
import React, { useContext, useRef, useState } from 'react'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'

const { white, red, orange, yellow, green, blue, purple } = colors
const beadColors = [white, red, orange, yellow, green, blue, purple]

const NextBeadModal = (props: {
    postData: any
    setPostData: (data: any) => void
    close: () => void
}): JSX.Element => {
    const { accountData } = useContext(AccountContext)
    const { postData, setPostData, close } = props
    const { id, Weave, StringPlayers, StringPosts } = postData
    const {
        numberOfTurns,
        allowedBeadTypes,
        characterLimit,
        audioTimeLimit,
        // fixedPlayerColors,
        // moveTimeWindow,
        privacy,
    } = Weave
    const beadIndex = StringPosts.length + 1
    const playerData = StringPlayers.find((p) => p.id === accountData.id)
    const playerColor = playerData ? playerData.UserPost.color : null
    const defaultBead = {
        id: uuidv4(),
        type: allowedBeadTypes.split(',')[0].toLowerCase(),
        color: playerColor || colors.white,
        text: '',
        url: '',
        urlData: null,
        audioFile: null,
        audioBlob: null,
        audioType: '',
        images: [],
    }
    const [newBead, setNewBead] = useState<any>(defaultBead)
    const totalMBUploadLimit = 10
    const cookies = new Cookies()
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    function findNextPlayerId() {
        if (StringPosts.length + 1 < StringPlayers.length * numberOfTurns) {
            return StringPlayers[(StringPosts.length + 1) % StringPlayers.length].id
        }
        return null
    }

    // text
    const [stringTextState, setStringTextState] = useState<'default' | 'valid' | 'invalid'>(
        'default'
    )
    const [stringTextErrors, setStringTextErrors] = useState<string[]>([])
    const [characterLimitError, setCharacterLimitError] = useState(false)

    // url
    const [urlLoading, setUrlLoading] = useState(false)
    const [urlForm1, setUrlForm1] = useState({
        url: {
            ...defaultErrorState,
            value: '',
            validate: (v) => (!isValidUrl(v) ? ['Must be a valid URL'] : []),
        },
    })

    // audio
    const [audioFile, setAudioFile] = useState<File>()
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [audioTimeError, setAudioTimeError] = useState(false)
    const [showRecordControls, setShowRecordControls] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const audioRecorderRef = useRef<any>(null)
    const audioChunksRef = useRef<any>([])
    const recordingIntervalRef = useRef<any>(null)
    const timeLimitReachedRef = useRef(false)
    const audioMBLimit = 5

    // images
    const [images, setImages] = useState<any[]>([])
    const [imageURL, setImageURL] = useState('')
    const [imageSizeError, setImageSizeError] = useState(false)
    const [toalImageSizeError, setTotalImageSizeError] = useState(false)
    const [imagePostError, setImagePostError] = useState(false)
    const imageMBLimit = 2
    const totalImageSize =
        images.map((image) => (image.file ? image.file.size : 0)).reduce((a, b) => a + b, 0) /
        (1024 * 1024)

    function scrapeURL(urlString) {
        if (isValidUrl(urlString)) {
            setUrlForm1({
                ...urlForm1,
                url: { ...urlForm1.url, value: urlString, state: 'default', errors: [] },
            })
            setUrlLoading(true)
            axios
                .get(`${config.apiURL}/scrape-url?url=${urlString}`)
                .then((res) => {
                    setNewBead({
                        ...newBead,
                        url: urlString,
                        urlData: res.data,
                    })
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
            setNewBead({
                ...newBead,
                url: urlString,
                urlData: null,
            })
        }
    }

    function resetAudioState() {
        setAudioFile(undefined)
        setRecordingTime(0)
        audioChunksRef.current = []
        timeLimitReachedRef.current = false
        const input = d3.select('#audio-file-input').node()
        if (input) input.value = ''
    }

    async function selectAudioFile() {
        setShowRecordControls(false)
        const input = d3.select('#audio-file-input').node()
        if (input && input.files && input.files[0]) {
            const duration = await getBlobDuration(URL.createObjectURL(input.files[0]))
            if (input.files[0].size > audioMBLimit * 1024 * 1024) {
                setAudioSizeError(true)
                resetAudioState()
                setNewBead({ ...defaultBead, type: newBead.type })
            } else if (duration > audioTimeLimit + 1 || duration < audioTimeLimit - 1) {
                setAudioTimeError(true)
                resetAudioState()
                setNewBead({ ...defaultBead, type: newBead.type })
            } else {
                setAudioSizeError(false)
                setAudioTimeError(false)
                setNewBead({
                    ...newBead,
                    id: uuidv4(),
                    audioFile: input.files[0],
                    audioType: 'file',
                })
            }
        }
    }

    function toggleAudioRecording() {
        if (recording) {
            audioRecorderRef.current.stop()
            setRecording(false)
            if (audioTimeLimit) resetAudioState()
        } else {
            resetAudioState()
            navigator.mediaDevices.getUserMedia({ audio: true }).then((audio) => {
                audioRecorderRef.current = new MediaRecorder(audio)
                audioRecorderRef.current.ondataavailable = (e) => {
                    audioChunksRef.current.push(e.data)
                }
                audioRecorderRef.current.onstart = () => {
                    let time = 0
                    recordingIntervalRef.current = setInterval(() => {
                        time += 1
                        setRecordingTime(time)
                        if (audioTimeLimit && audioTimeLimit === time) {
                            timeLimitReachedRef.current = true
                            clearInterval(recordingIntervalRef.current)
                            audioRecorderRef.current.stop()
                            setRecording(false)
                        }
                    }, 1000)
                }
                audioRecorderRef.current.onstop = async () => {
                    clearInterval(recordingIntervalRef.current)
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/mpeg-3' })
                    if (!audioTimeLimit || timeLimitReachedRef.current) {
                        setNewBead({
                            ...newBead,
                            id: uuidv4(),
                            audioFile: new File([blob], ''),
                            audioBlob: blob,
                            audioType: 'recording',
                        })
                    }
                }
                audioRecorderRef.current.start()
                setRecording(true)
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

    function saveBead() {
        if (newBead.type === 'image' && totalImageSize >= totalMBUploadLimit) {
            setTotalImageSizeError(true)
        } else {
            setLoading(true)
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const beadData = {
                postId: id,
                beadIndex,
                privacy,
                nextPlayerId: findNextPlayerId(),
                type: newBead.type,
                color: newBead.color,
                text: newBead.text,
                url: newBead.url,
                urlData: newBead.urlData,
            }
            let fileData
            let uploadType
            if (newBead.type === 'audio') {
                const isBlob = newBead.audioFile && !newBead.audioFile.name
                uploadType = isBlob ? 'audio-blob' : 'audio-file'
                fileData = new FormData()
                fileData.append(
                    'file',
                    isBlob
                        ? new Blob(audioChunksRef.current, { type: 'audio/mpeg-3' })
                        : newBead.audioFile
                )
                fileData.append('beadData', JSON.stringify(beadData))
                options.headers['Content-Type'] = 'multipart/form-data'
            }
            if (newBead.type === 'image') {
                uploadType = 'image-post'
                fileData = new FormData()
                images.forEach((image, index) => {
                    if (image.file) fileData.append('file', image.file, index)
                })
                fileData.append('imageData', JSON.stringify(images))
                fileData.append('beadData', JSON.stringify(beadData))
            }
            axios
                .post(
                    `${config.apiURL}/create-next-weave-bead?uploadType=${uploadType}`,
                    fileData || beadData,
                    options
                )
                .then((res) => {
                    setSaved(true)
                    setLoading(false)
                    setPostData({
                        ...postData,
                        Weave: {
                            ...Weave,
                            nextMoveDeadline: res.data.newDeadline,
                        },
                        StringPosts: [
                            ...StringPosts,
                            {
                                ...res.data.bead,
                                Link: { index: beadIndex },
                                PostImages: res.data.imageData || [],
                                Creator: {
                                    id: accountData.id,
                                    name: accountData.name,
                                    flagImagePath: accountData.flagImagePath,
                                },
                            },
                        ],
                    })
                    setTimeout(() => close(), 1000)
                })
        }
    }

    return (
        <Modal centered close={close}>
            {saved ? (
                <SuccessMessage text='Bead created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <h1>Add a new bead</h1>
                    <Row centerX className={styles.beadTypeButtons}>
                        {allowedBeadTypes.includes('Text') && (
                            <button
                                type='button'
                                className={`${newBead.type === 'text' && styles.selected}`}
                                onClick={() => setNewBead({ ...newBead, type: 'text' })}
                            >
                                <TextIcon />
                            </button>
                        )}
                        {allowedBeadTypes.includes('Url') && (
                            <button
                                type='button'
                                className={`${newBead.type === 'url' && styles.selected}`}
                                onClick={() => setNewBead({ ...newBead, type: 'url' })}
                            >
                                <UrlIcon />
                            </button>
                        )}
                        {allowedBeadTypes.includes('Audio') && (
                            <button
                                type='button'
                                className={`${newBead.type === 'audio' && styles.selected}`}
                                onClick={() => setNewBead({ ...newBead, type: 'audio' })}
                            >
                                <AudioIcon />
                            </button>
                        )}
                        {allowedBeadTypes.includes('Image') && (
                            <button
                                type='button'
                                className={`${newBead.type === 'image' && styles.selected}`}
                                onClick={() => setNewBead({ ...newBead, type: 'image' })}
                            >
                                <ImageIcon />
                            </button>
                        )}
                    </Row>
                    <Column centerX style={{ width: '100%' }}>
                        {newBead.type === 'text' && (
                            <Column centerX style={{ maxWidth: 500 }}>
                                {characterLimit && (
                                    <p
                                        className={characterLimitError ? 'danger' : ''}
                                        style={{ marginBottom: 20 }}
                                    >
                                        {newBead.text.length}/{characterLimit} characters
                                    </p>
                                )}
                                <MarkdownEditor
                                    initialValue={newBead.text}
                                    onChange={(value) => {
                                        setCharacterLimitError(value.length > characterLimit)
                                        setStringTextErrors([])
                                        setStringTextState('default')
                                        setNewBead({ ...newBead, text: value })
                                    }}
                                    state={stringTextState}
                                    errors={stringTextErrors}
                                />
                            </Column>
                        )}
                        {newBead.type === 'url' && (
                            <Column centerX style={{ width: '100%' }}>
                                <Input
                                    type='text'
                                    placeholder='url...'
                                    state={urlForm1.url.state}
                                    errors={urlForm1.url.errors}
                                    value={urlForm1.url.value}
                                    loading={urlLoading}
                                    onChange={(value) => {
                                        setNewBead({ ...newBead, url: value })
                                        scrapeURL(value)
                                    }}
                                    style={{ width: '100%' }}
                                />
                            </Column>
                        )}
                        {newBead.type === 'audio' && (
                            <Column centerX style={{ width: '100%' }}>
                                {audioSizeError && (
                                    <p className='danger' style={{ marginBottom: 10 }}>
                                        Audio too large. Max size: {audioMBLimit}MB
                                    </p>
                                )}
                                {audioTimeLimit && (
                                    <p
                                        className={audioTimeError ? 'danger' : ''}
                                        style={{ marginBottom: 20 }}
                                    >
                                        Audio length: {audioTimeLimit} seconds
                                    </p>
                                )}
                                <Row style={{ marginBottom: 10 }}>
                                    <Button
                                        text='Record audio'
                                        color='grey'
                                        style={{ marginRight: 10 }}
                                        onClick={() => {
                                            resetAudioState()
                                            setAudioSizeError(false)
                                            setAudioTimeError(false)
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
                                {showRecordControls && (
                                    <Column centerX style={{ marginBottom: 20 }}>
                                        <h2>{formatTimeMMSS(recordingTime)}</h2>
                                        <Button
                                            text={`${
                                                recording
                                                    ? `${audioTimeLimit ? 'Reset' : 'Stop'}`
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
                            <Column centerX style={{ width: '100%' }}>
                                {imagePostError && (
                                    <p className='danger' style={{ marginBottom: 10 }}>
                                        No images added yet
                                    </p>
                                )}
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
                                <Row centerX style={{ width: '100%' }}>
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
                                                    <Row centerX className={styles.itemFooter}>
                                                        {index !== 0 && (
                                                            <button
                                                                type='button'
                                                                onClick={() => moveImage(index, -1)}
                                                            >
                                                                <ChevronLeftIcon />
                                                            </button>
                                                        )}
                                                        {index < images.length - 1 && (
                                                            <button
                                                                type='button'
                                                                onClick={() => moveImage(index, 1)}
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
                            </Column>
                        )}
                        {((newBead.type === 'text' && newBead.text.length > 0) ||
                            (newBead.type === 'url' && newBead.urlData !== null) ||
                            (newBead.type === 'audio' && newBead.audioFile) ||
                            (newBead.type === 'image' && images.length > 0)) && (
                            <Column centerX style={{ margin: '20px 0' }}>
                                {!playerColor && (
                                    <Row centerY className={styles.colorButtons}>
                                        {beadColors.map((color) => (
                                            <button
                                                key={color}
                                                type='button'
                                                aria-label='color'
                                                onClick={() => setNewBead({ ...newBead, color })}
                                                className={`${
                                                    newBead.color === color && styles.selected
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </Row>
                                )}
                                <StringBeadCard
                                    key={newBead.id}
                                    bead={{
                                        ...newBead,
                                        type: `string-${newBead.type.toLowerCase()}`,
                                        PostImages: images.map((image, index) => {
                                            return {
                                                id: uuidv4(),
                                                index,
                                                caption: image.caption,
                                                url: image.url || URL.createObjectURL(image.file),
                                            }
                                        }),
                                        url:
                                            newBead.type === 'audio'
                                                ? URL.createObjectURL(newBead.audioFile)
                                                : newBead.url,
                                        urlImage: newBead.urlData ? newBead.urlData.image : null,
                                        urlDomain: newBead.urlData ? newBead.urlData.domain : null,
                                        urlDescription: newBead.urlData
                                            ? newBead.urlData.description
                                            : null,
                                        urlTitle: newBead.urlData ? newBead.urlData.title : null,
                                        Creator: {
                                            id: accountData.id,
                                            name: accountData.name,
                                            flagImagePath: accountData.flagImagePath,
                                        },
                                        Link: {
                                            relationship: null,
                                        },
                                    }}
                                    postType='weave'
                                    beadIndex={0}
                                    location='next-bead-modal'
                                />
                            </Column>
                        )}
                        <Button
                            text='Add bead'
                            color='aqua'
                            disabled={
                                (newBead.type === 'text' && newBead.text.length < 1) ||
                                (newBead.type === 'text' &&
                                    characterLimit &&
                                    newBead.text.length > characterLimit) ||
                                (newBead.type === 'url' &&
                                    (newBead.urlData === null || urlLoading)) ||
                                (newBead.type === 'audio' && newBead.audioFile === null) ||
                                (newBead.type === 'image' && !images.length)
                            }
                            loading={loading}
                            onClick={saveBead}
                            style={{ margin: '20px 0' }}
                        />
                    </Column>
                </Column>
            )}
        </Modal>
    )
}

export default NextBeadModal
