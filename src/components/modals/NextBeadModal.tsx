/* eslint-disable react/no-array-index-key */
import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import Input from '@components/Input'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import AudioCard from '@components/cards/PostCard/AudioCard'
import UrlPreview from '@components/cards/PostCard/UrlCard'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import ImageModal from '@components/modals/ImageModal'
import Modal from '@components/modals/Modal'
import config from '@src/Config'
import {
    audioMBLimit,
    capitalise,
    defaultPostData,
    findDraftLength,
    formatTimeMMSS,
    imageMBLimit,
    postTypeIcons,
} from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/NextBeadModal2.module.scss'
import axios from 'axios'
import * as d3 from 'd3'
import getBlobDuration from 'get-blob-duration'
import React, { useContext, useEffect, useRef, useState } from 'react'
import RecordRTC from 'recordrtc'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'

const { white, red, orange, yellow, green, blue, purple } = colors
const beadColors = [white, red, orange, yellow, green, blue, purple]

function NextBeadModal(props: {
    location: 'new-gbg' | 'existing-gbg'
    postId?: number
    settings: any
    players: any[]
    addBead: (bead: any) => void
    close: () => void
}): JSX.Element {
    const { accountData, setAlertMessage, setAlertModalOpen } = useContext(AccountContext)
    const { location, postId, settings, players, addBead, close } = props
    const { allowedBeadTypes, characterLimit, moveDuration, moveTimeWindow } = settings
    const [type, setType] = useState(allowedBeadTypes[0])
    const [color, setColor] = useState('#fff')
    const [showColors, setShowColors] = useState(true)
    const [text, setText] = useState('')
    const [mentions, setMentions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const maxChars = characterLimit || 5000
    const cookies = new Cookies()

    // url
    const [url, setUrl] = useState('')
    const [urlData, setUrlData] = useState<any>(null)
    const [urlLoading, setUrlLoading] = useState(false)

    function scrapeUrl() {
        setUrlLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/scrape-url?url=${url}`, options)
            .then((res) => {
                setUrlData({ url, ...res.data })
                setUrl('')
                setUrlLoading(false)
            })
            .catch((error) => console.log(error))
    }

    // audio
    const [audioFile, setAudioFile] = useState<File | undefined>()
    const [audioBlob, setAudioBlob] = useState<any>()
    const [audioType, setAudioType] = useState('')
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [audioTimeError, setAudioTimeError] = useState(false)
    const audioRecorder = useRef<any>(null)
    const recordingInterval = useRef<any>(null)

    function resetAudioState() {
        setAudioFile(undefined)
        setRecordingTime(0)
        const input = d3.select('#bead-audio-file-input').node()
        if (input) input.value = ''
    }

    async function selectAudioFile() {
        const input = d3.select('#bead-audio-file-input').node()
        if (input && input.files && input.files[0]) {
            const duration = await getBlobDuration(URL.createObjectURL(input.files[0]))
            if (input.files[0].size > audioMBLimit * 1024 * 1024) {
                setAudioSizeError(true)
                setAudioTimeError(false)
                resetAudioState()
            } else if (moveDuration && Math.trunc(duration) > moveDuration) {
                setAudioTimeError(true)
                setAudioSizeError(false)
                resetAudioState()
            } else {
                setAudioSizeError(false)
                setAudioTimeError(false)
                setAudioFile(input.files[0])
                setAudioType('file')
            }
        }
    }

    function stopAudioRecording() {
        audioRecorder.current.stopRecording(() => {
            clearInterval(recordingInterval.current)
            const blob = audioRecorder.current.getBlob()
            setAudioBlob(blob)
            setAudioFile(new File([blob], '', { type: 'audio/wav' }))
            setAudioType('recording')
        })
        setRecording(false)
    }

    function toggleAudioRecording() {
        if (recording) stopAudioRecording()
        else {
            resetAudioState()
            setAudioSizeError(false)
            setAudioTimeError(false)
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
                    let time = 0
                    recordingInterval.current = setInterval(() => {
                        time += 1
                        setRecordingTime(time)
                        if (moveDuration && moveDuration === time) {
                            clearInterval(recordingInterval.current)
                            stopAudioRecording()
                        }
                    }, 1000)
                    setRecording(true)
                })
        }
    }

    function renderAudioControls() {
        return (
            <Column centerY centerX style={{ height: '100%' }}>
                <Row className={styles.fileUploadInput}>
                    <label htmlFor='bead-audio-file-input'>
                        Upload audio
                        <input
                            type='file'
                            id='bead-audio-file-input'
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
                    <p style={{ marginTop: 10, fontSize: 20 }}>{formatTimeMMSS(recordingTime)}</p>
                )}
                {audioSizeError && (
                    <p className='danger' style={{ marginTop: 10 }}>
                        Max size: {audioMBLimit}MB
                    </p>
                )}
                {!!moveDuration && (
                    <p className={audioTimeError ? 'danger' : 'grey'} style={{ marginTop: 10 }}>
                        {recording
                            ? `Recording will end in ${moveDuration - recordingTime} secs`
                            : `Max duration: ${moveDuration} secs`}
                    </p>
                )}
            </Column>
        )
    }

    // images
    const [image, setImage] = useState<any>(null)
    const [imageURL, setImageURL] = useState('')
    const [imageSizeError, setImageSizeError] = useState(false)
    const [imageModalOpen, setImageModalOpen] = useState(false)

    function addImageFile() {
        setImageSizeError(false)
        const input = document.getElementById('bead-image-file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            if (input.files[0].size > imageMBLimit * 1024 * 1024) setImageSizeError(true)
            else setImage({ file: input.files[0], url: '' }) // id: uuidv4()
        }
    }

    function addImageURL() {
        setImage({ file: null, url: imageURL }) // id: uuidv4()
        setImageURL('')
        setImageSizeError(false)
    }

    function disable() {
        const chars = findDraftLength(text)
        if (type === 'text' && (chars < 1 || chars > maxChars)) return true
        if (type === 'url' && !urlData) return true
        if (type === 'audio' && !audioFile) return true
        if (type === 'image' && !image) return true
        return false
    }

    function uploadBead(bead) {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const beadData = {
            ...bead,
            creatorName: accountData.name,
            creatorHandle: accountData.handle,
            postId,
            mentions: bead.type === 'text' ? bead.mentions.map((m) => m.link) : [],
        }
        let fileData
        let uploadType
        if (bead.type === 'audio') {
            uploadType = `audio-${audioType === 'recording' ? 'blob' : 'file'}`
            fileData = new FormData()
            fileData.append('file', audioType === 'recording' ? audioBlob : audioFile)
            fileData.append('beadData', JSON.stringify(beadData))
        }
        if (bead.type === 'image' && bead.Images[0].file) {
            uploadType = 'image-file'
            fileData = new FormData()
            fileData.append('file', bead.Images[0].file)
            fileData.append('beadData', JSON.stringify(beadData))
        }
        axios
            .post(
                `${config.apiURL}/create-next-bead?uploadType=${uploadType}`,
                fileData || beadData,
                options
            )
            .then((res) => {
                console.log('create-next-bead res: ', res.data)
                setSaved(true)
                setLoading(false)
                addBead({
                    ...defaultPostData,
                    ...bead,
                    id: res.data.bead.id,
                    nextMoveDeadline: res.data.newDeadline || null,
                })
                setTimeout(() => close(), 1000)
            })
            .catch((error) => {
                console.log('error: ', error)
                if (error.response.status === 401) {
                    setAlertMessage('Your session has run out. Please log in again.')
                    setAlertModalOpen(true)
                }
            })
    }

    function saveBead() {
        const bead = {
            id: uuidv4(),
            type,
            color,
            Link: { source: null },
            Creator: accountData,
            accountLike: 0,
            accountLink: 0,
            accountRating: 0,
            accountRepost: 0,
        } as any
        if (type === 'text') {
            bead.text = text
            bead.mentions = mentions
        }
        if (type === 'url') bead.Urls = [urlData]
        if (type === 'audio') {
            bead.Audios = [{ type: audioType, file: audioFile, blob: audioBlob }]
        }
        if (type === 'image') bead.Images = [image]
        // save
        if (location === 'existing-gbg') uploadBead(bead)
        else {
            addBead(bead)
            close()
        }
    }

    useEffect(() => {
        if (players.length) {
            const accountPlayer = players.find((p) => p.id === accountData.id)
            if (accountPlayer.UserPost.color) {
                setColor(accountPlayer.UserPost.color)
                setShowColors(false)
            }
        }
    }, [])

    return (
        <Modal className={styles.wrapper} close={close} centerX confirmClose>
            {saved ? (
                <SuccessMessage text='Bead created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <h1>Add a new bead</h1>
                    {showColors && (
                        <Row centerY className={styles.colorButtons}>
                            {beadColors.map((c) => (
                                <button
                                    key={c}
                                    type='button'
                                    aria-label='color'
                                    onClick={() => setColor(c)}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </Row>
                    )}
                    <Column
                        centerY
                        centerX
                        className={`${styles.beadWrapper} ${type === 'text' && styles.expanded}`}
                    >
                        <DraftTextEditor
                            className={styles.textEditor}
                            type='bead'
                            stringifiedDraft={text}
                            maxChars={maxChars}
                            onChange={(value, textMentions) => {
                                setText(value)
                                setMentions(textMentions)
                            }}
                        />
                        <Column className={styles.bead} style={{ backgroundColor: color }}>
                            <div className={styles.watermark} />
                            <Row centerY spaceBetween className={styles.header}>
                                {postTypeIcons[type]}
                                {/* <ImageTitle
                                    type='user'
                                    imagePath={accountData.flagImagePath}
                                    title={accountData.name}
                                    // fontSize={12}
                                    // imageSize={20}
                                /> */}
                            </Row>
                            <Column centerX centerY className={styles.content}>
                                {type === 'url' && (
                                    <Column centerX centerY className={styles.urlWrapper}>
                                        {urlData ? (
                                            <UrlPreview
                                                key={urlData.url}
                                                type='bead'
                                                urlData={urlData}
                                                remove={() => setUrlData(null)}
                                            />
                                        ) : (
                                            <>
                                                <Input
                                                    type='text'
                                                    placeholder='URL...'
                                                    value={url}
                                                    onChange={(value) => setUrl(value)}
                                                    style={{ marginBottom: 10 }}
                                                />
                                                <Button
                                                    text='Add'
                                                    color='aqua'
                                                    onClick={scrapeUrl}
                                                    disabled={!url}
                                                    loading={urlLoading}
                                                />
                                            </>
                                        )}
                                    </Column>
                                )}
                                {type === 'audio' && (
                                    <Column centerX style={{ width: '100%', height: '100%' }}>
                                        {audioFile ? (
                                            <AudioCard
                                                key={audioFile.lastModified}
                                                url={URL.createObjectURL(audioFile)}
                                                location='create-bead-audio'
                                                remove={() => setAudioFile(undefined)}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            renderAudioControls()
                                        )}
                                    </Column>
                                )}
                                {type === 'image' && (
                                    <Column style={{ width: '100%', height: '100%' }}>
                                        {image ? (
                                            <Column className={styles.imageWrapper}>
                                                <CloseButton
                                                    size={20}
                                                    onClick={() => setImage(null)}
                                                    style={{ position: 'absolute', right: 5 }}
                                                />
                                                <button
                                                    type='button'
                                                    className={styles.imageButton}
                                                    onClick={() => setImageModalOpen(true)}
                                                >
                                                    <img
                                                        src={
                                                            image.url ||
                                                            URL.createObjectURL(image.file)
                                                        }
                                                        alt=''
                                                    />
                                                </button>
                                                <Row centerY className={styles.caption}>
                                                    <Input
                                                        type='text'
                                                        placeholder='Caption...'
                                                        value={image.caption}
                                                        onChange={(v) =>
                                                            setImage({ ...image, caption: v })
                                                        }
                                                    />
                                                </Row>
                                                {imageModalOpen && (
                                                    <ImageModal
                                                        images={[image]}
                                                        selectedImage={image}
                                                        close={() => setImageModalOpen(false)}
                                                    />
                                                )}
                                            </Column>
                                        ) : (
                                            <Column centerX centerY style={{ height: '100%' }}>
                                                <Row className={styles.fileUploadInput}>
                                                    <label htmlFor='bead-image-file-input'>
                                                        Upload image
                                                        <input
                                                            type='file'
                                                            id='bead-image-file-input'
                                                            accept='.png, .jpg, .jpeg, .gif'
                                                            onChange={addImageFile}
                                                            hidden
                                                        />
                                                    </label>
                                                </Row>
                                                <p>or</p>
                                                <Row style={{ width: '100%', marginTop: 10 }}>
                                                    <Input
                                                        type='text'
                                                        placeholder='Add image URL...'
                                                        value={imageURL}
                                                        onChange={(value) => setImageURL(value)}
                                                        style={{ marginRight: 10 }}
                                                    />
                                                    <Button
                                                        text='Add'
                                                        color='aqua'
                                                        disabled={!imageURL}
                                                        onClick={addImageURL}
                                                    />
                                                </Row>
                                                {imageSizeError && (
                                                    <p className='danger' style={{ marginTop: 10 }}>
                                                        Max image size: {imageMBLimit}MB
                                                    </p>
                                                )}
                                            </Column>
                                        )}
                                    </Column>
                                )}
                            </Column>
                        </Column>
                    </Column>
                    <Row centerX className={styles.beadTypeButtons}>
                        {allowedBeadTypes.map((t) => (
                            <button
                                key={t}
                                type='button'
                                className={`${t === type && styles.selected}`}
                                title={capitalise(t)}
                                onClick={() => setType(t)}
                            >
                                {postTypeIcons[t]}
                            </button>
                        ))}
                    </Row>
                    <Button
                        text='Add bead'
                        color='aqua'
                        disabled={disable()}
                        loading={loading}
                        onClick={saveBead}
                        style={{ margin: '20px 0' }}
                    />
                </Column>
            )}
        </Modal>
    )
}

NextBeadModal.defaultProps = {
    postId: null,
}

export default NextBeadModal
