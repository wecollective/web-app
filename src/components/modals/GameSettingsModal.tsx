/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
import Button from '@components/Button'
import CheckBox from '@components/CheckBox'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import Toggle from '@components/Toggle'
import GameHelpModal from '@components/modals/GameHelpModal'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { capitalise, findDHMFromMinutes, findMinutesFromDHM, pluralise } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/GameSettingsModal.module.scss'
import { ChevronDownIcon, ChevronUpIcon, HelpIcon, SearchIcon } from '@svgs/all'
import axios from 'axios'
import 'flatpickr/dist/themes/material_green.css'
import React, { useContext, useState } from 'react'

function GameSettingsModal(props: {
    settings: any
    setSettings: (settings: any) => void
    close: () => void
}): JSX.Element {
    const { settings, setSettings, close } = props

    const { accountData } = useContext(AccountContext)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const [openToAllUsers, setOpenToAllUsers] = useState(!settings.players.length)
    const [players, setPlayers] = useState(
        settings.players.length ? settings.players : [accountData]
    )
    const [playerOptions, setPlayerOptions] = useState<any[]>([])
    const [playersLoading, setPlayersLoading] = useState(false)
    const [selectedPlayerId, setSelectedPlayerId] = useState(0)
    const [introOn, setIntroOn] = useState(!!settings.introDuration)
    const [intervalsOn, setIntervalsOn] = useState(!!settings.intervalDuration)
    const [outroOn, setOutroOn] = useState(!!settings.outroDuration)
    const [limitMovesOn, setLimitMovesOn] = useState(
        !settings.synchronous && (!!settings.totalMoves || !!settings.movesPerPlayer)
    )
    const [characterLimitOn, setCharacterLimitOn] = useState(!!settings.characterLimit)
    const [audioTimeLimitOn, setAudioTimeLimitOn] = useState(
        !settings.synchronous && !!settings.moveDuration
    )
    const [moveTimeWindowOn, setMoveTimeWindowOn] = useState(!!settings.moveTimeWindow)
    const [moveTimeWindowValues, setMoveTimeWindowValues] = useState<any>(
        settings.moveTimeWindow
            ? findDHMFromMinutes(settings.moveTimeWindow)
            : { days: 1, hours: 0, minutes: 0 }
    )
    const [timeWindowError, setTimeWindowError] = useState(false)
    const [beadTypeError, setBeadTypeError] = useState(false)
    const [constraintsCollapsed, setConstraintsCollapsed] = useState(false)
    const [playersCollapsed, setPlayersCollapsed] = useState(false)
    const [playersError, setPlayersError] = useState(false)
    const [newSettings, setNewSettings] = useState(settings)
    const {
        synchronous,
        multiplayer,
        fixPlayerColors,
        totalMoves,
        movesPerPlayer,
        moveDuration,
        introDuration,
        intervalDuration,
        outroDuration,
        allowedBeadTypes,
        characterLimit,
    } = newSettings

    const allBeadTypes = ['text', 'url', 'audio', 'image']
    const { white, red, orange, yellow, green, blue, purple } = colors
    const beadColors = [white, red, orange, yellow, green, blue, purple]

    function updateSetting(type, value) {
        setNewSettings({ ...newSettings, [type]: value })
    }

    function switchSynchronous() {
        if (synchronous) {
            // switch off syncronous settings
            setNewSettings({
                ...newSettings,
                synchronous: false,
                moveDuration: 0,
                totalMoves: 0,
                movesPerPlayer: 0,
                introDuration: 0,
                outroDuration: 0,
                intervalDuration: 0,
                allowedBeadTypes: allBeadTypes,
            })
            setIntroOn(false)
            setOutroOn(false)
            setIntervalsOn(false)
            setPlayers([accountData])
        } else {
            // switch off asyncronous settings
            setNewSettings({
                ...newSettings,
                synchronous: true,
                multiplayer: false,
                totalMoves: 0,
                movesPerPlayer: 5,
                moveDuration: 60,
                moveTimeWindow: 0,
                characterLimit: 0,
                allowedBeadTypes: ['audio'],
            })
            setOpenToAllUsers(true)
            setLimitMovesOn(false)
            setAudioTimeLimitOn(false)
            setCharacterLimitOn(false)
            setPlayers([])
        }
    }

    function updateBeadTypes(type, checked) {
        setBeadTypeError(false)
        let newTypes = [] as any
        if (checked) {
            // maintain order when adding types
            allBeadTypes.forEach((t) => {
                if (allowedBeadTypes.includes(t) || t === type) newTypes.push(t)
            })
        } else {
            newTypes = [...allowedBeadTypes.filter((t) => t !== type)]
        }
        setNewSettings({
            ...newSettings,
            allowedBeadTypes: newTypes,
            characterLimit: newTypes.includes('text') ? characterLimit : 0,
            moveDuration: newTypes.includes('audio') ? moveDuration : 0,
        })
        if (!newTypes.includes('text')) setCharacterLimitOn(false)
        if (!newTypes.includes('audio')) setAudioTimeLimitOn(false)
    }

    function updateWindow(item, value) {
        setTimeWindowError(false)
        setMoveTimeWindowValues({
            ...moveTimeWindowValues,
            [item]: value,
        })
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
        setPlayersError(false)
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

    function save() {
        // validate settings
        let valid = true
        const validatedSettings = { ...newSettings }
        // allowed bead types
        if (!allowedBeadTypes.length) {
            setBeadTypeError(true)
            valid = false
        }
        // move time window
        if (moveTimeWindowOn) {
            const totalMinutes = findMinutesFromDHM(moveTimeWindowValues)
            if (totalMinutes < 20) {
                setTimeWindowError(true)
                valid = false
            } else validatedSettings.moveTimeWindow = totalMinutes
        } else validatedSettings.moveTimeWindow = 0
        // players
        if (multiplayer && !openToAllUsers) {
            if (players.length < 2 || players.length > 6) {
                setPlayersError(true)
                valid = false
            } else validatedSettings.players = players
        } else validatedSettings.players = []
        // open collapsed sections if invalid
        if (!valid) {
            setConstraintsCollapsed(false)
            setPlayersCollapsed(false)
        }
        // save settings and close modal if valid
        setSettings(validatedSettings)
        if (valid) close()
    }

    return (
        <Modal centerX close={close} className={styles.wrapper} confirmClose>
            <Row centerY style={{ marginBottom: 20 }}>
                <h1 style={{ margin: 0 }}>Game Settings</h1>
                <button
                    type='button'
                    className={styles.helpButton}
                    onClick={() => setHelpModalOpen(true)}
                >
                    <HelpIcon />
                </button>
            </Row>
            <Column centerX style={{ width: '100%', marginBottom: 20 }}>
                <Toggle
                    leftText='Synchronous'
                    positionLeft={!synchronous}
                    rightColor='blue'
                    onClick={switchSynchronous}
                    style={{ marginBottom: 30 }}
                    onOffText
                />
                {synchronous ? (
                    <Column centerX>
                        <Row centerX className={styles.sectionHeader}>
                            <p>Constraints</p>
                        </Row>
                        <Row centerY style={{ marginBottom: 30 }}>
                            <p style={{ marginRight: 10 }}>Moves per player</p>
                            <Input
                                type='number'
                                value={movesPerPlayer}
                                min={1}
                                max={20}
                                onChange={(v) => updateSetting('movesPerPlayer', v)}
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
                                        min={10}
                                        max={600}
                                        onChange={(v) => updateSetting('moveDuration', v)}
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
                                onClick={() => {
                                    setIntroOn(!introOn)
                                    updateSetting('introDuration', introOn ? 0 : 60)
                                }}
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
                                        min={10}
                                        max={300}
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
                                onClick={() => {
                                    setOutroOn(!outroOn)
                                    updateSetting('outroDuration', outroOn ? 0 : 60)
                                }}
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
                                        min={10}
                                        max={300}
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
                                onClick={() => {
                                    setIntervalsOn(!intervalsOn)
                                    updateSetting('intervalDuration', intervalsOn ? 0 : 15)
                                }}
                                onOffText
                            />
                            <Row
                                centerY
                                className={`${styles.row} ${intervalsOn && styles.visible}`}
                            >
                                <Button
                                    text='15 sec'
                                    color={intervalDuration === 15 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('intervalDuration', 15)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='30 sec'
                                    color={intervalDuration === 30 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('intervalDuration', 30)}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='1 min'
                                    color={intervalDuration === 60 ? 'blue' : 'grey'}
                                    onClick={() => updateSetting('intervalDuration', 60)}
                                    style={{ marginRight: 10 }}
                                />
                                <Row centerY>
                                    <Input
                                        type='number'
                                        value={intervalDuration}
                                        min={10}
                                        max={60}
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
                                    onClick={() => {
                                        setOpenToAllUsers(!openToAllUsers)
                                        setLimitMovesOn(false)
                                        setNewSettings({
                                            ...newSettings,
                                            movesPerPlayer: 0,
                                            totalMoves: 0,
                                        })
                                    }}
                                    style={{ marginLeft: 30 }}
                                    onOffText
                                />
                            )}
                        </Row>
                        <div className={styles.sections}>
                            <Column centerX className={styles.section}>
                                <Row centerX className={styles.sectionHeader}>
                                    <p>Constraints</p>
                                    {!openToAllUsers && (
                                        <button
                                            type='button'
                                            onClick={() =>
                                                setConstraintsCollapsed(!constraintsCollapsed)
                                            }
                                        >
                                            {constraintsCollapsed ? (
                                                <ChevronDownIcon />
                                            ) : (
                                                <ChevronUpIcon />
                                            )}
                                        </button>
                                    )}
                                </Row>
                                {!constraintsCollapsed && (
                                    <Column centerX>
                                        {multiplayer && !openToAllUsers ? (
                                            <Column centerX>
                                                <Column centerX className={styles.rowWrapper}>
                                                    <Toggle
                                                        leftText='Limit moves'
                                                        rightColor='blue'
                                                        positionLeft={!limitMovesOn}
                                                        onClick={() => {
                                                            setLimitMovesOn(!limitMovesOn)
                                                            updateSetting(
                                                                'movesPerPlayer',
                                                                limitMovesOn ? 0 : 5
                                                            )
                                                        }}
                                                        onOffText
                                                    />
                                                    <Row
                                                        centerY
                                                        className={`${styles.row} ${
                                                            limitMovesOn && styles.visible
                                                        }`}
                                                    >
                                                        <p style={{ marginRight: 10 }}>
                                                            Moves per player
                                                        </p>
                                                        <Input
                                                            type='number'
                                                            value={movesPerPlayer}
                                                            min={1}
                                                            max={20}
                                                            onChange={(v) =>
                                                                updateSetting('movesPerPlayer', v)
                                                            }
                                                            style={{ width: 60 }}
                                                        />
                                                    </Row>
                                                </Column>
                                                <Column centerX className={styles.rowWrapper}>
                                                    <Toggle
                                                        leftText='Time window for moves'
                                                        rightColor='blue'
                                                        positionLeft={!moveTimeWindowOn}
                                                        onClick={() => {
                                                            setMoveTimeWindowOn(!moveTimeWindowOn)
                                                            setTimeWindowError(false)
                                                        }}
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
                                                                min={0}
                                                                max={30}
                                                                onChange={(v) =>
                                                                    updateWindow('days', v)
                                                                }
                                                                style={{
                                                                    width: 60,
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                            <p>
                                                                day
                                                                {pluralise(
                                                                    moveTimeWindowValues.days
                                                                )}
                                                            </p>
                                                        </Row>
                                                        <Row centerY style={{ marginRight: 20 }}>
                                                            <Input
                                                                type='number'
                                                                value={moveTimeWindowValues.hours}
                                                                min={0}
                                                                max={23}
                                                                onChange={(v) =>
                                                                    updateWindow('hours', v)
                                                                }
                                                                style={{
                                                                    width: 60,
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                            <p>
                                                                hour
                                                                {pluralise(
                                                                    moveTimeWindowValues.hours
                                                                )}
                                                            </p>
                                                        </Row>
                                                        <Row centerY style={{ marginRight: 20 }}>
                                                            <Input
                                                                type='number'
                                                                value={moveTimeWindowValues.minutes}
                                                                min={0}
                                                                max={59}
                                                                onChange={(v) =>
                                                                    updateWindow('minutes', v)
                                                                }
                                                                style={{
                                                                    width: 60,
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                            <p>
                                                                min
                                                                {pluralise(
                                                                    moveTimeWindowValues.minutes
                                                                )}
                                                            </p>
                                                        </Row>
                                                    </Row>
                                                    {timeWindowError && (
                                                        <p className={styles.error}>
                                                            At least 20 mins required for time
                                                            window
                                                        </p>
                                                    )}
                                                </Column>
                                            </Column>
                                        ) : (
                                            <Column centerX className={styles.rowWrapper}>
                                                <Toggle
                                                    leftText='Limit moves'
                                                    rightColor='blue'
                                                    positionLeft={!limitMovesOn}
                                                    onClick={() => {
                                                        setLimitMovesOn(!limitMovesOn)
                                                        updateSetting(
                                                            'totalMoves',
                                                            limitMovesOn ? 0 : 5
                                                        )
                                                    }}
                                                    onOffText
                                                />
                                                <Row
                                                    centerY
                                                    className={`${styles.row} ${
                                                        limitMovesOn && styles.visible
                                                    }`}
                                                >
                                                    <p style={{ marginRight: 10 }}>Total moves</p>
                                                    <Input
                                                        type='number'
                                                        value={totalMoves}
                                                        min={1}
                                                        max={50}
                                                        onChange={(v) =>
                                                            updateSetting('totalMoves', +v)
                                                        }
                                                        style={{ width: 70 }}
                                                    />
                                                </Row>
                                            </Column>
                                        )}
                                        <Column centerX style={{ marginBottom: 30 }}>
                                            <p>Allowed bead types:</p>
                                            <Row wrap centerX className={styles.allowedBeadTypes}>
                                                {allBeadTypes.map((type) => (
                                                    <CheckBox
                                                        key={type}
                                                        text={capitalise(type)}
                                                        checked={allowedBeadTypes.includes(type)}
                                                        onChange={(c) => updateBeadTypes(type, c)}
                                                    />
                                                ))}
                                            </Row>
                                            {beadTypeError && (
                                                <p className={styles.error}>
                                                    At least one bead type required
                                                </p>
                                            )}
                                        </Column>
                                        {allowedBeadTypes.includes('text') && (
                                            <Column centerX className={styles.rowWrapper}>
                                                <Toggle
                                                    leftText='Text character limit'
                                                    positionLeft={!characterLimitOn}
                                                    rightColor='blue'
                                                    onClick={() => {
                                                        setCharacterLimitOn(!characterLimitOn)
                                                        updateSetting(
                                                            'characterLimit',
                                                            characterLimitOn ? 0 : 140
                                                        )
                                                    }}
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
                                                        color={
                                                            characterLimit === 140 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() =>
                                                            updateSetting('characterLimit', 140)
                                                        }
                                                        style={{ marginRight: 10 }}
                                                    />
                                                    <Button
                                                        text='280 chars'
                                                        color={
                                                            characterLimit === 280 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() =>
                                                            updateSetting('characterLimit', 280)
                                                        }
                                                        style={{ marginRight: 10 }}
                                                    />
                                                    <Input
                                                        type='number'
                                                        value={characterLimit}
                                                        min={10}
                                                        max={1000}
                                                        onChange={(v) =>
                                                            updateSetting('characterLimit', v)
                                                        }
                                                        style={{ width: 70, marginRight: 10 }}
                                                    />
                                                </Row>
                                            </Column>
                                        )}
                                        {allowedBeadTypes.includes('audio') && (
                                            <Column centerX className={styles.rowWrapper}>
                                                <Toggle
                                                    leftText='Audio time limit'
                                                    positionLeft={!audioTimeLimitOn}
                                                    rightColor='blue'
                                                    onClick={() => {
                                                        setAudioTimeLimitOn(!audioTimeLimitOn)
                                                        updateSetting(
                                                            'moveDuration',
                                                            audioTimeLimitOn ? 0 : 60
                                                        )
                                                    }}
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
                                                        color={
                                                            moveDuration === 60 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() =>
                                                            updateSetting('moveDuration', 60)
                                                        }
                                                        style={{ marginRight: 10 }}
                                                    />
                                                    <Button
                                                        text='2 min'
                                                        color={
                                                            moveDuration === 120 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() =>
                                                            updateSetting('moveDuration', 120)
                                                        }
                                                        style={{ marginRight: 10 }}
                                                    />
                                                    <Button
                                                        text='3 min'
                                                        color={
                                                            moveDuration === 180 ? 'blue' : 'grey'
                                                        }
                                                        onClick={() =>
                                                            updateSetting('moveDuration', 180)
                                                        }
                                                        style={{ marginRight: 10 }}
                                                    />
                                                    <Row centerY>
                                                        <Input
                                                            type='number'
                                                            value={moveDuration}
                                                            min={10}
                                                            max={600}
                                                            onChange={(v) =>
                                                                updateSetting('moveDuration', v)
                                                            }
                                                            style={{ width: 70, marginRight: 10 }}
                                                        />
                                                        <p>secs</p>
                                                    </Row>
                                                </Row>
                                            </Column>
                                        )}
                                    </Column>
                                )}
                            </Column>
                            {multiplayer && !openToAllUsers && (
                                <>
                                    <div className={styles.divider} />
                                    <Column centerX className={styles.section}>
                                        <Row centerX className={styles.sectionHeader}>
                                            <p>Players</p>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setPlayersCollapsed(!playersCollapsed)
                                                }
                                            >
                                                {playersCollapsed ? (
                                                    <ChevronDownIcon />
                                                ) : (
                                                    <ChevronUpIcon />
                                                )}
                                            </button>
                                        </Row>
                                        {!playersCollapsed && (
                                            <Column centerX>
                                                <Row centerY className={styles.searchWrapper}>
                                                    <SearchSelector
                                                        type='user'
                                                        placeholder='Search for players...'
                                                        onSearchQuery={(query) =>
                                                            findPlayers(query)
                                                        }
                                                        onOptionSelected={(space) =>
                                                            addPlayer(space)
                                                        }
                                                        onBlur={() =>
                                                            setTimeout(
                                                                () => setPlayerOptions([]),
                                                                200
                                                            )
                                                        }
                                                        options={playerOptions}
                                                        loading={playersLoading}
                                                        style={{ width: '100%' }}
                                                    />
                                                    <SearchIcon />
                                                </Row>
                                                <Column>
                                                    {players.length > 0 && (
                                                        <Column style={{ marginBottom: 20 }}>
                                                            {players.map((player, index) => (
                                                                <Row
                                                                    key={player.id}
                                                                    centerY
                                                                    style={{
                                                                        margin: '0 10px 10px 0',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.positionControls
                                                                        }
                                                                    >
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
                                                                        {index <
                                                                            players.length - 1 && (
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
                                                                        className={`${
                                                                            styles.position
                                                                        } ${
                                                                            fixPlayerColors &&
                                                                            styles.clickable
                                                                        }`}
                                                                        style={{
                                                                            backgroundColor:
                                                                                fixPlayerColors
                                                                                    ? player.color
                                                                                    : 'white',
                                                                        }}
                                                                        onClick={() =>
                                                                            fixPlayerColors &&
                                                                            setSelectedPlayerId(
                                                                                player.id
                                                                            )
                                                                        }
                                                                    >
                                                                        {index + 1}
                                                                    </button>
                                                                    <ImageTitle
                                                                        type='space'
                                                                        imagePath={
                                                                            player.flagImagePath
                                                                        }
                                                                        title={`${player.name} (${player.handle})`}
                                                                        imageSize={35}
                                                                        fontSize={16}
                                                                        style={{ marginRight: 5 }}
                                                                    />
                                                                    {player.id !==
                                                                        accountData.id && (
                                                                        <CloseButton
                                                                            size={17}
                                                                            onClick={() =>
                                                                                removePlayer(
                                                                                    player.id
                                                                                )
                                                                            }
                                                                        />
                                                                    )}
                                                                </Row>
                                                            ))}
                                                        </Column>
                                                    )}
                                                    {selectedPlayerId !== 0 && (
                                                        <Modal
                                                            centerX
                                                            close={() => setSelectedPlayerId(0)}
                                                        >
                                                            <h1>Choose the players color:</h1>
                                                            <Row
                                                                centerY
                                                                className={styles.colorButtons}
                                                            >
                                                                {beadColors.map((color) => (
                                                                    <button
                                                                        key={color}
                                                                        type='button'
                                                                        aria-label='color'
                                                                        onClick={() =>
                                                                            changePlayerColor(color)
                                                                        }
                                                                        style={{
                                                                            backgroundColor: color,
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Row>
                                                        </Modal>
                                                    )}
                                                </Column>
                                                <Toggle
                                                    leftText='Fix player colors'
                                                    positionLeft={!fixPlayerColors}
                                                    rightColor='blue'
                                                    onClick={() =>
                                                        updateSetting(
                                                            'fixPlayerColors',
                                                            !fixPlayerColors
                                                        )
                                                    }
                                                    style={{ marginBottom: 10 }}
                                                    onOffText
                                                />
                                                {playersError && (
                                                    <p className={styles.error}>
                                                        {players.length < 2
                                                            ? 'At least 2 players required'
                                                            : 'Max 6 players allowed'}
                                                    </p>
                                                )}
                                            </Column>
                                        )}
                                    </Column>
                                </>
                            )}
                        </div>
                    </Column>
                )}
            </Column>
            <Button text='Save settings' color='blue' onClick={save} />
            {helpModalOpen && <GameHelpModal close={() => setHelpModalOpen(false)} />}
        </Modal>
    )
}

export default GameSettingsModal
