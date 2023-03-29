/* eslint-disable react/no-array-index-key */
import Button from '@components/Button'
import Audio from '@components/cards/PostCard/PostTypes/Audio'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import Input from '@components/Input'
import ImageModal from '@components/modals/ImageModal'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import UrlPreview from '@src/components/cards/PostCard/UrlPreview'
import config from '@src/Config'
import {
    audioMBLimit,
    beadTypeIcons,
    capitalise,
    findDraftLength,
    formatTimeMMSS,
    imageMBLimit,
} from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/NextBeadModal2.module.scss'
import axios from 'axios'
import * as d3 from 'd3'
import getBlobDuration from 'get-blob-duration'
import React, { useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const { white, red, orange, yellow, green, blue, purple } = colors
const beadColors = [white, red, orange, yellow, green, blue, purple]

function NextBeadModal(props: {
    settings: any
    beads: any[]
    saveBead: (bead: any) => void
    close: () => void
}): JSX.Element {
    // const { accountData, setAlertMessage, setAlertModalOpen } = useContext(AccountContext)
    const { settings, beads, saveBead, close } = props
    const { allowedBeadTypes, characterLimit, moveDuration, moveTimeWindow } = settings
    // const [newBead, setNewBead] = useState<any>({ ...defaultBeadData, type: allowedBeadTypes[0] })
    const [type, setType] = useState(allowedBeadTypes[0])
    const [color, setColor] = useState('#fff')
    const [text, setText] = useState('')
    const [mentions, setMentions] = useState<any[]>([])
    // const cookies = new Cookies()
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const maxChars = characterLimit || 5000

    // url
    const [url, setUrl] = useState('')
    const [urlData, setUrlData] = useState<any>(null)
    const [urlLoading, setUrlLoading] = useState(false)

    function scrapeUrl() {
        setUrlLoading(true)
        axios
            .get(`${config.apiURL}/scrape-url?url=${url}`)
            .then((res) => {
                setUrlData({ url, ...res.data })
                setUrl('')
                setUrlLoading(false)
            })
            .catch((error) => console.log(error))
    }

    // audio
    const [audioFile, setAudioFile] = useState<File | undefined>()
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [audioTimeError, setAudioTimeError] = useState(false)
    const audioRecorder = useRef<any>(null)
    const audioChunks = useRef<any>([])
    const recordingInterval = useRef<any>(null)

    function resetAudioState() {
        setAudioFile(undefined)
        setRecordingTime(0)
        audioChunks.current = []
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
            }
        }
    }

    function toggleAudioRecording() {
        if (recording) {
            audioRecorder.current.stop()
            setRecording(false)
        } else {
            resetAudioState()
            setAudioSizeError(false)
            setAudioTimeError(false)
            navigator.mediaDevices.getUserMedia({ audio: true }).then((audio) => {
                audioRecorder.current = new MediaRecorder(audio)
                audioRecorder.current.ondataavailable = (e) => {
                    audioChunks.current.push(e.data)
                }
                audioRecorder.current.onstart = () => {
                    let time = 0
                    recordingInterval.current = setInterval(() => {
                        time += 1
                        setRecordingTime(time)
                        if (moveDuration && moveDuration === time) {
                            clearInterval(recordingInterval.current)
                            audioRecorder.current.stop()
                            setRecording(false)
                        }
                    }, 1000)
                }
                audioRecorder.current.onstop = async () => {
                    clearInterval(recordingInterval.current)
                    const blob = new Blob(audioChunks.current, { type: 'audio/mpeg-3' })
                    setAudioFile(new File([blob], ''))
                }
                audioRecorder.current.start()
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

    function addBead() {
        const bead = { id: uuidv4(), type, color } as any
        if (type === 'text') {
            bead.text = text
            bead.mentions = mentions
        }
        if (type === 'url') bead.Urls = [urlData]
        if (type === 'audio') bead.Audio = { file: audioFile, url: '' }
        if (type === 'image') bead.Images = [image]
        saveBead(bead)
        close()
    }

    return (
        <Modal className={styles.wrapper} close={close} centered confirmClose>
            {saved ? (
                <SuccessMessage text='Bead created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <h1>Add a new bead</h1>
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
                                {beadTypeIcons[type]}
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
                                            <Audio
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
                                {beadTypeIcons[t]}
                            </button>
                        ))}
                    </Row>
                    <Button
                        text='Add bead'
                        color='aqua'
                        disabled={disable()}
                        loading={loading}
                        onClick={addBead}
                        style={{ margin: '20px 0' }}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default NextBeadModal
