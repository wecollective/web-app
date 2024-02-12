/* eslint-disable no-inner-declarations */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
import Button from '@components/Button'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Markdown from '@components/Markdown'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import BeadCard from '@components/cards/PostCard/BeadCard'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { Post, dateCreated, isPlural, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/Game.module.scss'
import {
    AudioIcon,
    AudioSlashIcon,
    CastaliaIcon,
    ChevronUpIcon,
    CommentIcon,
    CurvedDNAIcon,
    DNAIcon,
    EditIcon,
    LockIcon,
    RepostIcon,
    SettingsIcon,
    VideoIcon,
    VideoSlashIcon,
} from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import RecordRTC from 'recordrtc'
import Peer from 'simple-peer'
import { io } from 'socket.io-client'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'
import GameBackgroundModal from './modals/GameBackgroundModal'
import { GameRoomGameSettingsModal } from './modals/GameRoomGameSettingsModal'
import GameTopicImageModal from './modals/GameTopicImageModal'
import GameTopicModal from './modals/GameTopicModal'

interface Comment {
    id: number
    text: string
    createdAt: Date
    updatedAt: Date
    user: {
        handle: string
        name: string
        flagImagePath: string
    }
}

const colors = {
    red: '#ef0037',
    orange: '#f59c27',
    yellow: '#daf930',
    green: '#00e697',
    aqua: '#00b1a9',
    blue: '#4f8af7',
    purple: '#a65cda',
    grey1: '#e9e9ea',
    grey2: '#d7d7d9',
    grey3: '#c6c6c7',
    black: 'black',
    white: 'white',
}

function Video(props) {
    const {
        id,
        user,
        size,
        audioEnabled,
        videoEnabled,
        toggleAudio,
        toggleVideo,
        audioOnly,
        refreshStream,
    } = props
    return (
        <div className={`${styles.videoWrapper} ${size}`}>
            {audioOnly && <AudioIcon />}
            <video id={id} muted autoPlay playsInline>
                <track kind='captions' />
            </video>
            <div className={styles.videoUser}>
                <ImageTitle
                    type='user'
                    imagePath={user.flagImagePath}
                    title={id === 'your-video' ? 'You' : user.name}
                />
            </div>
            {id === 'your-video' ? (
                <div className={styles.videoButtons}>
                    <button type='button' onClick={toggleAudio}>
                        {audioEnabled ? <AudioIcon /> : <AudioSlashIcon />}
                    </button>
                    {!audioOnly && (
                        <button type='button' onClick={toggleVideo}>
                            {videoEnabled ? <VideoIcon /> : <VideoSlashIcon />}
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.videoButtons}>
                    <button type='button' onClick={() => refreshStream(id, user)}>
                        <RepostIcon />
                    </button>
                </div>
            )}
        </div>
    )
}

function Comment(props) {
    const { comment } = props
    const { Creator, text, createdAt } = comment
    if (Creator)
        return (
            <Row className={styles.userComment}>
                <FlagImage type='user' size={40} imagePath={Creator.flagImagePath} />
                <Column className={styles.textWrapper}>
                    <Row className={styles.header}>
                        <h1>{Creator.name}</h1>
                        <p title={dateCreated(createdAt)}>{timeSinceCreated(createdAt)}</p>
                    </Row>
                    <Markdown text={text} />
                </Column>
            </Row>
        )
    return (
        <Row className={styles.adminComment}>
            <p>{text}</p>
        </Row>
    )
}

function GameRoom({ post, setPost }: { post: Post; setPost: (post: Post) => void }): JSX.Element {
    const { loggedIn, accountData, alert } = useContext(AccountContext)
    const [loading, setLoading] = useState(true)
    const [gameData, setGameData] = useState<any>()
    const [gameInProgress, setGameInProgress] = useState(false)
    const [userIsStreaming, setUserIsStreaming] = useState(false)
    const [players, setPlayers] = useState<any[]>([])
    const [gameSettingsModalOpen, setGameSettingsModalOpen] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [beads, setBeads] = useState<any[]>([])
    const [comments, setComments] = useState<any[]>([])
    const [showComments, setShowComments] = useState(document.body.clientWidth >= 900)
    const [showVideos, setShowVideos] = useState(false)
    const [videos, setVideos] = useState<any[]>([])
    const [firstInteractionWithPage, setFirstInteractionWithPage] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [audioTrackEnabled, setAudioTrackEnabled] = useState(true)
    const [videoTrackEnabled, setVideoTrackEnabled] = useState(true)
    const [audioOnly, setAudioOnly] = useState(false)
    const [turn, setTurn] = useState(0)
    const [loadingStream, setLoadingStream] = useState(false)
    const [backgroundModalOpen, setBackgroundModalOpen] = useState(false)
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
    const [topicImageModalOpen, setTopicImageModalOpen] = useState(false)
    const [topicTextModalOpen, setTopicTextModalOpen] = useState(false)
    const [leaveRoomModalOpen, setLeaveRoomModalOpen] = useState(false)
    const [mobileTab, setMobileTab] = useState<'comments' | 'game' | 'videos'>('game')
    const location = useLocation()
    const cookies = new Cookies()
    const postId = +location.pathname.split('/')[2]

    const userData = {
        id: accountData.id,
        handle: accountData.handle,
        name: accountData.name || 'Anonymous',
        flagImagePath: accountData.flagImagePath,
    }
    const roomId = post.id

    // state refs (used for up to date values between renders)
    const socket = useMemo(() => io(config.apiWebSocketURL || ''), [])
    const [mySocketId, setMySocketId] = useState<string>()
    const peersRef = useRef<any[]>([])
    const secondsTimerRef = useRef<any>(null)
    const audioRecorderRef = useRef<any>(null)
    const streamRef = useRef<any>(null)
    const audioRef = useRef<any>(null)
    const videoRef = useRef<any>(null)

    const history = useNavigate()
    const largeScreen = document.body.clientWidth >= 900
    const roomIntro = new Audio(`${config.publicAssets}/audio/room-intro.mp3`)
    const highMetalTone = new Audio(`${config.publicAssets}/audio/hi-metal-tone.mp3`)
    const lowMetalTone = new Audio(`${config.publicAssets}/audio/lo-metal-tone.mp3`)
    const arcWidth = 20
    const gameArcRadius = 180
    // const turnArcRadius = 180
    const moveArcRadius = 150
    const arcs = {
        gameArc: d3
            .arc()
            .innerRadius(gameArcRadius - arcWidth)
            .outerRadius(gameArcRadius)
            .cornerRadius(5),
        gameArc2: d3
            .arc()
            .innerRadius(gameArcRadius - arcWidth + 0.5)
            .outerRadius(gameArcRadius - 0.5)
            .cornerRadius(5),
        // turnArc: d3
        //     .arc()
        //     .innerRadius(turnArcRadius - arcWidth)
        //     .outerRadius(turnArcRadius)
        //     .cornerRadius(5),
        moveArc: d3
            .arc()
            .innerRadius(moveArcRadius - arcWidth)
            .outerRadius(moveArcRadius)
            .cornerRadius(5),
        moveArc2: d3
            .arc()
            .innerRadius(moveArcRadius - arcWidth + 0.5)
            .outerRadius(moveArcRadius - 0.5)
            .cornerRadius(5),
    }
    const iceConfig = {
        // iceTransportPolicy: 'relay',
        iceServers: [
            // { urls: 'stun:stun.l.google.com:19302' },
            { urls: `stun:${config.turnServerUrl}` },
            {
                urls: `turn:${config.turnServerUrl}`,
                username: config.turnServerUsername,
                credential: config.turnServerPassword,
            },
        ],
    }
    // todo: potentially remove and use players instead
    const totalUsersStreaming = videos.length + (userIsStreaming ? 1 : 0)
    const isYou = (id) => id === mySocketId

    function allowedTo(type) {
        switch (type) {
            case 'start-game':
                return loggedIn || alert('Log in to start the game')
            case 'save-game':
                return loggedIn || alert('Log in to save the game')
            case 'stream':
                return loggedIn || alert('Log in to start streaming')
            case 'comment':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to add comments')
                return true
            case 'change-background':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to change the background')
                return true
            case 'change-topic-text':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to change the topic')
                return true
            case 'change-topic-image':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to change the topic image')
                return true
            default:
                return false
        }
    }

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
                socketId: mySocketId,
                userData,
            })
            if (!videos.length) {
                setShowVideos(false)
                setMobileTab('game')
            }
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
                    const newPlayer = {
                        id: accountData.id,
                        name: accountData.name,
                        flagImagePath: accountData.flagImagePath,
                        socketId: mySocketId,
                    }
                    setPlayers((previousPlayers) => [...previousPlayers, newPlayer])
                    setLoadingStream(false)
                    setShowVideos(true)
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
                            const newPlayer = {
                                id: accountData.id,
                                name: accountData.name,
                                flagImagePath: accountData.flagImagePath,
                                socketId: mySocketId,
                            }
                            setPlayers((previousPlayers) => [...previousPlayers, newPlayer])
                            setLoadingStream(false)
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

    function refreshStream(socketId, user) {
        // singal refresh request
        socket.emit('outgoing-refresh-request', {
            userToSignal: socketId,
            userSignaling: {
                socketId: socket.id,
                userData,
            },
        })
        // destory old peer connection
        const peerObject = peersRef.current.find((p) => p.socketId === socketId)
        if (peerObject) {
            peerObject.peer.destroy()
            peersRef.current = peersRef.current.filter((p) => p.socketId !== socketId)
            setVideos((oldVideos) => oldVideos.filter((v) => v.socketId !== socketId))
            setPlayers((ps) => [...ps.filter((p) => p.socketId !== socketId)])
        }
        // create new peer connection
        const peer = new Peer({
            initiator: true,
            config: iceConfig,
            stream: streamRef.current,
        })
        peer.on('signal', (data) => {
            socket.emit('outgoing-signal-request', {
                userToSignal: socketId,
                userSignaling: {
                    socketId: socket.id,
                    userData,
                },
                signal: data,
            })
        })
        peer.on('stream', (stream) => {
            setVideos((oldVideos) => [
                ...oldVideos,
                {
                    socketId,
                    userData: user,
                    peer,
                    audioOnly: !stream.getVideoTracks().length,
                },
            ])
            pushComment(`${user.name}'s video connected`)
            addStreamToVideo(socketId, stream)
            const newPlayer = {
                id: user.id,
                name: user.name,
                flagImagePath: user.flagImagePath,
                socketId,
            }
            setPlayers((previousPlayers) => [...previousPlayers, newPlayer])
        })
        peer.on('close', () => peer.destroy())
        peer.on('error', (error) => console.log(error))
        peersRef.current.push({
            socketId,
            userData: user,
            peer,
        })
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

    function findVideoSize() {
        let videoSize = styles.xl
        if (totalUsersStreaming > 2) videoSize = styles.lg
        if (totalUsersStreaming > 3) videoSize = styles.md
        if (totalUsersStreaming > 4) videoSize = styles.sm
        if (document.body.clientWidth < 600) videoSize = styles.mobile
        return videoSize
    }

    async function createComment(e) {
        e.preventDefault()
        if (allowedTo('comment') && newComment.length) {
            const data = {
                postId: post.id,
                gameId: gameData.id,
                userId: accountData.id,
                text: newComment,
            }

            await axios.post(`${config.apiURL}/glass-bead-game-comment`, data)
            const signalData = {
                roomId,
                Creator: userData,
                text: newComment,
                createdAt: new Date(),
            }
            socket.emit('outgoing-comment', signalData)
            setNewComment('')
        }
    }

    function pushComment(comment) {
        setComments((c) => [...c, comment.Creator ? comment : { text: comment }])
    }

    function startArc(
        type: 'game' | 'turn' | 'move',
        duration: number,
        color: string,
        reverse?: boolean
    ) {
        d3.select(`#${type}-arc`).remove()
        d3.select('#timer-arcs')
            .append('path')
            .datum({ startAngle: 0, endAngle: reverse ? -2 * Math.PI : 2 * Math.PI })
            .attr('id', `${type}-arc`)
            .style('fill', color)
            .style('opacity', 1)
            .attr('d', arcs[`${type}Arc2`])
            .transition()
            .ease(d3.easeLinear)
            .duration(duration * 1000)
            .attrTween('d', (d) => {
                const interpolate = d3.interpolate(d.endAngle, 0)
                return (t) => {
                    d.endAngle = interpolate(t)
                    return arcs[`${type}Arc2`](d)
                }
            })
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

    function uploadAudio(moveNumber, blob) {
        const formData = new FormData()
        formData.append('file', blob)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(
                `${config.apiURL}/gbg-audio-upload?postId=${postId}&moveNumber=${moveNumber}`,
                formData,
                options
            )
            .then((res) => {
                const signalData = {
                    roomId,
                    type: 'bead',
                    mediaTypes: 'audio',
                    id: res.data.id,
                    Creator: userData,
                    Link: { index: moveNumber },
                }
                socket.emit('outgoing-audio-bead', signalData)
            })
            .catch((error) => {
                if (error.response) {
                    const { message } = error.response.data
                    switch (message) {
                        case 'File size too large':
                            alert(`Error uploading audio. ${message}`)
                            break
                        default:
                            alert(`Unknown error uploading audio`)
                            break
                    }
                } else console.log(error)
            })
    }

    function startGame(data) {
        setGameData(data)
        setPlayers(data.players)
        setShowComments(false)
        setShowVideos(false)
        const firstPlayer = data.players[0]
        d3.select(`#player-${firstPlayer.socketId}`).text('(up next)')
        if (data.introDuration > 0) {
            d3.select('#timer-move-state').text('Intro')
            d3.select('#timer-seconds').text(data.introDuration)
            startArc('move', data.introDuration, colors.black)
            let timeLeft = data.introDuration
            secondsTimerRef.current = setInterval(() => {
                timeLeft -= 1
                d3.select('#timer-seconds').text(timeLeft)
                if (timeLeft < 1) {
                    clearInterval(secondsTimerRef.current)
                    startMove(1, 0, firstPlayer, data)
                }
            }, 1000)
        } else startMove(1, 0, firstPlayer, data)
    }

    function startMove(moveNumber, turnNumber, player, data) {
        const { movesPerPlayer, moveDuration, intervalDuration } = data
        // if your move, start audio recording
        if (isYou(player.socketId)) startAudioRecording()
        // calculate turn and game duration
        const turnDuration = data.players.length * (moveDuration + intervalDuration)
        const gameDuration = turnDuration * movesPerPlayer - intervalDuration
        // if first move, start game arc
        if (moveNumber === 1) startArc('game', gameDuration, colors.white)
        // if new turn, start turn arc
        const newTurnNumber = Math.ceil(moveNumber / data.players.length)
        if (turnNumber !== newTurnNumber) {
            setTurn(newTurnNumber)
            // startArc(
            //     'turn',
            //     // if final turn, remove interval duration from turn duration
            //     newTurnNumber === movesPerPlayer ? turnDuration - intervalDuration : turnDuration,
            //     colors.aqua
            // )
        }
        // start move arc
        startArc('move', moveDuration, colors.black)
        lowMetalTone.play()
        // update ui state
        d3.select('#timer-move-state').text('Move')
        d3.select('#timer-seconds').text(moveDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        d3.select(`#player-${player.socketId}`).text('(recording)')
        // start seconds timer
        let timeLeft = moveDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft < 1) {
                // end seconds timer
                clearInterval(secondsTimerRef.current)
                // if your move, stop audio recording
                stopAudioRecording(isYou(player.socketId)).then((blob) => {
                    if (blob) uploadAudio(moveNumber, blob)
                    // if moves left
                    if (moveNumber < movesPerPlayer * data.players.length) {
                        // calculate next player from previous players index
                        const PPIndex = data.players.findIndex(
                            (p) => p.socketId === player.socketId
                        )
                        const endOfTurn = PPIndex + 1 === data.players.length
                        const nextPlayer = data.players[endOfTurn ? 0 : PPIndex + 1]
                        // if interval, start interval
                        if (intervalDuration > 0)
                            startInterval(moveNumber + 1, newTurnNumber, nextPlayer, data)
                        // else start next move
                        else startMove(moveNumber + 1, newTurnNumber, nextPlayer, data)
                    } else if (data.outroDuration) startOutro(data)
                    else endGame()
                })
            }
        }, 1000)
    }

    function startInterval(moveNumber, turnNumber, nextPlayer, data) {
        const { intervalDuration } = data
        // start interval timer
        startArc('move', intervalDuration, colors.black)
        lowMetalTone.play()
        // update ui state
        d3.select('#timer-move-state').text('Interval')
        d3.select('#timer-seconds').text(intervalDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        d3.select(`#player-${nextPlayer.socketId}`).text('(up next)')
        // start seconds timer
        let timeLeft = intervalDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft === 0) {
                // end seconds timer and start move
                clearInterval(secondsTimerRef.current)
                startMove(moveNumber, turnNumber, nextPlayer, data)
            }
        }, 1000)
    }

    function startOutro(data) {
        d3.select('#timer-move-state').text('Outro')
        d3.select('#timer-seconds').text(data.outroDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        startArc('move', data.outroDuration, colors.black, true)
        let timeLeft = data.outroDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft < 1) {
                clearInterval(secondsTimerRef.current)
                endGame()
            }
        }, 1000)
    }

    function endGame() {
        highMetalTone.play()
        setGameInProgress(false)
        setTurn(0)
        d3.select('#timer-seconds').text('')
        d3.select('#timer-move-state').text('Move')
        d3.select(`#game-arc`).remove()
        d3.select(`#turn-arc`).remove()
        d3.select(`#move-arc`).remove()
        d3.selectAll(`.${styles.playerState}`).text('')
        pushComment('The game ended')
        // addPlayButtonToCenterBead()
        d3.select('#timer-bead-wave-form').transition(1000).style('opacity', 0)
        if (largeScreen) {
            setShowComments(true)
            setShowVideos(true)
        }
    }

    function signalStopGame() {
        socket.emit('outgoing-stop-game', {
            roomId,
            userSignaling: userData,
            gameId: gameData.id,
            postId: post.id,
        })
    }

    function saveGame() {
        socket.emit('outgoing-save-game', {
            roomId,
            userSignaling: userData,
            gameData,
        })
        axios.post(`${config.apiURL}/save-glass-bead-game`, { postId: post.id })
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

    useEffect(() => {
        if (showVideos && firstInteractionWithPage) {
            // unmute videos
            videos.forEach((v) => {
                const video = document.getElementById(v.socketId) as HTMLVideoElement
                if (video) {
                    video.muted = false
                    video.play()
                }
            })
            setFirstInteractionWithPage(false)
        }
    }, [showVideos])

    function addEventListenersToBead(index) {
        d3.select(`#post-audio-bead-card-${post.id}-${index}`)
            .on('play', () => {
                d3.select('#play-button').attr('display', 'none')
                d3.select('#pause-button').attr('display', 'flex')
            })
            .on('pause', () => {
                d3.select('#play-button').attr('display', 'flex')
                d3.select('#pause-button').attr('display', 'none')
            })
            .on('ended', () => {
                const nextBead = d3.select(`#post-audio-bead-card-${post.id}-${index + 1}`).node()
                if (nextBead) nextBead.play()
                else {
                    d3.select('#play-button').attr('display', 'flex')
                    d3.select('#pause-button').attr('display', 'none')
                }
            })
    }

    useEffect(() => {
        switch (mobileTab) {
            case 'comments':
                if (showComments) {
                    setMobileTab('game')
                    setShowComments(false)
                } else {
                    setMobileTab('comments')
                    setShowComments(true)
                    setShowVideos(false)
                }
                break
            case 'game':
                setMobileTab('game')
                setShowComments(false)
                setShowVideos(false)
                break
            case 'videos':
                if (showVideos) {
                    setMobileTab('game')
                    setShowVideos(false)
                } else {
                    setMobileTab('videos')
                    setShowVideos(true)
                    setShowComments(false)
                }
                break
            default:
                break
        }
    }, [mobileTab])

    async function getGameData() {
        return axios.get(`${config.apiURL}/gbg-data?postId=${post.id}&noLimit=true`)
    }

    async function getGameComments() {
        return axios.get(`${config.apiURL}/glass-bead-game-comments?postId=${post.id}`)
    }

    function buildCanvas() {
        const loadingAnimationDuration = 2000
        const timerFadeInDuration = 3000

        const width = 500
        const center = width / 2
        const circleWidth = 100
        const circleOffset = circleWidth * (13 / 15)

        const loadingAnimationSVG = d3
            .select('#loading-animation')
            .append('svg')
            .attr('id', 'loading-animation-svg')
            .attr('viewBox', `0 0 ${width} ${width}`)
            .attr('perserveAspectRatio', 'xMinYMin')
            .attr('style', 'max-width: 500px')

        function createCircle(id, cx, cy) {
            loadingAnimationSVG
                .append('circle')
                .attr('id', id)
                .attr('stroke', 'black')
                .attr('fill', 'none')
                .attr('stroke-width', 2)
                .attr('r', circleWidth)
                .attr('cx', cx)
                .attr('cy', cy)
        }

        createCircle('center', center, center)
        createCircle('center-top', center, center - circleWidth)
        createCircle('center-bottom', center, center + circleWidth)
        createCircle('left-top', center - circleOffset, center - circleWidth / 2)
        createCircle('left-bottom', center - circleOffset, center + circleWidth / 2)
        createCircle('right-top', center + circleOffset, center - circleWidth / 2)
        createCircle('right-bottom', center + circleOffset, center + circleWidth / 2)

        function animateCircle(id, offset) {
            d3.select(`#${id}`)
                .transition()
                .ease(d3.easeCubicInOut)
                .duration(3000)
                .attr('cx', center + offset)
                .on('end', () => {
                    d3.select(`#${id}`)
                        .transition()
                        .ease(d3.easeCubicInOut)
                        .duration(3000)
                        .attr('cx', center - offset)
                        .on('end', () => {
                            animateCircle(id, offset)
                        })
                })
        }

        roomIntro.volume = 0.2
        roomIntro.play()
        animateCircle('left-top', circleOffset)
        animateCircle('left-bottom', circleOffset)
        animateCircle('right-top', -circleOffset)
        animateCircle('right-bottom', -circleOffset)

        // fade out loading animation
        setTimeout(() => {
            const loadingAnimation = d3.select('#loading-animation')
            if (loadingAnimation) loadingAnimation.style('opacity', 0)
            setTimeout(() => {
                setShowLoadingAnimation(false)
                if (largeScreen) {
                    setShowComments(false)
                }
            }, 1000)
        }, loadingAnimationDuration)

        // set up timer canvas
        const svg = d3
            .select('#timer-canvas')
            .append('svg')
            .attr('id', 'timer-svg')
            .attr('viewBox', `0 0 ${gameArcRadius * 2} ${gameArcRadius * 2}`)
            .attr('perserveAspectRatio', 'xMaxYMax')

        const imageDefs = svg.append('defs').attr('id', 'image-defs')

        function createTimerGroup(id: string) {
            return svg
                .append('g')
                .attr('id', id)
                .attr('transform', `translate(${gameArcRadius},${gameArcRadius})`)
        }

        // order is important here to ensure correct layering
        const timerBackground = createTimerGroup('timer-background')
        createTimerGroup('timer-arcs')
        const timerText = createTimerGroup('timer-text')
        const timerBead = createTimerGroup('timer-bead')

        function createArcBarckground(type: 'game' | 'turn' | 'move', color: string) {
            timerBackground
                .append('path')
                .datum({ startAngle: 0, endAngle: 2 * Math.PI })
                .attr('id', `${type}-arc-background`)
                .style('fill', color)
                .style('opacity', 1)
                .style('stroke', 'black')
                .style('stroke-width', 1)
                .attr('d', arcs[`${type}Arc`])
        }

        function createArcTitle(text: string, fontSize: number, yOffset: number, id?: string) {
            timerText
                .append('text')
                .text(text)
                .attr('id', id)
                .attr('text-anchor', 'middle')
                .attr('font-size', `${fontSize}px`)
                .attr('x', 0)
                .attr('y', yOffset)
                .style('fill', 'black')
                .style('text-shadow', '0px 0px 6px white')
                .style('opacity', 0)
                .transition()
                .delay(loadingAnimationDuration)
                .duration(timerFadeInDuration)
                .style('opacity', 1)
        }

        createArcBarckground('game', colors.grey3)
        // createArcBarckground('turn', colors.grey2)
        createArcBarckground('move', colors.grey2)
        createArcTitle('Game', 16, -164)
        // createArcTitle('Turn', 16, -164)
        createArcTitle('Move', 16, -134, 'timer-move-state')
        createArcTitle('', 24, -98, 'timer-seconds')

        timerBead
            .append('rect')
            .attr('x', -80)
            .attr('y', -80)
            .attr('width', 160)
            .attr('height', 160)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('fill', 'white')
            .style('stroke', 'black')
            .style('stroke-width', 1)

        imageDefs
            .append('pattern')
            .attr('id', 'wave-form-pattern')
            .attr('height', 1)
            .attr('width', 1)
            .append('image')
            .attr('id', 'wave-form-image')
            .attr('height', 120)
            .attr('xlink:href', `${config.publicAssets}/icons/gbg/sound-wave.png`)

        timerBead
            .append('rect')
            .attr('id', 'timer-bead-wave-form')
            .attr('width', 120)
            .attr('height', 120)
            .attr('x', -60)
            .attr('y', -60)
            .style('opacity', 1)
            .style('fill', 'url(#wave-form-pattern)')
    }

    // todo: flatten out userData into user object with socketId
    useEffect(() => {
        Promise.all([getGameData(), getGameComments()]).then((res) => {
            setGameData(res[0].data.game)
            const gameBeads = res[0].data.beads // .sort((a, b) => a.Link.index - b.Link.index)
            setBeads(gameBeads)
            setPlayers(res[0].data.players)
            setComments(res[1].data)
            setLoading(false)
            if (gameBeads.length) d3.select('#timer-bead-wave-form').style('opacity', 0)
            gameBeads.forEach((bead, index) => addEventListenersToBead(index))

            // join room
            socket.emit('outgoing-join-room', {
                roomId,
                userData,
            })

            // listen for signals:
            socket.on('incoming-room-joined', (payload) => {
                const { socketId: incomingSocketId, usersInRoom } = payload
                setMySocketId(incomingSocketId)
                setUsers([
                    ...usersInRoom,
                    {
                        socketId: incomingSocketId,
                        userData,
                    },
                ])
                pushComment(`You joined the room`)
                usersInRoom.forEach((user) => {
                    // remove old peer if present
                    const peerObject = peersRef.current.find((p) => p.socketId === user.socketId)
                    if (peerObject) {
                        peerObject.peer.destroy()
                        peersRef.current = peersRef.current.filter(
                            (p) => p.socketId !== user.socketId
                        )
                        setVideos((oldVideos) =>
                            oldVideos.filter((v) => v.socketId !== user.socketId)
                        )
                    }
                    // create peer connection
                    const peer = new Peer({
                        initiator: true,
                        config: iceConfig,
                    })
                    peer.on('signal', (data) => {
                        socket.emit('outgoing-signal-request', {
                            userToSignal: user.socketId,
                            userSignaling: {
                                socketId: socket.id,
                                userData,
                            },
                            signal: data,
                        })
                    })
                    // peer.on('connect', () => console.log('connect 1'))
                    peer.on('stream', (stream) => {
                        setVideos((oldVideos) => [
                            ...oldVideos,
                            {
                                socketId: user.socketId,
                                userData: user.userData,
                                peer,
                                audioOnly: !stream.getVideoTracks().length,
                            },
                        ])
                        pushComment(`${user.userData.name}'s video connected`)
                        addStreamToVideo(user.socketId, stream)
                        const newPlayer = {
                            id: user.userData.id,
                            name: user.userData.name,
                            flagImagePath: user.userData.flagImagePath,
                            socketId: user.socketId,
                        }
                        setPlayers((previousPlayers) => [...previousPlayers, newPlayer])
                    })
                    peer.on('close', () => peer.destroy())
                    peer.on('error', (error) => console.log(error))
                    peersRef.current.push({
                        socketId: user.socketId,
                        userData: user.userData,
                        peer,
                    })
                })
            })
            // signal returned from peer
            socket.on('incoming-signal', (payload) => {
                const peerObject = peersRef.current.find((p) => p.socketId === payload.id)
                if (peerObject) {
                    if (peerObject.peer.readable) peerObject.peer.signal(payload.signal)
                    else {
                        peerObject.peer.destroy()
                        peersRef.current = peersRef.current.filter((p) => p.socketId !== payload.id)
                    }
                } else console.log('no peer!')
            })
            // signal request from peer
            socket.on('incoming-signal-request', (payload) => {
                const { signal, userSignaling } = payload
                // search for peer in peers array
                const existingPeer = peersRef.current.find(
                    (p) => p.socketId === userSignaling.socketId
                )
                // if peer exists, pass signal to peer
                if (existingPeer) {
                    existingPeer.peer.signal(signal)
                } else {
                    // otherwise, create new peer connection (with stream if running)
                    const peer = new Peer({
                        initiator: false,
                        stream: streamRef.current,
                        config: iceConfig,
                    })
                    peer.on('signal', (data) => {
                        socket.emit('outgoing-signal', {
                            userToSignal: userSignaling.socketId,
                            signal: data,
                        })
                    })
                    peer.on('connect', () => console.log('peer connect 2'))
                    peer.on('stream', (stream) => {
                        setVideos((oldVideos) => [
                            ...oldVideos,
                            {
                                socketId: userSignaling.socketId,
                                userData: userSignaling.userData,
                                peer,
                                audioOnly: !stream.getVideoTracks().length,
                            },
                        ])
                        pushComment(`${userSignaling.userData.name}'s video connected`)
                        addStreamToVideo(userSignaling.socketId, stream)
                        const newPlayer = {
                            id: userSignaling.userData.id,
                            name: userSignaling.userData.name,
                            flagImagePath: userSignaling.userData.flagImagePath,
                            socketId: userSignaling.socketId,
                        }
                        setPlayers((previousPlayers) => [...previousPlayers, newPlayer])
                    })
                    peer.on('close', () => peer.destroy())
                    peer.on('error', (error) => console.log('error 2: ', error))
                    peer.signal(signal)
                    peersRef.current.push({
                        socketId: userSignaling.socketId,
                        userData: userSignaling.userData,
                        peer,
                    })
                }
            })
            // user joined room
            socket.on('incoming-user-joined', (user) => {
                setUsers((oldUsers) => [...oldUsers, user])
                pushComment(`${user.userData.name} joined the room`)
            })
            // user left room
            socket.on('incoming-user-left', (user) => {
                const peerObject = peersRef.current.find((p) => p.socketId === user.socketId)
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter((p) => p.socketId !== user.socketId)
                }
                setUsers((oldUsers) => oldUsers.filter((u) => u.socketId !== user.socketId))
                peersRef.current = peersRef.current.filter((p) => p.socketId !== user.socketId)
                setVideos((oldVideos) => oldVideos.filter((v) => v.socketId !== user.socketId))
                setPlayers((ps) => [...ps.filter((p) => p.socketId !== user.socketId)])
                pushComment(`${user.userData.name} left the room`)
            })
            // comment recieved
            socket.on('incoming-comment', (data) => {
                pushComment(data)
            })
            // start game signal recieved
            socket.on('incoming-start-game', (data) => {
                setGameSettingsModalOpen(false)
                setGameInProgress(true)
                setBeads([])
                d3.select('#play-button')
                    .classed('transitioning', true)
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove()
                d3.select('#pause-button')
                    .classed('transitioning', true)
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove()
                d3.select('#timer-bead-wave-form').transition(1000).style('opacity', 1)
                pushComment(`${data.userSignaling.name} started the game`)
                startGame(data.gameData)
            })
            // stop game signal recieved
            socket.on('incoming-stop-game', (data) => {
                if (largeScreen) {
                    setShowComments(true)
                    setShowVideos(true)
                }
                pushComment(`${data.userSignaling.name} stopped the game`)
                setGameInProgress(false)
                clearInterval(secondsTimerRef.current)
                d3.selectAll(`.${styles.playerState}`).text('')
                d3.select(`#game-arc`).remove()
                d3.select(`#turn-arc`).remove()
                d3.select(`#move-arc`).remove()
                d3.select('#timer-seconds').text('')
                // addPlayButtonToCenterBead()
                // d3.select('#timer-bead-wave-form').transition(1000).style('opacity', 0)
                setTurn(0)
                // todo: store move index as ref so 999 can be avoided
                if (audioRecorderRef.current && audioRecorderRef.current.state === 'recording')
                    stopAudioRecording(true).then((blob) => uploadAudio(999, blob))
            })
            // save game signal recieved
            socket.on('incoming-save-game', (data) => {
                pushComment(`${data.userSignaling.name} saved the game`)
                setGameData({ ...data.gameData, locked: true })
            })
            // audio bead recieved
            socket.on('incoming-audio-bead', (data) => {
                setBeads((previousBeads) => [...previousBeads, data])
                addEventListenersToBead(data.Link.index)
                // if (!gameInProgressRef.current) {
                //     d3.select('#timer-bead-wave-form').transition(1000).style('opacity', 0)
                //     // addPlayButtonToCenterBead()
                // }
            })
            // peer refresh request
            socket.on('incoming-refresh-request', (data) => {
                const { id } = data
                const peerObject = peersRef.current.find((p) => p.socketId === id)
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter((p) => p.socketId !== id)
                    setVideos((oldVideos) => oldVideos.filter((v) => v.socketId !== id))
                    setPlayers((ps) => [...ps.filter((p) => p.socketId !== id)])
                }
            })
            // new background
            socket.on('incoming-new-background', (data) => {
                const { type, url, startTime, userSignaling } = data
                if (type === 'image') {
                    setGameData({
                        ...data.gameData,
                        backgroundImage: url,
                        backgroundVideo: null,
                        backgroundVideoStartTime: null,
                    })
                } else {
                    setGameData({
                        ...data.gameData,
                        backgroundImage: null,
                        backgroundVideo: url,
                        backgroundVideoStartTime: startTime,
                    })
                }
                pushComment(`${userSignaling.name} added a new background`)
            })
            // new topic text
            socket.on('incoming-new-topic-text', (data) => {
                const { userSignaling, newTopicText } = data
                setGameData({ ...data.gameData, topicGroup: null })
                setPost({ ...post, title: newTopicText })
                pushComment(`${userSignaling.name} updated the topic`)
            })
            // new topic image
            socket.on('incoming-new-topic-image', (data) => {
                const { userSignaling, url } = data
                setGameData({ ...data.gameData, topicImage: url })
                pushComment(`${userSignaling.name} added a new topic image`)
            })
            // stream disconnected
            socket.on('incoming-stream-disconnected', (data) => {
                setVideos((oldVideos) => oldVideos.filter((v) => v.socketId !== data.socketId))
                setPlayers((ps) => [...ps.filter((p) => p.socketId !== data.socketId)])
                pushComment(`${data.userData.name}'s stream disconnected`)
            })
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    useEffect(() => {
        if (!loading) buildCanvas()
    }, [loading])

    return (
        <Column className={styles.wrapper}>
            {showLoadingAnimation && (
                <div className={styles.loadingAnimation} id='loading-animation' />
            )}
            {!loading && mySocketId && (
                <>
                    {gameData.backgroundVideo && (
                        <iframe
                            className={styles.backgroundVideo}
                            title='background video'
                            src={`https://www.youtube.com/embed/${gameData.backgroundVideo}?start=${
                                gameData.backgroundVideoStartTime || 1
                            }&autoplay=1&mute=1&enablejsapi=1`}
                        />
                    )}
                    {gameData.backgroundImage && (
                        <img
                            className={styles.backgroundImage}
                            src={gameData.backgroundImage}
                            alt=''
                        />
                    )}
                    {backgroundModalOpen && (
                        <GameBackgroundModal
                            gameData={gameData}
                            roomId={roomId}
                            socket={socket}
                            onClose={() => setBackgroundModalOpen(false)}
                        />
                    )}
                    {topicTextModalOpen && (
                        <GameTopicModal
                            gameData={gameData}
                            onClose={() => setTopicTextModalOpen(false)}
                            post={post}
                            roomId={roomId}
                            socket={socket}
                        />
                    )}
                    {topicImageModalOpen && (
                        <GameTopicImageModal
                            gameData={gameData}
                            roomId={roomId}
                            socket={socket}
                            onClose={() => setTopicImageModalOpen(false)}
                        />
                    )}
                    <Row centerY className={styles.mobileHeader}>
                        <button
                            type='button'
                            onClick={() => setMobileTab('comments')}
                            className={`${mobileTab === 'comments' && styles.selected}`}
                        >
                            <CommentIcon />
                        </button>
                        <button
                            type='button'
                            onClick={() => setMobileTab('game')}
                            className={`${mobileTab === 'game' && styles.selected}`}
                        >
                            <CastaliaIcon />
                        </button>
                        <button
                            type='button'
                            onClick={() => setMobileTab('videos')}
                            className={`${mobileTab === 'videos' && styles.selected}`}
                        >
                            <SettingsIcon />
                        </button>
                    </Row>
                    <Row
                        spaceBetween
                        className={`${styles.mainContent} ${beads.length && styles.showBeads}`}
                    >
                        <Column
                            spaceBetween
                            className={`${styles.commentBar} ${!showComments && styles.hidden} ${
                                (gameData.backgroundImage || gameData.backgroundVideo) &&
                                styles.transparent
                            }`}
                        >
                            <Scrollbars className={styles.comments} autoScrollToBottom>
                                {comments.map((comment) => (
                                    <Comment comment={comment} key={uuidv4()} />
                                ))}
                            </Scrollbars>
                            <form className={styles.commentInput} onSubmit={createComment}>
                                <Input
                                    type='text'
                                    placeholder='comment...'
                                    value={newComment}
                                    onChange={(v) => setNewComment(v)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button text='Send' color='game-white' submit />
                            </form>
                            <button
                                className={styles.closeCommentsButton}
                                onClick={() => setShowComments(!showComments)}
                                type='button'
                            >
                                <ChevronUpIcon transform={`rotate(${showComments ? 270 : 90})`} />
                            </button>
                        </Column>
                        <Column
                            centerX
                            className={`${styles.centerPanel} ${
                                !largeScreen && showVideos && styles.hidden
                            }`}
                        >
                            {gameInProgress ? (
                                <Column
                                    className={`${styles.gameControls} ${
                                        largeScreen && styles.large
                                    }`}
                                >
                                    <Button
                                        text='Stop game'
                                        color='game-black'
                                        size={largeScreen ? 'large' : 'small'}
                                        style={{ marginBottom: 10 }}
                                        onClick={signalStopGame}
                                    />
                                    <p>{`Turn ${turn} / ${gameData.movesPerPlayer}`}</p>
                                    {players.map((player, index) => (
                                        <Row
                                            centerY
                                            key={player.socketId}
                                            className={styles.player}
                                        >
                                            <div className={styles.position}>{index + 1}</div>
                                            <ImageTitle
                                                type='user'
                                                imagePath={player.flagImagePath}
                                                title={isYou(player.socketId) ? 'You' : player.name}
                                                fontSize={largeScreen ? 16 : 10}
                                                imageSize={largeScreen ? 35 : 20}
                                                style={{ marginRight: largeScreen ? 10 : 5 }}
                                            />
                                            <p
                                                id={`player-${player.socketId}`}
                                                className={styles.playerState}
                                            />
                                        </Row>
                                    ))}
                                </Column>
                            ) : (
                                <Column className={styles.gameControls}>
                                    {gameData.locked && (
                                        <Row centerY className={styles.gameLocked}>
                                            <LockIcon />
                                            <p>Game locked</p>
                                        </Row>
                                    )}
                                    <Button
                                        text='Leave game room'
                                        color='game-black'
                                        size={largeScreen ? 'large' : 'small'}
                                        style={{ marginBottom: 10 }}
                                        onClick={() => setLeaveRoomModalOpen(true)}
                                    />
                                    {leaveRoomModalOpen && (
                                        <Modal centerX close={() => setLeaveRoomModalOpen(false)}>
                                            <h1>Are you sure you want to leave?</h1>
                                            <Row wrap>
                                                <Button
                                                    text='Yes, leave room'
                                                    color='game-black'
                                                    style={{ marginRight: 10, marginBottom: 10 }}
                                                    onClick={() => history('/s/all/posts')}
                                                />
                                                <Button
                                                    text='No, cancel'
                                                    color='game-white'
                                                    style={{ marginBottom: 10 }}
                                                    onClick={() => setLeaveRoomModalOpen(false)}
                                                />
                                            </Row>
                                        </Modal>
                                    )}
                                    {!gameData.locked &&
                                        userIsStreaming &&
                                        allowedTo('start-game') && (
                                            <Button
                                                text={`${beads.length ? 'Restart' : 'Start'} game`}
                                                color={beads.length ? 'game-black' : 'game-white'}
                                                size={largeScreen ? 'large' : 'small'}
                                                style={{ marginBottom: 10 }}
                                                onClick={() => setGameSettingsModalOpen(true)}
                                            />
                                        )}
                                    {!gameData.locked &&
                                        beads.length > 0 &&
                                        allowedTo('save-game') && (
                                            <Button
                                                text='Save game'
                                                color='game-white'
                                                size={largeScreen ? 'large' : 'small'}
                                                style={{ marginBottom: 10 }}
                                                onClick={saveGame}
                                            />
                                        )}
                                    <Button
                                        text={`${
                                            gameData.backgroundImage || gameData.backgroundVideo
                                                ? 'Change'
                                                : 'Add'
                                        } background`}
                                        color='game-white'
                                        size={largeScreen ? 'large' : 'small'}
                                        style={{ marginBottom: 10 }}
                                        onClick={() =>
                                            allowedTo('change-background') &&
                                            setBackgroundModalOpen(true)
                                        }
                                    />
                                </Column>
                            )}
                            {gameSettingsModalOpen && (
                                <GameRoomGameSettingsModal
                                    onClose={() => setGameSettingsModalOpen(false)}
                                    post={post}
                                    roomId={roomId}
                                    gameData={gameData}
                                    socketId={mySocketId}
                                    socket={socket}
                                    players={players}
                                    setPlayers={setPlayers}
                                />
                            )}
                            <Column centerX className={styles.timerColumn}>
                                <CurvedDNAIcon
                                    className={`${styles.curvedDNA} ${
                                        beads.length && styles.withBeads
                                    }`}
                                />
                                <Row centerY className={styles.topicText}>
                                    <h1>{post.title}</h1>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            allowedTo('change-topic-text') &&
                                            setTopicTextModalOpen(true)
                                        }
                                    >
                                        <EditIcon />
                                    </button>
                                </Row>
                                <Row centerY centerX className={styles.topicImage}>
                                    {gameData.topicImage && (
                                        <img src={gameData.topicImage} alt='' />
                                    )}
                                    <button
                                        type='button'
                                        className={styles.uploadTopicImageButton}
                                        onClick={() =>
                                            allowedTo('change-topic-image') &&
                                            setTopicImageModalOpen(true)
                                        }
                                    >
                                        <p>Add a new topic image</p>
                                    </button>
                                </Row>
                                <Column
                                    className={`${styles.timerContainer} ${
                                        beads.length && styles.beadDrawOpen
                                    }`}
                                >
                                    <div id='timer-canvas' className={styles.timer} />
                                </Column>
                            </Column>
                            {largeScreen && (
                                <Column className={styles.people}>
                                    <Button
                                        text={`${userIsStreaming ? 'Stop' : 'Start'} streaming`}
                                        color={userIsStreaming ? 'game-black' : 'game-white'}
                                        style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                                        loading={loadingStream}
                                        disabled={loadingStream}
                                        onClick={() => allowedTo('stream') && toggleStream()}
                                    />
                                    {totalUsersStreaming > 0 && (
                                        <Button
                                            color='game-white'
                                            text={`${showVideos ? 'Hide' : 'Show'} videos`}
                                            onClick={() => setShowVideos(!showVideos)}
                                            style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                                        />
                                    )}
                                    <Column className={styles.peopleStreaming}>
                                        {!showVideos && (
                                            <Column style={{ marginBottom: 10 }}>
                                                <p
                                                    style={{ marginBottom: 10 }}
                                                >{`${totalUsersStreaming} ${
                                                    isPlural(totalUsersStreaming)
                                                        ? 'people'
                                                        : 'person'
                                                } streaming`}</p>
                                                {userIsStreaming && (
                                                    <ImageTitle
                                                        type='user'
                                                        imagePath={userData.flagImagePath}
                                                        title='You'
                                                        fontSize={16}
                                                        imageSize={40}
                                                        style={{ marginBottom: 10 }}
                                                    />
                                                )}
                                                {videos.map((user) => (
                                                    <ImageTitle
                                                        key={user.socketId}
                                                        type='user'
                                                        imagePath={user.userData.flagImagePath}
                                                        title={user.userData.name}
                                                        fontSize={16}
                                                        imageSize={40}
                                                        style={{ marginBottom: 10 }}
                                                    />
                                                ))}
                                            </Column>
                                        )}
                                    </Column>
                                    <Column className={styles.peopleInRoom}>
                                        <p style={{ marginBottom: 10 }}>{`${users.length} ${
                                            isPlural(users.length) ? 'people' : 'person'
                                        } in room`}</p>
                                        {users.map((user) => (
                                            <ImageTitle
                                                key={user.socketId}
                                                type='user'
                                                imagePath={user.userData.flagImagePath}
                                                title={
                                                    isYou(user.socketId)
                                                        ? 'You'
                                                        : user.userData.name
                                                }
                                                fontSize={16}
                                                imageSize={40}
                                                style={{ marginBottom: 10 }}
                                            />
                                        ))}
                                    </Column>
                                </Column>
                            )}
                        </Column>
                        <Scrollbars
                            className={`${styles.videos} ${findVideoSize()} ${
                                !showVideos && styles.hidden
                            }`}
                        >
                            {!largeScreen && (
                                <Button
                                    text={`${userIsStreaming ? 'Stop' : 'Start'} streaming`}
                                    color={userIsStreaming ? 'red' : 'aqua'}
                                    style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                                    loading={loadingStream}
                                    disabled={loadingStream}
                                    onClick={() => allowedTo('stream') && toggleStream()}
                                />
                            )}
                            {userIsStreaming && (
                                <Video
                                    id='your-video'
                                    user={userData}
                                    size={findVideoSize()}
                                    audioEnabled={audioTrackEnabled}
                                    videoEnabled={videoTrackEnabled}
                                    toggleAudio={toggleAudioTrack}
                                    toggleVideo={toggleVideoTrack}
                                    audioOnly={audioOnly}
                                />
                            )}
                            {videos.map((v) => (
                                <Video
                                    key={v.socketId}
                                    id={v.socketId}
                                    user={v.userData}
                                    size={findVideoSize()}
                                    audioOnly={v.audioOnly}
                                    refreshStream={refreshStream}
                                />
                            ))}
                        </Scrollbars>
                    </Row>
                    <Scrollbars
                        className={`${styles.beads} ${!beads.length && styles.hidden} ${
                            (gameData.backgroundImage || gameData.backgroundVideo) &&
                            styles.transparent
                        }`}
                    >
                        <Row centerY style={{ height: '100%' }}>
                            {beads.map((bead, beadIndex) => (
                                <Row
                                    centerY
                                    key={bead.id} // bead.Audios[0].url
                                    style={{
                                        paddingRight: beads.length === beadIndex + 1 ? 20 : 0,
                                    }}
                                >
                                    <BeadCard
                                        postId={post.id}
                                        location='gbg-room'
                                        bead={bead}
                                        beadIndex={beadIndex}
                                    />
                                    {beads.length > beadIndex + 1 && (
                                        <Row centerY className={styles.beadDivider}>
                                            <DNAIcon />
                                        </Row>
                                    )}
                                </Row>
                            ))}
                        </Row>
                    </Scrollbars>
                </>
            )}
        </Column>
    )
}

export default GameRoom
