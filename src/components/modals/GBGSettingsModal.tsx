/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
import Button from '@components/Button'
import CheckBox from '@components/CheckBox'
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
import { pluralise, trimNumber } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/GBGSettingsModal.module.scss'
import { ChevronDownIcon, ChevronUpIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/material_green.css'
import React, { useContext, useEffect, useState } from 'react'

function GBGSettingsModal(props: {
    settings: any
    saveSettings: (settings: any) => void
    close: () => void
}): JSX.Element {
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
    const [fixPlayerColors, setFixPlayerColors] = useState(settings.fixPlayerColors)
    const [selectedPlayerId, setSelectedPlayerId] = useState(0)
    const [totalMoves, setTotalMoves] = useState(settings.totalMoves)
    const [moveDuration, setMoveDuration] = useState(settings.moveDuration)
    const [introDurationOn, setIntroDurationOn] = useState(false)
    const [introDuration, setIntroDuration] = useState(settings.introDuration)
    const [intervalDurationOn, setIntervalDurationOn] = useState(false)
    const [intervalDuration, setIntervalDuration] = useState(settings.intervalDuration)
    const [outroDurationOn, setOutroDurationOn] = useState(false)
    const [outroDuration, setOutroDuration] = useState(settings.outroDuration)
    const [allowedBeadTypes, setAllowedBeadTypes] = useState(settings.allowedBeadTypes)
    const [characterLimitOn, setCharacterLimitOn] = useState(false)
    const [characterLimit, setCharacterLimit] = useState(settings.characterLimit)
    const [audioTimeLimitOn, setAudioTimeLimitOn] = useState(false)
    const [moveTimeWindowOn, setMoveTimeWindowOn] = useState(false)
    const [moveTimeWindow, setMoveTimeWindow] = useState(settings.moveTimeWindow)
    const [moveTimeWindowValues, setMoveTimeWindowValues] = useState<any>({})
    const [startTime, setStartTime] = useState(settings.startTime)
    const [endTime, setEndTime] = useState(settings.endTime)
    const [includeDates, setIncludeDates] = useState(false)

    const { white, red, orange, yellow, green, blue, purple } = colors
    const beadColors = [white, red, orange, yellow, green, blue, purple]
    const dateTimeOptions = {
        enableTime: true,
        clickOpens: true,
        disableMobile: true,
        minDate: new Date(),
        minuteIncrement: 1,
        altInput: true,
    }

    function updateAllowedBeadTypes(type, checked) {
        if (checked) setAllowedBeadTypes([...allowedBeadTypes, type])
        else setAllowedBeadTypes([...allowedBeadTypes.filter((t) => t !== type)])
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
        <Modal centered close={close} className={styles.wrapper} confirmClose>
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
                <Column centerX style={{ marginBottom: 10 }}>
                    <p>Allowed bead types:</p>
                    <Row wrap centerX className={styles.allowedBeadTypes}>
                        <CheckBox
                            text='Text'
                            checked={allowedBeadTypes.includes('Text')}
                            onChange={(c) => updateAllowedBeadTypes('Text', c)}
                        />
                        <CheckBox
                            text='Url'
                            checked={allowedBeadTypes.includes('Url')}
                            onChange={(checked) => updateAllowedBeadTypes('Url', checked)}
                        />
                        <CheckBox
                            text='Audio'
                            checked={allowedBeadTypes.includes('Audio')}
                            onChange={(checked) => updateAllowedBeadTypes('Audio', checked)}
                        />
                        <CheckBox
                            text='Image'
                            checked={allowedBeadTypes.includes('Image')}
                            onChange={(checked) => updateAllowedBeadTypes('Image', checked)}
                        />
                    </Row>
                </Column>
                <Row centerY style={{ marginBottom: 10 }}>
                    <p style={{ marginRight: 10 }}>Total moves</p>
                    <Input
                        type='number'
                        value={totalMoves}
                        onChange={(v) => setTotalMoves(+v)}
                        style={{ width: 70 }}
                    />
                </Row>
                <Row centerY style={{ marginBottom: 10 }}>
                    <p style={{ marginRight: 10 }}>Moves per player</p>
                    <Input
                        type='number'
                        value={totalMoves / players.length}
                        onChange={(v) => setTotalMoves(+v * players.length)}
                        style={{ width: 70 }}
                    />
                </Row>
                <Column centerX>
                    <p style={{ marginBottom: 10 }}>Move duration</p>
                    <Row wrap centerY centerX style={{ marginBottom: 10 }}>
                        <Button
                            text='1 min'
                            color={moveDuration === 60 ? 'blue' : 'grey'}
                            onClick={() => setMoveDuration(60)}
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            text='2 min'
                            color={moveDuration === 120 ? 'blue' : 'grey'}
                            onClick={() => setMoveDuration(120)}
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            text='3 min'
                            color={moveDuration === 180 ? 'blue' : 'grey'}
                            onClick={() => setMoveDuration(180)}
                            style={{ marginRight: 10 }}
                        />
                        <Row centerY>
                            <Input
                                type='text'
                                value={moveDuration}
                                onChange={(v) => setMoveDuration(+v)}
                                style={{ width: 70, marginRight: 10 }}
                            />
                            <p>seconds</p>
                        </Row>
                    </Row>
                </Column>
                <Column centerX>
                    <Toggle
                        leftText='Intro duration'
                        positionLeft={!introDurationOn}
                        rightColor='blue'
                        onClick={() => setIntroDurationOn(!introDurationOn)}
                        style={{ marginBottom: 10 }}
                        onOffText
                    />
                    {introDurationOn && (
                        <Row wrap centerY centerX style={{ marginBottom: 10 }}>
                            <Button
                                text='1 min'
                                color={introDuration === 60 ? 'blue' : 'grey'}
                                onClick={() => setIntroDuration(60)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='2 min'
                                color={introDuration === 120 ? 'blue' : 'grey'}
                                onClick={() => setIntroDuration(120)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='3 min'
                                color={introDuration === 180 ? 'blue' : 'grey'}
                                onClick={() => setIntroDuration(180)}
                                style={{ marginRight: 10 }}
                            />
                            <Row centerY>
                                <Input
                                    type='text'
                                    value={introDuration}
                                    onChange={(v) => setIntroDuration(+v)}
                                    style={{ width: 70, marginRight: 10 }}
                                />
                                <p>seconds</p>
                            </Row>
                        </Row>
                    )}
                </Column>
                <Column centerX>
                    <Toggle
                        leftText='Interval duration'
                        positionLeft={!intervalDurationOn}
                        rightColor='blue'
                        onClick={() => setIntervalDurationOn(!intervalDurationOn)}
                        style={{ marginBottom: 10 }}
                        onOffText
                    />
                    {intervalDurationOn && (
                        <Row wrap centerY centerX style={{ marginBottom: 10 }}>
                            <Button
                                text='1 min'
                                color={intervalDuration === 60 ? 'blue' : 'grey'}
                                onClick={() => setIntervalDuration(60)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='2 min'
                                color={intervalDuration === 120 ? 'blue' : 'grey'}
                                onClick={() => setIntervalDuration(120)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='3 min'
                                color={intervalDuration === 180 ? 'blue' : 'grey'}
                                onClick={() => setIntervalDuration(180)}
                                style={{ marginRight: 10 }}
                            />
                            <Row centerY>
                                <Input
                                    type='text'
                                    value={intervalDuration}
                                    onChange={(v) => setIntervalDuration(+v)}
                                    style={{ width: 70, marginRight: 10 }}
                                />
                                <p>seconds</p>
                            </Row>
                        </Row>
                    )}
                </Column>
                <Column centerX>
                    <Toggle
                        leftText='Outro duration'
                        positionLeft={!outroDurationOn}
                        rightColor='blue'
                        onClick={() => setOutroDurationOn(!outroDurationOn)}
                        style={{ marginBottom: 10 }}
                        onOffText
                    />
                    {outroDurationOn && (
                        <Row wrap centerY centerX style={{ marginBottom: 10 }}>
                            <Button
                                text='1 min'
                                color={outroDuration === 60 ? 'blue' : 'grey'}
                                onClick={() => setOutroDuration(60)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='2 min'
                                color={outroDuration === 120 ? 'blue' : 'grey'}
                                onClick={() => setOutroDuration(120)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='3 min'
                                color={outroDuration === 180 ? 'blue' : 'grey'}
                                onClick={() => setOutroDuration(180)}
                                style={{ marginRight: 10 }}
                            />
                            <Row centerY>
                                <Input
                                    type='text'
                                    value={outroDuration}
                                    onChange={(v) => setOutroDuration(+v)}
                                    style={{ width: 70, marginRight: 10 }}
                                />
                                <p>seconds</p>
                            </Row>
                        </Row>
                    )}
                </Column>
                <Column centerX>
                    <Toggle
                        leftText='Text character limit'
                        positionLeft={!characterLimitOn}
                        rightColor='blue'
                        onClick={() => setCharacterLimitOn(!characterLimitOn)}
                        style={{ marginBottom: 10 }}
                        onOffText
                    />
                    {characterLimitOn && (
                        <Row wrap centerY style={{ marginBottom: 10 }}>
                            <Button
                                text='140 chars'
                                color={characterLimit === 140 ? 'blue' : 'grey'}
                                onClick={() => setCharacterLimit(140)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='280 chars'
                                color={characterLimit === 280 ? 'blue' : 'grey'}
                                onClick={() => setCharacterLimit(280)}
                                style={{ marginRight: 10 }}
                            />
                            <Input
                                type='text'
                                value={characterLimit}
                                onChange={(v) => setCharacterLimit(+v)}
                                style={{ width: 70, marginRight: 10 }}
                            />
                        </Row>
                    )}
                </Column>
                <Column centerX>
                    <Toggle
                        leftText='Audio time limit'
                        positionLeft={!audioTimeLimitOn}
                        rightColor='blue'
                        onClick={() => setAudioTimeLimitOn(!audioTimeLimitOn)}
                        style={{ marginBottom: 10 }}
                        onOffText
                    />
                    {audioTimeLimitOn && (
                        <Row wrap centerY centerX style={{ marginBottom: 10 }}>
                            <Button
                                text='1 min'
                                color={moveDuration === 60 ? 'blue' : 'grey'}
                                onClick={() => setMoveDuration(60)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='2 min'
                                color={moveDuration === 120 ? 'blue' : 'grey'}
                                onClick={() => setMoveDuration(120)}
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                text='3 min'
                                color={moveDuration === 180 ? 'blue' : 'grey'}
                                onClick={() => setMoveDuration(180)}
                                style={{ marginRight: 10 }}
                            />
                            <Row centerY>
                                <Input
                                    type='text'
                                    value={moveDuration}
                                    onChange={(v) => setMoveDuration(+v)}
                                    style={{ width: 70, marginRight: 10 }}
                                />
                                <p>seconds</p>
                            </Row>
                        </Row>
                    )}
                </Column>
                <Column centerX>
                    <Toggle
                        leftText='Time window for moves'
                        rightColor='blue'
                        positionLeft={!moveTimeWindowOn}
                        onClick={() => setMoveTimeWindowOn(!moveTimeWindowOn)}
                        style={{ marginBottom: 10 }}
                        onOffText
                    />
                    {moveTimeWindowOn && (
                        <Column centerX style={{ marginBottom: 10 }}>
                            <Row wrap centerY centerX style={{ marginBottom: 10 }}>
                                <Row centerY style={{ marginRight: 20, marginBottom: 10 }}>
                                    <Input
                                        type='number'
                                        value={moveTimeWindowValues.days}
                                        onChange={(v) =>
                                            setMoveTimeWindowValues({
                                                ...moveTimeWindowValues,
                                                days: trimNumber(+v, 365),
                                            })
                                        }
                                        style={{ width: 60, marginRight: 10 }}
                                    />
                                    <p>day{pluralise(moveTimeWindowValues.days)}</p>
                                </Row>
                                <Row centerY style={{ marginRight: 20, marginBottom: 10 }}>
                                    <Input
                                        type='number'
                                        value={moveTimeWindowValues.hours}
                                        onChange={(v) =>
                                            setMoveTimeWindowValues({
                                                ...moveTimeWindowValues,
                                                hours: trimNumber(+v, 24),
                                            })
                                        }
                                        style={{ width: 60, marginRight: 10 }}
                                    />
                                    <p>hour{pluralise(moveTimeWindowValues.hours)}</p>
                                </Row>
                                <Row centerY style={{ marginRight: 20, marginBottom: 10 }}>
                                    <Input
                                        type='number'
                                        value={moveTimeWindowValues.minutes}
                                        onChange={(v) =>
                                            setMoveTimeWindowValues({
                                                ...moveTimeWindowValues,
                                                minutes: trimNumber(+v, 60),
                                            })
                                        }
                                        style={{ width: 60, marginRight: 10 }}
                                    />
                                    <p>minute{pluralise(moveTimeWindowValues.minutes)}</p>
                                </Row>
                            </Row>
                            {/* {moveTimeWindowError && (
                                <p className='danger'>
                                    The time window for moves must be between 20 mins and 1 year
                                </p>
                            )} */}
                        </Column>
                    )}
                </Column>
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
                                            fixPlayerColors && styles.clickable
                                        }`}
                                        style={{
                                            backgroundColor: fixPlayerColors
                                                ? player.color
                                                : 'white',
                                        }}
                                        onClick={() =>
                                            fixPlayerColors && setSelectedPlayerId(player.id)
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
                    <Toggle
                        leftText='Fix player colors'
                        positionLeft={!fixPlayerColors}
                        rightColor='blue'
                        onClick={() => setFixPlayerColors(!fixPlayerColors)}
                        style={{ marginBottom: 10 }}
                        onOffText
                    />
                    {/* {selectedUsersError && <p className='danger'>Other users required</p>} */}
                </Column>
                <Toggle
                    leftText='Include dates'
                    positionLeft={!includeDates}
                    rightColor='blue'
                    onClick={() => setIncludeDates(!includeDates)}
                    style={{ marginBottom: 10 }}
                    onOffText
                />
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
