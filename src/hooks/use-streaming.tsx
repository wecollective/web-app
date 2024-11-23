/* eslint-disable no-inner-declarations */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { BaseUser } from '@src/Helpers'
import { useContext, useEffect, useRef, useState } from 'react'
import RecordRTC from 'recordrtc'
import Peer from 'simple-peer'
import { Socket } from 'socket.io-client'

export type VideoPeer = { socketId: string; audioOnly: boolean; userData: BaseUser }

const useStreaming = ({
    roomId,
    socket,
    showVideos,
    onStartStreaming,
    onStream,
    onRefreshRequest,
    onStreamDisconnected,
}: {
    roomId: number
    socket: Socket
    showVideos: boolean
    onStartStreaming?: () => void
    onStream?: (socketId: string, user) => void
    onRefreshRequest?: (socketId: string) => void
    onStreamDisconnected?: (socketId, user) => void
}) => {
    const iceConfig = {
        // iceTransportPolicy: 'relay',
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // { urls: `stun:${config.turnServerUrl}` },
            {
                urls: `turn:${config.turnServerUrl}`,
                username: config.turnServerUsername,
                credential: config.turnServerPassword,
            },
        ],
    }
    const { accountData, alert } = useContext(AccountContext)
    const userData = {
        id: accountData.id,
        handle: accountData.handle,
        name: accountData.name || 'Anonymous',
        flagImagePath: accountData.flagImagePath,
    }
    const [videos, setVideos] = useState<VideoPeer[]>([])
    const [loadingStream, setLoadingStream] = useState(false)
    const [audioOnly, setAudioOnly] = useState(false)
    const [userIsStreaming, setUserIsStreaming] = useState(false)
    const [audioTrackEnabled, setAudioTrackEnabled] = useState(true)
    const [videoTrackEnabled, setVideoTrackEnabled] = useState(true)
    const mySocketIdRef = useRef('')
    const videoRef = useRef<any>(null)
    const streamRef = useRef<any>(null)
    const peersRef = useRef<{ socketId: string; userData: BaseUser; peer: Peer }[]>([])
    const audioRef = useRef<any>(null)
    const audioRecorderRef = useRef<any>(null)

    function toggleStream() {
        if (userIsStreaming) {
            // close stream
            videoRef.current.pause()
            videoRef.current.srcObject = null
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
            setUserIsStreaming(false)
            setAudioTrackEnabled(true)
            setVideoTrackEnabled(true)
            socket.emit('outgoing-stream-disconnected', {
                roomId,
                socketId: mySocketIdRef.current,
                userData,
            })
        } else {
            // set up and signal stream
            setLoadingStream(true)
            navigator.mediaDevices
                .getUserMedia({ video: { width: 427, height: 240 }, audio: true })
                .then((stream) => {
                    setUserIsStreaming(true)
                    setAudioOnly(false)
                    streamRef.current = stream
                    // auto disable video and audio tracks when connected
                    // streamRef.current.getTracks().forEach((track) => (track.enabled = false))
                    peersRef.current.forEach((p) => p.peer.addStream(stream))
                    setTimeout(() => {
                        videoRef.current = document.getElementById('your-video')
                        videoRef.current.srcObject = stream
                    }, 1000)

                    setLoadingStream(false)
                    onStartStreaming?.()
                })
                .catch(() => {
                    console.log('Unable to connect video, trying audio only...')
                    navigator.mediaDevices
                        .getUserMedia({ audio: { sampleRate: 24000 } })
                        .then((stream) => {
                            setUserIsStreaming(true)
                            setAudioOnly(true)
                            streamRef.current = stream
                            streamRef.current
                                .getTracks()
                                .forEach((track) => (track.enabled = false))
                            peersRef.current.forEach((p) => p.peer.addStream(stream))
                            setTimeout(() => {
                                videoRef.current = document.getElementById('your-video')
                                videoRef.current.srcObject = stream
                            }, 1000)
                            setLoadingStream(false)
                            onStartStreaming?.()
                        })
                        .catch(() => {
                            alert('Unable to connect media devices')
                            setLoadingStream(false)
                        })
                })
            // set up seperate audio stream for moves
            navigator.mediaDevices
                .getUserMedia({ audio: { sampleRate: 24000 } })
                .then((audio) => (audioRef.current = audio))
        }
    }

    function createPeer(initiator: boolean, socketId: string, user: BaseUser, stream) {
        destroyPeer(socketId)
        // create peer connection
        const peer = new Peer({
            initiator,
            config: iceConfig,
            ...(stream && {
                stream,
            }),
        })
        peer.on('signal', (signal) => {
            socket.emit('outgoing-signal-request', {
                userToSignal: socketId,
                userSignaling: {
                    socketId: socket.id,
                    userData,
                },
                signal,
            })
        })
        // peer.on('connect', () => console.log('connect 1'))
        peer.on('stream', (newStream) => {
            setVideos((oldVideos) => [
                ...oldVideos,
                {
                    socketId,
                    userData: user,
                    peer,
                    audioOnly: !newStream.getVideoTracks().length,
                },
            ])
            addStreamToVideo(socketId, newStream)
            onStream?.(socketId, user)
        })
        peer.on('close', () => destroyPeer(socketId))
        peer.on('error', (error) => console.log(error))
        peersRef.current.push({
            socketId,
            userData: user,
            peer,
        })
        return peer
    }

    function refreshStream(socketId, user) {
        // singal refresh request
        socket.emit('outgoing-refresh-request', {
            userToSignal: socketId,
            userSignaling: {
                socketId: socket.id,
                userData,
            },
        })
        createPeer(true, socketId, user, streamRef.current)
    }

    function addStreamToVideo(socketId, stream) {
        setTimeout(() => {
            const video = document.getElementById(socketId) as HTMLVideoElement
            if (video) {
                video.srcObject = stream
                if (showVideos) {
                    video.muted = false
                    video.play()
                }
            }
        }, 1000)
    }

    function toggleAudioTrack() {
        const audioTrack = streamRef.current.getTracks()[0]
        audioTrack.enabled = !audioTrackEnabled
        setAudioTrackEnabled(!audioTrackEnabled)
    }

    function toggleVideoTrack() {
        const videoTrack = streamRef.current.getTracks()[1]
        videoTrack.enabled = !videoTrackEnabled
        setVideoTrackEnabled(!videoTrackEnabled)
    }

    function startAudioRecording() {
        audioRecorderRef.current = RecordRTC(audioRef.current, {
            type: 'audio',
            mimeType: 'audio/wav',
            recorderType: RecordRTC.StereoAudioRecorder,
            bufferSize: 16384,
            numberOfAudioChannels: 1,
            desiredSampRate: 24000,
        })
        audioRecorderRef.current.startRecording()
    }

    function stopAudioRecording(isRecording: boolean) {
        return new Promise((resolve) => {
            if (!isRecording) resolve(null)
            else {
                audioRecorderRef.current.stopRecording(() => {
                    const blob = audioRecorderRef.current.getBlob()
                    resolve(blob)
                })
            }
        })
    }

    function destroyPeer(socketId) {
        const peerObject = peersRef.current.find((p) => p.socketId === socketId)
        peersRef.current = peersRef.current.filter((p) => p.socketId !== socketId)
        peerObject?.peer.destroy()
        setVideos((oldVideos) => oldVideos.filter((v) => v.socketId !== socketId))
    }

    useEffect(() => {
        window.process = { nextTick: () => undefined } as any
        socket.on('incoming-signal', (payload) => {
            const peerObject = peersRef.current.find((p) => p.socketId === payload.id)
            if (peerObject) {
                if (peerObject.peer.readable) peerObject.peer.signal(payload.signal)
                else {
                    destroyPeer(payload.id)
                }
            } else console.log('no peer!')
        })
        socket.on('incoming-signal-request', (payload) => {
            const { signal, userSignaling } = payload
            // search for peer in peers array
            const existingPeer = peersRef.current.find((p) => p.socketId === userSignaling.socketId)
            // if peer exists, pass signal to peer
            if (existingPeer) {
                existingPeer.peer.signal(signal)
            } else {
                const peer = createPeer(
                    false,
                    userSignaling.socketId,
                    userSignaling.userData,
                    streamRef.current
                )
                peer.signal(signal)
            }
        })

        socket.on('incoming-refresh-request', (data) => {
            const { id } = data
            destroyPeer(id)
            onRefreshRequest?.(id)
        })
        socket.on('incoming-stream-disconnected', (data) => {
            setVideos((oldVideos) => oldVideos.filter((v) => v.socketId !== data.socketId))
            onStreamDisconnected?.(data.socketId, data.userData)
        })
    }, [])

    return {
        loadingStream,
        userIsStreaming,
        videos,
        mySocketIdRef,
        audioRecorderRef,
        audioTrackEnabled,
        videoTrackEnabled,
        audioOnly,
        toggleAudioTrack,
        toggleVideoTrack,
        toggleStream,
        refreshStream,
        startAudioRecording,
        stopAudioRecording,
        createPeer,
        destroyPeer,
    }
}

export default useStreaming

export type Streaming = ReturnType<typeof useStreaming>
