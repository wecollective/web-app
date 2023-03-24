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
    setSettings: (settings: any) => void
    close: () => void
}): JSX.Element {
    const { settings, setSettings, close } = props
    const { accountData } = useContext(AccountContext)
    const [players, setPlayers] = useState(
        settings.players.length ? settings.players : [accountData]
    )
    const [playerOptions, setPlayerOptions] = useState<any[]>([])
    const [playersLoading, setPlayersLoading] = useState(false)
    const [selectedPlayerId, setSelectedPlayerId] = useState(0)
    const [introOn, setIntroOn] = useState(false)
    const [intervalsOn, setIntervalsOn] = useState(false)
    const [outroOn, setOutroOn] = useState(false)
    const [characterLimitOn, setCharacterLimitOn] = useState(false)
    const [audioTimeLimitOn, setAudioTimeLimitOn] = useState(false)
    const [moveTimeWindowOn, setMoveTimeWindowOn] = useState(false)
    const [moveTimeWindowValues, setMoveTimeWindowValues] = useState<any>({})
    const [includeDates, setIncludeDates] = useState(false)
    const [newSettings, setNewSettings] = useState(settings)
    const {
        synchronous,
        multiplayer,
        openToAllUsers,
        fixPlayerColors,
        totalMoves,
        moveDuration,
        introDuration,
        intervalDuration,
        outroDuration,
        allowedBeadTypes,
        characterLimit,
        moveTimeWindow,
        startTime,
        endTime,
    } = newSettings

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

    function updateSetting(type, value) {
        setNewSettings({ ...newSettings, [type]: value })
    }

    function updateAllowedBeadTypes(type, checked) {
        if (checked) updateSetting('allowedBeadTypes', [...allowedBeadTypes, type])
        else updateSetting('allowedBeadTypes', [...allowedBeadTypes.filter((t) => t !== type)])
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
        if (endTimeInstance) endTimeInstance.setDate(null)
        updateSetting('endTime', '')
    }

    function save() {
        console.log('newSettings: ', newSettings)
        setSettings(newSettings)
        close()
    }

    // initialise date picker
    useEffect(() => {
        if (includeDates) {
            const now = new Date()
            const startTimePast = new Date(startTime) < now
            const endTimePast = new Date(endTime) < now
            const defaultStartDate = startTime
                ? startTimePast
                    ? now
                    : new Date(startTime)
                : undefined
            const defaultEndDate = endTime ? (endTimePast ? now : new Date(endTime)) : undefined
            flatpickr('#date-time-start', {
                ...dateTimeOptions,
                defaultDate: defaultStartDate,
                appendTo: document.getElementById('date-time-start-wrapper') || undefined,
                onChange: ([value]) => updateSetting('startTime', value.toString()),
            })
            flatpickr('#date-time-end', {
                ...dateTimeOptions,
                defaultDate: defaultEndDate,
                minDate: defaultStartDate,
                appendTo: document.getElementById('date-time-end-wrapper') || undefined,
                onChange: ([value]) => updateSetting('endTime', value.toString()),
            })
            if (startTimePast && defaultStartDate)
                updateSetting('startTime', defaultStartDate.toString())
            if (endTimePast && defaultEndDate) updateSetting('startTime', defaultEndDate.toString())
        }
    }, [includeDates])

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
                    onClick={() => updateSetting('synchronous', !synchronous)}
                    style={{ marginBottom: 30 }}
                    onOffText
                />
                {synchronous ? (
                    <Column centerX>
                        <Column centerX className={styles.rowWrapper}>
                            <Toggle
                                leftText='Schedule as event'
                                positionLeft={!includeDates}
                                rightColor='blue'
                                onClick={() => setIncludeDates(!includeDates)}
                                onOffText
                            />
                            <Row
                                centerY
                                className={`${styles.dateTimePicker} ${styles.row} ${
                                    includeDates && styles.visible
                                }`}
                            >
                                <div id='date-time-start-wrapper'>
                                    <Input
                                        id='date-time-start'
                                        type='text'
                                        placeholder='Start time...'
                                    />
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
                        <Row centerY style={{ marginBottom: 30 }}>
                            <p style={{ marginRight: 10 }}>Moves per player</p>
                            <Input
                                type='number'
                                value={totalMoves / players.length}
                                onChange={(v) => updateSetting('totalMoves', +v * players.length)}
                                style={{ width: 70 }}
                            />
                        </Row>
                        <Column centerX className={styles.rowWrapper}>
                            <p style={{ marginBottom: 10 }}>Move duration</p>
                            <Row centerY>
                                <Button
                                    text='1 min'
                                    color={moveDuration === 60 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('moveDuration', 60)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='2 min'
                                    color={moveDuration === 120 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('moveDuration', 120)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='3 min'
                                    color={moveDuration === 180 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('moveDuration', 180)}
                                    style={{ marginRight: 10 }}
                                />
                                <Row centerY>
                                    <Input
                                        type='number'
                                        value={moveDuration}
                                        onChange={(v) => updateSetting('moveDuration', +v)}
                                        style={{ width: 70, marginRight: 10 }}
                                    />
                                    <p>seconds</p>
                                </Row>
                            </Row>
                        </Column>
                        <Column centerX className={styles.rowWrapper}>
                            <Toggle
                                leftText='Intro'
                                positionLeft={!introOn}
                                rightColor='blue'
                                onClick={() => setIntroOn(!introOn)}
                                onOffText
                            />
                            <Row centerY className={`${styles.row} ${introOn && styles.visible}`}>
                                <Button
                                    text='1 min'
                                    color={introDuration === 60 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('introDuration', 60)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='2 min'
                                    color={introDuration === 120 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('introDuration', 120)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='3 min'
                                    color={introDuration === 180 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('introDuration', 180)}
                                    style={{ marginRight: 10 }}
                                />
                                <Row centerY>
                                    <Input
                                        type='number'
                                        value={introDuration}
                                        onChange={(v) => updateSetting('introDuration', +v)}
                                        style={{ width: 70, marginRight: 10 }}
                                    />
                                    <p>seconds</p>
                                </Row>
                            </Row>
                        </Column>
                        <Column centerX className={styles.rowWrapper}>
                            <Toggle
                                leftText='Outro'
                                positionLeft={!outroOn}
                                rightColor='blue'
                                onClick={() => setOutroOn(!outroOn)}
                                onOffText
                            />
                            <Row centerY className={`${styles.row} ${outroOn && styles.visible}`}>
                                <Button
                                    text='1 min'
                                    color={outroDuration === 60 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('outroDuration', 60)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='2 min'
                                    color={outroDuration === 120 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('outroDuration', 120)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='3 min'
                                    color={outroDuration === 180 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('outroDuration', 180)}
                                    style={{ marginRight: 10 }}
                                />
                                <Row centerY>
                                    <Input
                                        type='number'
                                        value={outroDuration}
                                        onChange={(v) => updateSetting('outroDuration', +v)}
                                        style={{ width: 70, marginRight: 10 }}
                                    />
                                    <p>seconds</p>
                                </Row>
                            </Row>
                        </Column>
                        <Column centerX className={styles.rowWrapper}>
                            <Toggle
                                leftText='Intervals'
                                positionLeft={!intervalsOn}
                                rightColor='blue'
                                onClick={() => setIntervalsOn(!intervalsOn)}
                                onOffText
                            />
                            <Row
                                centerY
                                className={`${styles.row} ${intervalsOn && styles.visible}`}
                            >
                                <Button
                                    text='1 min'
                                    color={intervalDuration === 60 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('intervalDuration', 60)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='2 min'
                                    color={intervalDuration === 120 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('intervalDuration', 120)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='3 min'
                                    color={intervalDuration === 180 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('intervalDuration', 180)}
                                    style={{ marginRight: 10 }}
                                />
                                <Row centerY>
                                    <Input
                                        type='number'
                                        value={intervalDuration}
                                        onChange={(v) => updateSetting('intervalDuration', +v)}
                                        style={{ width: 70, marginRight: 10 }}
                                    />
                                    <p>seconds</p>
                                </Row>
                            </Row>
                        </Column>
                    </Column>
                ) : (
                    <Column centerX>
                        <Row className={`${styles.multiplayer} ${multiplayer && styles.expanded}`}>
                            <Toggle
                                leftText='Multiplayer'
                                positionLeft={!multiplayer}
                                rightColor='blue'
                                onClick={() => updateSetting('multiplayer', !multiplayer)}
                                onOffText
                            />
                            {multiplayer && (
                                <Toggle
                                    leftText='Open to all users'
                                    positionLeft={!openToAllUsers}
                                    rightColor='blue'
                                    onClick={() => updateSetting('openToAllUsers', !openToAllUsers)}
                                    style={{ marginLeft: 30 }}
                                    onOffText
                                />
                            )}
                        </Row>
                        <Row>
                            <Column centerX style={{ width: 500 }}>
                                {multiplayer && !openToAllUsers ? (
                                    <Column centerX>
                                        <Row centerY style={{ marginBottom: 30 }}>
                                            <p style={{ marginRight: 10 }}>Moves per player</p>
                                            <Input
                                                type='number'
                                                value={totalMoves / players.length}
                                                onChange={(v) =>
                                                    updateSetting('totalMoves', +v * players.length)
                                                }
                                                style={{ width: 70 }}
                                            />
                                        </Row>
                                        <Column centerX className={styles.rowWrapper}>
                                            <Toggle
                                                leftText='Time window for moves'
                                                rightColor='blue'
                                                positionLeft={!moveTimeWindowOn}
                                                onClick={() =>
                                                    setMoveTimeWindowOn(!moveTimeWindowOn)
                                                }
                                                onOffText
                                            />
                                            <Row
                                                centerY
                                                className={`${styles.row} ${
                                                    moveTimeWindowOn && styles.visible
                                                }`}
                                            >
                                                <Row centerY style={{ marginRight: 20 }}>
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
                                                    <p>
                                                        day
                                                        {pluralise(moveTimeWindowValues.days)}
                                                    </p>
                                                </Row>
                                                <Row centerY style={{ marginRight: 20 }}>
                                                    <Input
                                                        type='number'
                                                        value={moveTimeWindowValues.hours}
                                                        onChange={(v) =>
                                                            setMoveTimeWindowValues({
                                                                ...moveTimeWindowValues,
                                                                hours: trimNumber(+v, 24),
                                                            })
                                                        }
                                                        style={{
                                                            width: 60,
                                                            marginRight: 10,
                                                        }}
                                                    />
                                                    <p>
                                                        hour
                                                        {pluralise(moveTimeWindowValues.hours)}
                                                    </p>
                                                </Row>
                                                <Row centerY style={{ marginRight: 20 }}>
                                                    <Input
                                                        type='number'
                                                        value={moveTimeWindowValues.minutes}
                                                        onChange={(v) =>
                                                            setMoveTimeWindowValues({
                                                                ...moveTimeWindowValues,
                                                                minutes: trimNumber(+v, 60),
                                                            })
                                                        }
                                                        style={{
                                                            width: 60,
                                                            marginRight: 10,
                                                        }}
                                                    />
                                                    <p>
                                                        minute
                                                        {pluralise(moveTimeWindowValues.minutes)}
                                                    </p>
                                                </Row>
                                            </Row>
                                        </Column>
                                    </Column>
                                ) : (
                                    <Row centerY style={{ marginBottom: 30 }}>
                                        <p style={{ marginRight: 10 }}>Total moves</p>
                                        <Input
                                            type='number'
                                            value={totalMoves}
                                            onChange={(v) => updateSetting('totalMoves', +v)}
                                            style={{ width: 70 }}
                                        />
                                    </Row>
                                )}
                                <Column centerX style={{ marginBottom: 30 }}>
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
                                            onChange={(checked) =>
                                                updateAllowedBeadTypes('Url', checked)
                                            }
                                        />
                                        <CheckBox
                                            text='Audio'
                                            checked={allowedBeadTypes.includes('Audio')}
                                            onChange={(checked) =>
                                                updateAllowedBeadTypes('Audio', checked)
                                            }
                                        />
                                        <CheckBox
                                            text='Image'
                                            checked={allowedBeadTypes.includes('Image')}
                                            onChange={(checked) =>
                                                updateAllowedBeadTypes('Image', checked)
                                            }
                                        />
                                    </Row>
                                </Column>
                                {allowedBeadTypes.includes('Text') && (
                                    <Column centerX className={styles.rowWrapper}>
                                        <Toggle
                                            leftText='Text character limit'
                                            positionLeft={!characterLimitOn}
                                            rightColor='blue'
                                            onClick={() => setCharacterLimitOn(!characterLimitOn)}
                                            onOffText
                                        />
                                        <Row
                                            centerY
                                            className={`${styles.row} ${
                                                characterLimitOn && styles.visible
                                            }`}
                                        >
                                            <Button
                                                text='140 chars'
                                                color={characterLimit === 140 ? 'blue' : 'grey'}
                                                onClick={() => updateSetting('characterLimit', 140)}
                                                style={{ marginRight: 10 }}
                                            />
                                            <Button
                                                text='280 chars'
                                                color={characterLimit === 280 ? 'blue' : 'grey'}
                                                onClick={() => updateSetting('characterLimit', 280)}
                                                style={{ marginRight: 10 }}
                                            />
                                            <Input
                                                type='text'
                                                value={characterLimit}
                                                onChange={(v) =>
                                                    updateSetting('characterLimit', +v)
                                                }
                                                style={{ width: 70, marginRight: 10 }}
                                            />
                                        </Row>
                                    </Column>
                                )}
                                {allowedBeadTypes.includes('Audio') && (
                                    <Column centerX className={styles.rowWrapper}>
                                        <Toggle
                                            leftText='Audio time limit'
                                            positionLeft={!audioTimeLimitOn}
                                            rightColor='blue'
                                            onClick={() => setAudioTimeLimitOn(!audioTimeLimitOn)}
                                            onOffText
                                        />
                                        <Row
                                            centerY
                                            className={`${styles.row} ${
                                                audioTimeLimitOn && styles.visible
                                            }`}
                                        >
                                            <Button
                                                text='1 min'
                                                color={moveDuration === 60 ? 'blue' : 'grey'}
                                                onClick={() => updateSetting('moveDuration', 60)}
                                                style={{ marginRight: 10 }}
                                            />
                                            <Button
                                                text='2 min'
                                                color={moveDuration === 120 ? 'blue' : 'grey'}
                                                onClick={() => updateSetting('moveDuration', 120)}
                                                style={{ marginRight: 10 }}
                                            />
                                            <Button
                                                text='3 min'
                                                color={moveDuration === 180 ? 'blue' : 'grey'}
                                                onClick={() => updateSetting('moveDuration', 180)}
                                                style={{ marginRight: 10 }}
                                            />
                                            <Row centerY>
                                                <Input
                                                    type='text'
                                                    value={moveDuration}
                                                    onChange={(v) =>
                                                        updateSetting('moveDuration', +v)
                                                    }
                                                    style={{ width: 70, marginRight: 10 }}
                                                />
                                                <p>seconds</p>
                                            </Row>
                                        </Row>
                                    </Column>
                                )}
                            </Column>
                            {multiplayer && !openToAllUsers && (
                                <Column style={{ width: 300 }}>
                                    <SearchSelector
                                        type='user'
                                        placeholder='Search for users...'
                                        onSearchQuery={(query) => findPlayers(query)}
                                        onOptionSelected={(space) => addPlayer(space)}
                                        options={playerOptions}
                                        loading={playersLoading}
                                        style={{ width: '100%', marginBottom: 30 }}
                                    />
                                    {players.length > 0 && (
                                        <Column style={{ marginBottom: 20 }}>
                                            {players.map((player, index) => (
                                                <Row
                                                    key={player.id}
                                                    centerY
                                                    style={{ margin: '0 10px 10px 0' }}
                                                >
                                                    <div className={styles.positionControls}>
                                                        {index > 0 && (
                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    updatePlayerPosition(
                                                                        index,
                                                                        index - 1
                                                                    )
                                                                }
                                                            >
                                                                <ChevronUpIcon />
                                                            </button>
                                                        )}
                                                        {index < players.length - 1 && (
                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    updatePlayerPosition(
                                                                        index,
                                                                        index + 1
                                                                    )
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
                                                            fixPlayerColors &&
                                                            setSelectedPlayerId(player.id)
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
                                        onClick={() =>
                                            updateSetting('fixPlayerColors', !fixPlayerColors)
                                        }
                                        style={{ marginBottom: 10 }}
                                        onOffText
                                    />
                                    {/* {selectedUsersError && <p className='danger'>Other users required</p>} */}
                                </Column>
                            )}
                        </Row>
                    </Column>
                )}
            </Column>
            <Button text='Save settings' color='blue' onClick={save} />
        </Modal>
    )
}

export default GBGSettingsModal

// const [synchronous, setSynchronous] = useState(settings.synchronous)
// const [multiplayer, setMultiplayer] = useState(settings.multiplayer)
// const [openToAllUsers, setOpenToAllUsers] = useState(settings.openToAllUsers)
// const [fixPlayerColors, setFixPlayerColors] = useState(settings.fixPlayerColors)
// const [totalMoves, setTotalMoves] = useState(settings.totalMoves)
// const [moveDuration, setMoveDuration] = useState(settings.moveDuration)
// const [introDuration, setIntroDuration] = useState(settings.introDuration)
// const [intervalDuration, setIntervalDuration] = useState(settings.intervalDuration)
// const [outroDuration, setOutroDuration] = useState(settings.outroDuration)
// const [allowedBeadTypes, setAllowedBeadTypes] = useState(settings.allowedBeadTypes)
// const [characterLimit, setCharacterLimit] = useState(settings.characterLimit)
// const [moveTimeWindow, setMoveTimeWindow] = useState(settings.moveTimeWindow)
// const [startTime, setStartTime] = useState(settings.startTime)
// const [endTime, setEndTime] = useState(settings.endTime)
