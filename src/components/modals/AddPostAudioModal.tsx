import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import Button from '@components/Button'
import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import { audioMBLimit, formatTimeMMSS } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/AddPostAudioModal.module.scss'
import { PauseIcon, PlayIcon } from '@svgs/all'
import * as d3 from 'd3'
import React, { useRef, useState } from 'react'

function AddPostAudioModal(props: {
    audio: File | undefined
    setAudio: (audio: File) => void
    setPostType: (type: string) => void
    close: () => void
}): JSX.Element {
    const { audio, setAudio, setPostType, close } = props
    const [audioFile, setAudioFile] = useState<File | undefined>(audio)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [sizeError, setSizeError] = useState(false)
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
                setSizeError(true)
                resetAudioState()
            } else {
                setSizeError(false)
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

    function toggleAudio() {
        const audioElement = d3.select('#new-post-audio').node()
        if (audioElement) {
            if (audioElement.paused) audioElement.play()
            else audioElement.pause()
        }
    }

    function saveAudio() {
        if (!audioFile) setNoAudioError(true)
        else {
            setAudio(audioFile)
            setPostType('audio')
            close()
        }
    }

    return (
        <Modal centered close={close} className={styles.wrapper}>
            <h1>Add audio</h1>
            <Column centerX style={{ width: '100%', marginBottom: 20 }}>
                <Row style={{ marginBottom: 20 }}>
                    <Button
                        text={recording ? 'Stop recording' : 'Record audio'}
                        color='red'
                        style={{ marginRight: 10 }}
                        onClick={toggleAudioRecording}
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
                {(sizeError || noAudioError) && (
                    <Column className={styles.errors}>
                        {sizeError && <p>Audio file too large. Max size: {audioMBLimit}MB</p>}
                        {noAudioError && <p>Recording or upload required</p>}
                    </Column>
                )}
                {recording && <h2>{formatTimeMMSS(recordingTime)}</h2>}
                {audioFile && (
                    <Column
                        key={audioFile.lastModified}
                        style={{ width: '100%', marginBottom: 20 }}
                    >
                        <AudioVisualiser
                            audioElementId='new-post-audio'
                            audioURL={URL.createObjectURL(audioFile)}
                            staticBars={1200}
                            staticColor={colors.audioVisualiserStatic}
                            dynamicBars={160}
                            dynamicColor={colors.audioVisualiserDynamic}
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
            </Column>
            <Button text='Save audio' color='blue' onClick={saveAudio} />
        </Modal>
    )
}

export default AddPostAudioModal
