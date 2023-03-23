/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import Toggle from '@components/Toggle'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/GBGSettingsModal.module.scss'
import { ChevronDownIcon, ChevronUpIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_green.css'
import React, { useContext, useEffect, useState } from 'react'

const GBGSettingsModal = (props: {
    settings: any
    saveSettings: (settings: any) => void
    close: () => void
}): JSX.Element => {
    const { settings, saveSettings, close } = props
    const { accountData } = useContext(AccountContext)
    const [synchronous, setSynchronous] = useState(settings.synchronous)
    const [multiplayer, setMultiplayer] = useState(settings.multiplayer)
    const [openToAllUsers, setOpenToAllUsers] = useState(settings.openToAllUsers)
    const [players, setPlayers] = useState(
        settings.players.length ? settings.players : [accountData]
    )
    const [playerOptions, setPlayerOptions] = useState<any[]>([])
    const [playersLoading, setPlayersLoading] = useState(false)
    const [playerColors, setPlayerColors] = useState(settings.playerColors)
    const [selectedPlayerId, setSelectedPlayerId] = useState(0)
    const { white, red, orange, yellow, green, blue, purple } = colors
    const beadColors = [white, red, orange, yellow, green, blue, purple]
    const [totalMoves, setTotalMoves] = useState(settings.totalMoves)
    const [moveDuration, setMoveDuration] = useState(settings.moveDuration)
    const [introDuration, setIntroDuration] = useState(settings.introDuration)
    const [intervalDuration, setIntervalDuration] = useState(settings.intervalDuration)
    const [outroDuration, setOutroDuration] = useState(settings.outroDuration)
    const [allowedBeadTypes, setAllowedBeadTypes] = useState(settings.allowedBeadTypes)
    const [characterLimit, setCharacterLimit] = useState(settings.characterLimit)
    const [audioTimeLimit, setAudioTimeLimit] = useState(settings.audioTimeLimit)
    const [timeWindow, setTimeWindow] = useState(settings.timeWindow)
    const [startTime, setStartTime] = useState(settings.startTime)
    const [endTime, setEndTime] = useState(settings.endTime)
    const [includeDates, setIncludeDates] = useState(false)

    const dateTimeOptions = {
        enableTime: true,
        clickOpens: true,
        disableMobile: true,
        minDate: new Date(),
        minuteIncrement: 1,
        altInput: true,
    }

    function findPlayers(query) {
        if (!query) setPlayerOptions([])
        else {
            setPlayersLoading(true)
            const data = { query, blacklist: players.map((p) => p.id) }
            axios
                .post(`${config.apiURL}/find-people`, data)
                .then((res) => {
                    setPlayerOptions(res.data)
                    setPlayersLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    function addPlayer(player) {
        setPlayerOptions([])
        // setSelectedUsersError(false)
        setPlayers((p) => [...p, player])
    }

    function removePlayer(playerId) {
        setPlayers((p) => [...p.filter((player) => player.id !== playerId)])
    }

    function updatePlayerPosition(from, to) {
        const newPlayers = [...players]
        const player = newPlayers[from]
        newPlayers.splice(from, 1)
        newPlayers.splice(to, 0, player)
        setPlayers(newPlayers)
    }

    function changePlayerColor(color) {
        const newPlayers = [...players]
        const selectedPlayer = newPlayers.find((p) => p.id === selectedPlayerId)
        if (selectedPlayer) selectedPlayer.color = color
        setPlayers(newPlayers)
        setSelectedPlayerId(0)
    }

    function removeEndDate() {
        const endTimeInstance = d3.select('#date-time-end').node()._flatpickr
        endTimeInstance.setDate(null)
        setEndTime('')
    }

    function save() {
        console.log('newSettings: ')
        // saveSettings(newSettings)
    }

    // initialise date picker
    useEffect(() => {
        const now = new Date()
        const startTimePast = new Date(startTime) < now
        const endTimePast = new Date(endTime) < now
        const defaultStartDate = startTime ? (startTimePast ? now : new Date(startTime)) : undefined
        const defaultEndDate = endTime ? (endTimePast ? now : new Date(endTime)) : undefined
        flatpickr('#date-time-start', {
            ...dateTimeOptions,
            defaultDate: defaultStartDate,
            appendTo: document.getElementById('date-time-start-wrapper') || undefined,
            onChange: ([value]) => setStartTime(value.toString()),
        })
        flatpickr('#date-time-end', {
            ...dateTimeOptions,
            defaultDate: defaultEndDate,
            minDate: defaultStartDate,
            appendTo: document.getElementById('date-time-end-wrapper') || undefined,
            onChange: ([value]) => setEndTime(value.toString()),
        })
        if (startTimePast && defaultStartDate) setStartTime(defaultStartDate.toString())
        if (endTimePast && defaultEndDate) setStartTime(defaultEndDate.toString())
    }, [])

    // update minimum end date when start date changed
    useEffect(() => {
        if (startTime) {
            const endTimeInstance = d3.select('#date-time-end').node()._flatpickr
            if (endTimeInstance) endTimeInstance.set('minDate', new Date(startTime))
        }
    }, [startTime])

    return (
        <Modal centered close={close} className={styles.wrapper}>
            <h1>Game Settings</h1>
            <Column centerX style={{ width: '100%', marginBottom: 20 }}>
                <Toggle
                    leftText='Synchronous'
                    positionLeft={!synchronous}
                    rightColor='blue'
                    onClick={() => setSynchronous(!synchronous)}
                    style={{ marginBottom: 10 }}
                    onOffText
                />
                <Toggle
                    leftText='Multiplayer'
                    positionLeft={!multiplayer}
                    rightColor='blue'
                    onClick={() => setMultiplayer(!multiplayer)}
                    style={{ marginBottom: 10 }}
                    onOffText
                />
                <Toggle
                    leftText='Open to all users'
                    positionLeft={!openToAllUsers}
                    rightColor='blue'
                    onClick={() => setOpenToAllUsers(!openToAllUsers)}
                    style={{ marginBottom: 10 }}
                    onOffText
                />
                <Toggle
                    leftText='Include dates'
                    positionLeft={!includeDates}
                    rightColor='blue'
                    onClick={() => setIncludeDates(!includeDates)}
                    style={{ marginBottom: 10 }}
                    onOffText
                />
                <Column centerX>
                    <SearchSelector
                        type='user'
                        placeholder='Search for users...'
                        onSearchQuery={(query) => findPlayers(query)}
                        onOptionSelected={(space) => addPlayer(space)}
                        options={playerOptions}
                        loading={playersLoading}
                        style={{ width: '100%', margin: '20px 0 30px 0' }}
                    />
                    {players.length > 0 && (
                        <Column style={{ marginBottom: 20 }}>
                            {players.map((player, index) => (
                                <Row key={player.id} centerY style={{ margin: '0 10px 10px 0' }}>
                                    <div className={styles.positionControls}>
                                        {index > 0 && (
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    updatePlayerPosition(index, index - 1)
                                                }
                                            >
                                                <ChevronUpIcon />
                                            </button>
                                        )}
                                        {index < players.length - 1 && (
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    updatePlayerPosition(index, index + 1)
                                                }
                                            >
                                                <ChevronDownIcon />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type='button'
                                        className={`${styles.position} ${
                                            playerColors && styles.clickable
                                        }`}
                                        style={{
                                            backgroundColor: playerColors ? player.color : 'white',
                                        }}
                                        onClick={() =>
                                            playerColors && setSelectedPlayerId(player.id)
                                        }
                                    >
                                        {index + 1}
                                    </button>
                                    <ImageTitle
                                        type='space'
                                        imagePath={player.flagImagePath}
                                        title={`${player.name} (${player.handle})`}
                                        imageSize={35}
                                        fontSize={16}
                                        style={{ marginRight: 5 }}
                                    />
                                    {player.id !== accountData.id && (
                                        <CloseButton
                                            size={17}
                                            onClick={() => removePlayer(player.id)}
                                        />
                                    )}
                                </Row>
                            ))}
                        </Column>
                    )}
                    {selectedPlayerId !== 0 && (
                        <Modal centered close={() => setSelectedPlayerId(0)}>
                            <h1>Choose the players color:</h1>
                            <Row centerY className={styles.colorButtons}>
                                {beadColors.map((color) => (
                                    <button
                                        key={color}
                                        type='button'
                                        aria-label='color'
                                        onClick={() => changePlayerColor(color)}
                                        style={{
                                            backgroundColor: color,
                                        }}
                                    />
                                ))}
                            </Row>
                        </Modal>
                    )}
                    {/* {selectedUsersError && <p className='danger'>Other users required</p>} */}
                </Column>
                <Row centerY className={styles.dateTimePicker} style={{ marginTop: 20 }}>
                    <div id='date-time-start-wrapper'>
                        <Input id='date-time-start' type='text' placeholder='Start time...' />
                    </div>
                    <p>→</p>
                    <div id='date-time-end-wrapper'>
                        <Input
                            id='date-time-end'
                            type='text'
                            placeholder='End time... (optional)'
                        />
                    </div>
                    {endTime && <CloseButton size={20} onClick={removeEndDate} />}
                </Row>
            </Column>
            <Button text='Save settings' color='blue' onClick={save} />
        </Modal>
    )
}

export default GBGSettingsModal
