/* eslint-disable react/no-array-index-key */
import React, { useState, useRef, useContext } from 'react'
import * as d3 from 'd3'
import Cookies from 'universal-cookie'
import axios from 'axios'
import config from '@src/Config'
import { v4 as uuidv4 } from 'uuid'
import { defaultErrorState, isValidUrl, formatTimeMMSS } from '@src/Helpers'
import styles from '@styles/components/modals/NextBeadModal.module.scss'
import { AccountContext } from '@src/contexts/AccountContext'
import Modal from '@components/Modal'
import Column from '@components/Column'
import Row from '@components/Row'
import Button from '@components/Button'
import Input from '@components/Input'
import Scrollbars from '@components/Scrollbars'
import CloseButton from '@components/CloseButton'
import StringBeadCard from '@components/Cards/PostCard/StringBeadCard2'
import SuccessMessage from '@components/SuccessMessage'
import { ReactComponent as TextIcon } from '@svgs/font-solid.svg'
import { ReactComponent as UrlIcon } from '@svgs/link-solid.svg'
import { ReactComponent as AudioIcon } from '@svgs/volume-high-solid.svg'
import { ReactComponent as ImageIcon } from '@svgs/image-solid.svg'
import { ReactComponent as PlusIcon } from '@svgs/plus.svg'
import { ReactComponent as ChevronLeftIcon } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as ChevronRightIcon } from '@svgs/chevron-right-solid.svg'

const NextBeadModal = (props: {
    beadIndex: number
    postData: any
    setPostData: (data: any) => void
    close: () => void
}): JSX.Element => {
    const { beadIndex, postData, setPostData, close } = props
    const { accountData } = useContext(AccountContext)

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
    const [newBead, setNewBead] = useState<any>(defaultBead)
    const totalMBUploadLimit = 10
    const cookies = new Cookies()
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    function findNextPlayerId() {
        if (
            postData.StringPosts.length + 1 <
            postData.StringPlayers.length * postData.Weave.numberOfTurns
        ) {
            return postData.StringPlayers[
                (postData.StringPosts.length + 1) % postData.StringPlayers.length
            ].id
        }
        return null
    }

    // text
    const [stringTextState, setStringTextState] = useState<'default' | 'valid' | 'invalid'>(
        'default'
    )
    const [stringTextErrors, setStringTextErrors] = useState<string[]>([])

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
    const [showRecordControls, setShowRecordControls] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const audioRecorderRef = useRef<any>(null)
    const audioChunksRef = useRef<any>([])
    const recordingIntervalRef = useRef<any>(null)
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
                setAudioSizeError(false)
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
                    setNewBead({
                        ...newBead,
                        id: uuidv4(),
                        audioFile: new File([blob], ''),
                        audioBlob: blob,
                        audioType: 'recording',
                    })
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
                postId: postData.id,
                beadIndex,
                privacy: postData.Weave.privacy,
                nextPlayerId: findNextPlayerId(),
                type: newBead.type,
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
                        StringPosts: [
                            ...postData.StringPosts,
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
                    <Column centerX style={{ width: '100%' }}>
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
                                style={{ width: '100%' }}
                            />
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
                        {((newBead.type === 'text' && newBead.text) ||
                            (newBead.type === 'url' && newBead.urlData !== null) ||
                            (newBead.type === 'audio' && newBead.audioFile) ||
                            (newBead.type === 'image' && images.length > 0)) && (
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
                                }}
                                postId={0}
                                postType='weave'
                                beadIndex={0}
                                location='test'
                                style={{ marginTop: 20 }}
                            />
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
