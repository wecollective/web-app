/* eslint-disable no-underscore-dangle */
import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import Toggle from '@components/Toggle'
import styles from '@styles/components/modals/AddPostAudioModal.module.scss'
import * as d3 from 'd3'
import React, { useState } from 'react'

const GBGSettingsModal = (props: {
    settings: any
    saveSettings: (settings: any) => void
    close: () => void
}): JSX.Element => {
    const { settings, saveSettings, close } = props
    const [synchronous, setSynchronous] = useState(settings.synchronous)
    const [startTime, setStartTime] = useState(settings.startTime)
    const [endTime, setEndTime] = useState(settings.endTime)
    const [multiplayer, setMultiplayer] = useState(settings.multiplayer)
    const [openToAllUsers, setOpenToAllUsers] = useState(settings.openToAllUsers)
    const [players, setPlayers] = useState(settings.players)
    const [fixPlayerColors, setFixPlayerColors] = useState(settings.fixPlayerColors)
    const [totalMoves, setTotalMoves] = useState(settings.totalMoves)
    const [moveDuration, setMoveDuration] = useState(settings.moveDuration)
    const [introDuration, setIntroDuration] = useState(settings.introDuration)
    const [intervalDuration, setIntervalDuration] = useState(settings.intervalDuration)
    const [outroDuration, setOutroDuration] = useState(settings.outroDuration)
    const [allowedBeadTypes, setAllowedBeadTypes] = useState(settings.allowedBeadTypes)
    const [characterLimit, setCharacterLimit] = useState(settings.characterLimit)
    const [audioTimeLimit, setAudioTimeLimit] = useState(settings.audioTimeLimit)
    const [timeWindow, setTimeWindow] = useState(settings.timeWindow)
    const [includeDates, setIncludeDates] = useState(false)

    function removeEndDate() {
        const endTimeInstance = d3.select('#date-time-end').node()._flatpickr
        endTimeInstance.setDate(null)
        setEndTime('')
    }

    function save() {
        console.log('newSettings: ')
        // saveSettings(newSettings)
    }

    return (
        <Modal centered close={close} className={styles.wrapper}>
            <h1>Glass Bead Game Settings</h1>
            <Column centerX style={{ width: '100%', marginBottom: 20 }}>
                <Row>
                    <Toggle
                        leftText='Synchronous'
                        rightText={synchronous ? 'ON' : 'OFF'}
                        positionLeft={!synchronous}
                        rightColor='blue'
                        onClick={() => setSynchronous(!synchronous)}
                        style={{ marginRight: 30 }}
                    />
                    {synchronous ? (
                        <Toggle
                            key={0}
                            leftText='Include dates'
                            rightText={includeDates ? 'ON' : 'OFF'}
                            positionLeft={!includeDates}
                            rightColor='blue'
                            onClick={() => setIncludeDates(!includeDates)}
                        />
                    ) : (
                        <Toggle
                            key={1}
                            leftText='Multiplayer'
                            rightText={multiplayer ? 'ON' : 'OFF'}
                            positionLeft={!multiplayer}
                            rightColor='blue'
                            onClick={() => setMultiplayer(!multiplayer)}
                        />
                    )}
                </Row>
                {synchronous && includeDates && (
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
                )}
                {!synchronous && multiplayer && (
                    <Column style={{ marginTop: 20 }}>
                        <Toggle
                            key={1}
                            leftText='Open to all users'
                            rightText={openToAllUsers ? 'ON' : 'OFF'}
                            positionLeft={!openToAllUsers}
                            rightColor='blue'
                            onClick={() => setOpenToAllUsers(!openToAllUsers)}
                        />
                    </Column>
                )}
            </Column>
            <Button text='Save settings' color='blue' onClick={save} />
        </Modal>
    )
}

export default GBGSettingsModal
