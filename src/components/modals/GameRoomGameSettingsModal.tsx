/* eslint-disable no-inner-declarations */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import Modal from '@components/modals/Modal'
import config from '@src/Config'
import { GameData, Post, allValid, defaultErrorState } from '@src/Helpers'
import { IUser } from '@src/Interfaces'
import { AccountContext } from '@src/contexts/AccountContext'
import styles from '@styles/components/Game.module.scss'
import { ChevronDownIcon, ChevronUpIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { Socket } from 'socket.io-client'

type Player = IUser & { socketId: string }

export type GameRoomGameSettingsModal = {
    post: Post
    socket: Socket
    roomId: number
    gameData: GameData
    players: Player[]
    setPlayers: (players: Player[]) => void
    socketId: string
    onClose: () => void
}

const gameDefaults = {
    id: null,
    locked: true,
    introDuration: 0,
    movesPerPlayer: 5,
    moveDuration: 60,
    intervalDuration: 0,
    outroDuration: 0,
}

export function GameRoomGameSettingsModal({
    roomId,
    post,
    gameData,
    socketId,
    players,
    setPlayers,
    onClose,
    socket,
}: GameRoomGameSettingsModal) {
    const { accountData } = useContext(AccountContext)

    const [formData, setFormData] = useState({
        topic: post.title,
        introDuration: {
            value: gameData.introDuration || gameDefaults.introDuration,
            validate: (v) => (v > 300 ? ['Must be 5 mins or less'] : []),
            ...defaultErrorState,
        },
        movesPerPlayer: {
            value: gameData.movesPerPlayer || gameDefaults.movesPerPlayer,
            validate: (v) => (v < 1 || v > 20 ? ['Must be between 1 and 20 turns'] : []),
            ...defaultErrorState,
        },
        moveDuration: {
            value: gameData.moveDuration || gameDefaults.moveDuration,
            validate: (v) => (v < 10 || v > 600 ? ['Must be between 10 seconds and 10 mins'] : []),
            ...defaultErrorState,
        },
        intervalDuration: {
            value: gameData.intervalDuration || gameDefaults.intervalDuration,
            validate: (v) => (v > 60 ? ['Must be 60 seconds or less'] : []),
            ...defaultErrorState,
        },
        outroDuration: {
            value: gameData.outroDuration || gameDefaults.outroDuration,
            validate: (v) => (v > 300 ? ['Must be 5 minutes or less'] : []),
            ...defaultErrorState,
        },
    })
    const { introDuration, movesPerPlayer, moveDuration, intervalDuration, outroDuration } =
        formData
    const [playersError, setPlayersError] = useState('')
    const [loading, setLoading] = useState(false)

    function updateValue(name, value) {
        setFormData({ ...formData, [name]: { ...formData[name], value, state: 'default' } })
    }

    function updatePlayerPosition(from, to) {
        const newPlayers = [...players]
        const player = newPlayers[from]
        newPlayers.splice(from, 1)
        newPlayers.splice(to, 0, player)
        setPlayers(newPlayers)
    }

    async function saveSettings(e) {
        e.preventDefault()

        setPlayersError(players.length ? '' : 'At least one player must be streaming')
        if (allValid(formData, setFormData) && players.length) {
            setLoading(true)
            const data = {
                postId: post.id,
                gameId: gameData.id,
                movesPerPlayer: movesPerPlayer.value,
                moveDuration: moveDuration.value,
                introDuration: introDuration.value,
                intervalDuration: intervalDuration.value,
                outroDuration: outroDuration.value,
                playerOrder: players.map((p) => p.id).join(','),
            }
            await axios.post(`${config.apiURL}/save-glass-bead-game-settings`, data)
            setLoading(false)

            socket.emit('outgoing-start-game', {
                roomId,
                userSignaling: {
                    id: accountData.id,
                    handle: accountData.handle,
                    name: accountData.name || 'Anonymous',
                    flagImagePath: accountData.flagImagePath,
                },
                gameData: data,
                postId: post.id,
            })
            onClose()
        }
    }

    return (
        <Modal close={onClose} centerX>
            <h1>Game settings</h1>
            <form onSubmit={saveSettings}>
                <div className={styles.settingSections}>
                    <Column style={{ marginRight: 60, marginBottom: 20 }}>
                        <Input
                            title='Intro duration (seconds)'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading}
                            state={introDuration.state}
                            errors={introDuration.errors}
                            value={introDuration.value}
                            onChange={(v) => updateValue('introDuration', +v.replace(/\D/g, ''))}
                        />
                        <Input
                            title='Number of turns'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading}
                            state={movesPerPlayer.state}
                            errors={movesPerPlayer.errors}
                            value={movesPerPlayer.value}
                            onChange={(v) => updateValue('movesPerPlayer', +v.replace(/\D/g, ''))}
                        />
                        <Input
                            title='Move duration (seconds)'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading}
                            state={moveDuration.state}
                            errors={moveDuration.errors}
                            value={moveDuration.value}
                            onChange={(v) => updateValue('moveDuration', +v.replace(/\D/g, ''))}
                        />
                        <Input
                            title='Interval duration (seconds)'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading}
                            state={intervalDuration.state}
                            errors={intervalDuration.errors}
                            value={intervalDuration.value}
                            onChange={(v) => updateValue('intervalDuration', +v.replace(/\D/g, ''))}
                        />
                        <Input
                            title='Outro duration (seconds)'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading}
                            state={outroDuration.state}
                            errors={outroDuration.errors}
                            value={outroDuration.value}
                            onChange={(v) => updateValue('outroDuration', +v.replace(/\D/g, ''))}
                        />
                    </Column>
                    {players.length > 0 && (
                        <Column style={{ marginBottom: 20 }}>
                            <h2 style={{ margin: 0, lineHeight: '20px' }}>Player order</h2>
                            {players.map((player, i) => (
                                <Row style={{ marginTop: 10 }} key={player.socketId}>
                                    <div className={styles.position}>{i + 1}</div>
                                    <div className={styles.positionControls}>
                                        {i > 0 && (
                                            <button
                                                type='button'
                                                onClick={() => updatePlayerPosition(i, i - 1)}
                                            >
                                                <ChevronUpIcon />
                                            </button>
                                        )}
                                        {i < players.length - 1 && (
                                            <button
                                                type='button'
                                                onClick={() => updatePlayerPosition(i, i + 1)}
                                            >
                                                <ChevronDownIcon />
                                            </button>
                                        )}
                                    </div>
                                    <ImageTitle
                                        type='user'
                                        imagePath={player.flagImagePath}
                                        title={player.socketId === socketId ? 'You' : player.name}
                                        fontSize={16}
                                        imageSize={35}
                                    />
                                </Row>
                            ))}
                            {!!playersError.length && <p className={styles.red}>{playersError}</p>}
                        </Column>
                    )}
                </div>
                <Row>
                    <Button text='Save' color='game-white' disabled={loading} submit />
                    {loading && <LoadingWheel />}
                </Row>
            </form>
        </Modal>
    )
}
