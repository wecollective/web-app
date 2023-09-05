/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { findEventDuration, findEventTimes } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/EventCard.module.scss'
import { CalendarIcon, SuccessIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function EventCard(props: {
    postData: any
    setPostData: (data: any) => void
    location: string
}): JSX.Element {
    const { postData, setPostData, location } = props
    const { id, Event } = postData
    const { startTime, endTime, Going, Interested } = Event
    const { accountData, setAlertMessage, setAlertModalOpen } = useContext(AccountContext)
    const [goingModalOpen, setGoingModalOpen] = useState(false)
    const [interestedModalOpen, setInterestedModalOpen] = useState(false)
    const [goingLoading, setGoingLoading] = useState(false)
    const [interestedLoading, setInterestedLoading] = useState(false)
    const going = Going.map((u) => u.id).includes(accountData.id)
    const interested = Interested.map((u) => u.id).includes(accountData.id)
    const cookies = new Cookies()

    function respondToEvent(response) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Log in to respond to events')
            setAlertModalOpen(true)
        } else {
            if (response === 'going') setGoingLoading(true)
            else setInterestedLoading(true)
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = {
                postId: id,
                eventId: Event.id,
                startTime,
                response,
            }
            axios
                .post(`${config.apiURL}/respond-to-event`, data, options)
                .then(() => {
                    setPostData({
                        ...postData,
                        Event: {
                            ...Event,
                            Going: going
                                ? [...Going.filter((u) => u.id !== accountData.id)]
                                : response === 'going'
                                ? [...Going, accountData]
                                : Going,
                            Interested: interested
                                ? [...Interested.filter((u) => u.id !== accountData.id)]
                                : response === 'interested'
                                ? [...Interested, accountData]
                                : Interested,
                        },
                    })
                    setGoingLoading(false)
                    setInterestedLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Column>
            <Row wrap centerY className={styles.eventTimes}>
                <CalendarIcon />
                <p>{findEventTimes(startTime, endTime)}</p>
                <p>{findEventDuration(startTime, endTime)}</p>
            </Row>
            {(Going.length > 0 || Interested.length > 0) && (
                <Row style={{ marginBottom: 10 }}>
                    {Going.length > 0 && (
                        <FlagImageHighlights
                            type='user'
                            imagePaths={Going.map((u) => u.flagImagePath)}
                            imageSize={30}
                            text={`${Going.length} going`}
                            onClick={() => setGoingModalOpen(true)}
                            style={{ marginRight: 15 }}
                        />
                    )}
                    {Interested.length > 0 && (
                        <FlagImageHighlights
                            type='user'
                            imagePaths={Interested.map((u) => u.flagImagePath)}
                            imageSize={30}
                            text={`${Interested.length} interested`}
                            onClick={() => setInterestedModalOpen(true)}
                        />
                    )}
                </Row>
            )}
            {goingModalOpen && (
                <Modal centerX close={() => setGoingModalOpen(false)}>
                    <h1>Going to event</h1>
                    <Column centerX>
                        {Going.map((user) => (
                            <ImageTitle
                                key={user.id}
                                type='user'
                                imagePath={user.flagImagePath}
                                title={user.name}
                                link={`/u/${user.handle}/posts`}
                                style={{ marginBottom: 10 }}
                            />
                        ))}
                    </Column>
                </Modal>
            )}
            {interestedModalOpen && (
                <Modal centerX close={() => setInterestedModalOpen(false)}>
                    <h1>Interested in event</h1>
                    <Column centerX>
                        {Interested.map((user) => (
                            <ImageTitle
                                key={user.id}
                                type='user'
                                imagePath={user.flagImagePath}
                                title={user.name}
                                link={`/u/${user.handle}/posts`}
                                style={{ marginBottom: 10 }}
                            />
                        ))}
                    </Column>
                </Modal>
            )}
            {new Date(startTime) > new Date() && (
                <Row style={{ marginBottom: 10 }}>
                    <Button
                        text='Going'
                        color='aqua'
                        size='medium'
                        disabled={location === 'preview'}
                        loading={goingLoading}
                        icon={going ? <SuccessIcon /> : undefined}
                        onClick={() => respondToEvent('going')}
                        style={{ marginRight: 5 }}
                    />
                    <Button
                        text='Interested'
                        color='aqua'
                        size='medium'
                        disabled={location === 'preview'}
                        loading={interestedLoading}
                        icon={interested ? <SuccessIcon /> : undefined}
                        onClick={() => respondToEvent('interested')}
                    />
                </Row>
            )}
        </Column>
    )
}

export default EventCard
