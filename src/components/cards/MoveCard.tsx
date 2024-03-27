/* eslint-disable react/function-component-definition */
/* eslint-disable no-nested-ternary */
import {
    GAME_EVENTS,
    Move,
    MoveSubmissionAudio,
    Post,
    formatTimeMMSS,
    uploadPost,
} from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import styles from '@styles/components/cards/Comments/MessageCard.module.scss'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import RecordRTC from 'recordrtc'
import { v4 as uuid } from 'uuid'
import Button from '../Button'
import Column from '../Column'
import Input from '../Input'
import Row from '../Row'
import UserButton from '../UserButton'
import AudioCard from './PostCard/AudioCard'

const MoveProgressBar: FC<{ move: Extract<Move, { status: 'started' | 'paused' }> }> = ({
    move,
}) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                const progress =
                    move.status === 'started'
                        ? (move.elapsedTime + +new Date() - move.startedAt) /
                          (move.elapsedTime + move.timeout - move.startedAt)
                        : move.elapsedTime / (move.remainingTime + move.elapsedTime)
                ref.current.style.width = `${100 * Math.max(0, Math.min(progress, 1))}%`
            }
        }, 17)
        return () => clearInterval(interval)
    }, [move.status])

    return (
        <div className={styles.progressBar}>
            <div ref={ref} className={styles.progress} />
        </div>
    )
}

const TextMove: FC<{ post: Post; emit: (event: string, data?) => void }> = ({ post, emit }) => {
    const [text, setText] = useState('')
    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                const comment = {
                    type: 'comment',
                    links: {
                        parent: {
                            type: post.type,
                            id: post.id,
                            relationship: 'submission',
                        },
                    },
                    text,
                    searchableText: text,
                    mentions: [],
                    urls: [],
                    images: [],
                    audios: [],
                    mediaTypes: '',
                }
                await uploadPost(comment)
                emit(GAME_EVENTS.outgoing.submit, { moveId: post.id })
            }}
        >
            <Input
                type='text-area'
                placeholder='Leave a text response.'
                style={{ marginBottom: 10 }}
                value={text}
                onChange={setText}
                required
            />
            <Row className={{ alignItems: 'flex-end' }} />
            <Row
                style={{
                    justifyContent: 'center',
                    marginBottom: 10,
                }}
            >
                <Button color='grey' text='Skip' onClick={() => emit(GAME_EVENTS.outgoing.skip)} />
                <Button
                    color='grey'
                    text='Pause'
                    style={{ marginLeft: 10 }}
                    onClick={() => emit(GAME_EVENTS.outgoing.pause)}
                />
                <Button
                    submit
                    color='purple'
                    style={{ marginLeft: 10 }}
                    text='Submit your move!'
                    disabled={!text}
                />
            </Row>
        </form>
    )
}

const AudioMove: FC<{ post: Post; emit: (event: string, data?) => void }> = ({ post, emit }) => {
    const submission = post.move!.submission as MoveSubmissionAudio
    const moveDuration = submission.maxDuration / 1000

    const [audio, setAudio] = useState<{ id: string; Audio: { file: File; url: string } }>()
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const audioRecorder = useRef<any>(null)
    const recordingInterval = useRef<any>(null)

    function stopAudioRecording() {
        audioRecorder.current.stopRecording(() => {
            clearInterval(recordingInterval.current)
            const file = new File([audioRecorder.current.getBlob()], '', { type: 'audio/wav' })
            setAudio({
                id: uuid(),
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
    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                const bead = {
                    type: 'bead',
                    links: {
                        parent: {
                            type: post.type,
                            id: post.id,
                            relationship: 'submission',
                        },
                    },
                    text: null,
                    searchableText: null,
                    mentions: [],
                    urls: [],
                    images: [],
                    audios: [audio],
                    mediaTypes: 'audio',
                }
                await uploadPost(bead)
                emit(GAME_EVENTS.outgoing.submit, { moveId: post.id })
            }}
        >
            <Column centerX style={{ width: '100%', height: '100%' }}>
                <div style={{ marginBottom: 10 }}>
                    {audio ? (
                        <AudioCard
                            id={audio.id}
                            url={audio.Audio.url}
                            staticBars={100}
                            location='new-post'
                            remove={() => setAudio(undefined)}
                            style={{ height: 100 }}
                        />
                    ) : (
                        renderAudioControls()
                    )}
                </div>
                <Row>
                    <Button
                        color='grey'
                        text='Skip'
                        onClick={() => emit(GAME_EVENTS.outgoing.skip)}
                    />
                    <Button
                        color='grey'
                        text='Pause'
                        style={{ marginLeft: 10 }}
                        onClick={() => emit(GAME_EVENTS.outgoing.pause)}
                    />
                    <Button
                        submit
                        color='purple'
                        style={{ marginLeft: 10 }}
                        text='Submit your move!'
                        disabled={!audio}
                    />
                </Row>
            </Column>
        </form>
    )
}

const MoveCard: FC<{ post: Post; emit: (event: string, data?) => void }> = ({ post, emit }) => {
    const move = post.move!
    const { accountData } = useContext(AccountContext)

    const { submission } = move
    const myMove = accountData.id === submission?.player?.id
    const ongoing = move.status === 'started' || move.status === 'stopped'

    return (
        <Column>
            {submission && (
                <Column
                    style={{
                        borderTop: '1px solid lightgrey',
                        marginTop: 10,
                        paddingTop: 10,
                    }}
                >
                    <Row style={{ marginBottom: 10 }} centerY>
                        <span style={{ flexGrow: 1, fontWeight: 'bold' }}>
                            {myMove
                                ? ongoing
                                    ? 'Your move!'
                                    : 'Your move'
                                : submission.player && (
                                      <UserButton
                                          user={submission.player}
                                          textOverride={`${submission.player?.name}'s move`}
                                      />
                                  )}
                        </span>
                    </Row>
                    {myMove && (
                        <>
                            {move.status === 'started' && (
                                <>
                                    {(() => {
                                        switch (submission.type) {
                                            case 'text': {
                                                return <TextMove post={post} emit={emit} />
                                            }
                                            case 'audio':
                                                return <AudioMove post={post} emit={emit} />
                                            default: {
                                                const exhaustivenessCheck: never = submission
                                                throw exhaustivenessCheck
                                            }
                                        }
                                    })()}
                                </>
                            )}
                            {move.status === 'paused' && (
                                <Row style={{ justifyContent: 'center', marginBottom: 10 }}>
                                    <Button
                                        color='grey'
                                        text='Start'
                                        onClick={() => emit(GAME_EVENTS.outgoing.start)}
                                    />
                                </Row>
                            )}
                        </>
                    )}
                    {post.Submissions?.map((s) => (
                        <div
                            key={s.Post.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 5,
                                padding: 5,
                            }}
                        >
                            {s.Post.type === 'comment' && s.Post.text}
                            {s.Post.type === 'bead' && s.Post.AudioBlocks && (
                                <AudioCard
                                    url={s.Post.AudioBlocks[0].Post.MediaLink.Audio.url}
                                    staticBars={100}
                                    location='bead-card'
                                    style={{ height: 100, width: '100%' }}
                                />
                            )}
                        </div>
                    ))}
                    {!ongoing && !post.Submissions?.length && <p>No submissions</p>}
                </Column>
            )}
            {(move.status === 'started' || move.status === 'paused') && (
                <MoveProgressBar move={move} />
            )}
        </Column>
    )
}

export default MoveCard
