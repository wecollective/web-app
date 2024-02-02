/* eslint-saveDisabled react/no-array-index-key */
import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import Input from '@components/Input'
import Row from '@components/Row'
import AudioCard from '@components/cards/PostCard/AudioCard'
import UrlPreview from '@components/cards/PostCard/UrlCard'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import ImageModal from '@components/modals/ImageModal'
import Modal from '@components/modals/Modal'
import {
    GameSettings,
    allowedAudioTypes,
    allowedImageTypes,
    audioMBLimit,
    capitalise,
    findDraftLength,
    findSearchableText,
    findUrlSearchableText,
    formatTimeMMSS,
    imageMBLimit,
    postTypeIcons,
    scrapeUrl,
    uploadPost,
    validatePost,
} from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/NextBeadModal.module.scss'
import getBlobDuration from 'get-blob-duration'
import React, { useContext, useEffect, useRef, useState } from 'react'
import RecordRTC from 'recordrtc'
import { v4 as uuidv4 } from 'uuid'

const { white, red, orange, yellow, green, blue, purple } = colors
const beadColors = [white, red, orange, yellow, green, blue, purple]

function NextBeadModal(props: {
    preview?: boolean
    postId?: number
    settings: GameSettings
    players: any[]
    onSave: (bead: any) => void
    close: () => void
}): JSX.Element {
    const { accountData } = useContext(AccountContext)
    const { preview, postId, settings, players, onSave, close } = props
    const { allowedBeadTypes, characterLimit, moveDuration } = settings
    const [type, setType] = useState(allowedBeadTypes[0])
    const [color, setColor] = useState('#fff')
    const [showColors, setShowColors] = useState(true)
    const [text, setText] = useState('')
    const [mentions, setMentions] = useState<any[]>([])
    const [saveLoading, setSaveLoading] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const maxChars = characterLimit || 5000

    // url
    const [url, setUrl] = useState('')
    const [urlData, setUrlData] = useState<any>(null)
    const [urlLoading, setUrlLoading] = useState(false)

    async function getUrlData() {
        setUrlLoading(true)
        const { data } = await scrapeUrl(url)
        if (data) {
            data.url = url
            data.searchableText = findUrlSearchableText(data)
            setUrlData(data)
            setUrlLoading(false)
        }
    }

    // audio
    const [audio, setAudio] = useState<any>()
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const audioRecorder = useRef<any>(null)
    const recordingInterval = useRef<any>(null)

    async function addAudio() {
        const input = document.getElementById('bead-audio-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            const fileType = input.files[0].type.split('/')[1]
            if (allowedAudioTypes.includes(`.${fileType}`)) {
                const tooLarge = input.files[0].size > audioMBLimit * 1024 * 1024
                const duration = await getBlobDuration(URL.createObjectURL(input.files[0]))
                const overTimeLimit = moveDuration && Math.trunc(duration) > moveDuration
                if (tooLarge) setErrors([`Max audio size: ${audioMBLimit} MBs`])
                else if (overTimeLimit) setErrors([`Max duration: ${moveDuration} secs`])
                else {
                    setAudio({
                        id: uuidv4(),
                        Audio: {
                            file: input.files[0],
                            url: URL.createObjectURL(input.files[0]),
                        },
                    })
                    setErrors([])
                }
            }
        }
    }

    function stopAudioRecording() {
        audioRecorder.current.stopRecording(() => {
            clearInterval(recordingInterval.current)
            const file = new File([audioRecorder.current.getBlob()], '', { type: 'audio/wav' })
            setAudio({
                id: uuidv4(),
                Audio: { file, url: URL.createObjectURL(file) },
            })
        })
        setRecording(false)
    }

    function toggleAudioRecording() {
        if (recording) stopAudioRecording()
        else {
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
                    <label htmlFor='bead-audio-input'>
                        Upload audio
                        <input
                            type='file'
                            id='bead-audio-input'
                            accept={allowedAudioTypes.join(',')}
                            onChange={addAudio}
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
                {!!moveDuration && (
                    <p style={{ marginTop: 10 }}>
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
    const [imageModalOpen, setImageModalOpen] = useState(false)

    function addImage() {
        const input = document.getElementById('bead-image-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            const fileType = input.files[0].type.split('/')[1]
            if (allowedImageTypes.includes(`.${fileType}`)) {
                const tooLarge = input.files[0].size > imageMBLimit * 1024 * 1024
                if (tooLarge) setErrors([`Max image size: ${imageMBLimit} MBs`])
                else {
                    setImage({
                        id: uuidv4(),
                        Image: {
                            file: input.files[0],
                            url: URL.createObjectURL(input.files[0]),
                        },
                    })
                    setErrors([])
                }
            }
        }
    }

    function addImageURL() {
        setImage({ id: uuidv4(), Image: { url: imageURL } })
        setImageURL('')
        setErrors([])
    }

    // todo: maybe leave these for the validation function?
    function saveDisabled() {
        const chars = findDraftLength(text)
        const textInvalid = type === 'text' && (!chars || chars > maxChars)
        const urlInvalid = type === 'url' && !urlData
        const audioInvalid = type === 'audio' && !audio
        const imageInvalid = type === 'image' && !image
        return textInvalid || urlInvalid || audioInvalid || imageInvalid
    }

    function save() {
        setSaveLoading(true)
        // structure data
        const bead = {
            id: uuidv4(),
            type: 'bead',
            mediaTypes: type,
            text: type === 'text' ? text : null,
            mentions: mentions.map((m) => m.id),
            urls: type === 'url' ? [urlData] : [],
            images: type === 'image' ? [image] : [],
            audios: type === 'audio' ? [audio] : [],
            color,
        } as any
        bead.searchableText = findSearchableText(bead)
        // validate post (currently only used here for totalSize value)
        const validation = validatePost(bead)
        if (validation.errors.length) {
            // display errors
            setErrors(validation.errors)
            setSaveLoading(false)
        } else if (preview) {
            // return post data to parent component
            const { id, handle, name, flagImagePath } = accountData
            bead.Creator = { id, handle, name, flagImagePath }
            bead.totalSize = validation.totalSize
            onSave(bead)
            close()
        } else {
            // upload post
            bead.links = { parent: { id: postId, type: 'post' } }
            uploadPost(bead)
                .then((res) => {
                    const { newBead, newDeadline } = res.data
                    const { id, handle, name, flagImagePath } = accountData
                    newBead.Creator = { id, handle, name, flagImagePath }
                    onSave({ newBead, newDeadline })
                    close()
                })
                .catch((error) => console.log(error))
        }
    }

    // set player color
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
                    text={text}
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
                                            onClick={getUrlData}
                                            disabled={!url}
                                            loading={urlLoading}
                                        />
                                    </>
                                )}
                            </Column>
                        )}
                        {type === 'audio' && (
                            <Column centerX style={{ width: '100%', height: '100%' }}>
                                {audio ? (
                                    <AudioCard
                                        key={audio.id}
                                        url={audio.Audio.url}
                                        staticBars={200}
                                        location='create-bead-audio'
                                        remove={() => setAudio(null)}
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
                                            <img src={image.Image.url} alt='' />
                                        </button>
                                        <Row centerY className={styles.caption}>
                                            <Input
                                                type='text'
                                                placeholder='Caption...'
                                                value={image.text}
                                                onChange={(v) => setImage({ ...image, text: v })}
                                            />
                                        </Row>
                                        {imageModalOpen && (
                                            <ImageModal
                                                images={[image]}
                                                startIndex={0}
                                                close={() => setImageModalOpen(false)}
                                            />
                                        )}
                                    </Column>
                                ) : (
                                    <Column centerX centerY style={{ height: '100%' }}>
                                        <Row className={styles.fileUploadInput}>
                                            <label htmlFor='bead-image-input'>
                                                Upload image
                                                <input
                                                    type='file'
                                                    id='bead-image-input'
                                                    accept={allowedImageTypes.join(',')}
                                                    onChange={addImage}
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
            <Column centerX className={styles.errors}>
                <p>{errors[0]}</p>
            </Column>
            <Button
                text='Add bead'
                color='aqua'
                disabled={saveDisabled()}
                loading={saveLoading}
                onClick={save}
                style={{ margin: '20px 0' }}
            />
        </Modal>
    )
}

NextBeadModal.defaultProps = {
    postId: null,
    preview: false,
}

export default NextBeadModal
