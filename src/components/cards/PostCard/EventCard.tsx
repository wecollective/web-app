/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import Row from '@components/Row'
import UserButton from '@components/UserButton'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { Post, findEventDuration, findEventTimes } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/EventCard.module.scss'
import { CalendarIcon, SuccessIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function EventCard(props: {
    post: Post
    setPost: (data: Post) => void
    location: string
}): JSX.Element {
    const { post, setPost, location } = props
    const { id, Event } = post
    const { startTime, endTime } = Event
    const { accountData, alert } = useContext(AccountContext)
    const [goingModalOpen, setGoingModalOpen] = useState(false)
    const [interestedModalOpen, setInterestedModalOpen] = useState(false)
    const [goingLoading, setGoingLoading] = useState(false)
    const [interestedLoading, setInterestedLoading] = useState(false)
    const [peopleGoing, setPeopleGoing] = useState(Event.Going)
    const [peopleInterested, setPeopleInterested] = useState(Event.Interested)
    // todo: paginate responses and get account response seperately
    const going = peopleGoing.map((u) => u.id).includes(accountData.id)
    const interested = peopleInterested.map((u) => u.id).includes(accountData.id)
    const activeUsers = peopleGoing.length > 0 || peopleInterested.length > 0
    const allowResponses = new Date(startTime) > new Date()
    const cookies = new Cookies()

    function respondToEvent(response) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            alert('Log in to respond to events')
        } else {
            if (response === 'going') setGoingLoading(true)
            else setInterestedLoading(true)
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = { postId: id, eventId: Event.id, startTime, response }
            axios
                .post(`${config.apiURL}/respond-to-event`, data, options)
                .then(() => {
                    if (response === 'going') {
                        setPeopleGoing(
                            going
                                ? peopleGoing.filter((u) => u.id !== accountData.id)
                                : [...peopleGoing, accountData]
                        )
                        if (!going && interested)
                            setPeopleInterested(
                                peopleInterested.filter((u) => u.id !== accountData.id)
                            )
                    } else {
                        setPeopleInterested(
                            interested
                                ? peopleInterested.filter((u) => u.id !== accountData.id)
                                : [...peopleInterested, accountData]
                        )
                        if (!interested && going)
                            setPeopleGoing(peopleGoing.filter((u) => u.id !== accountData.id))
                    }
                    setGoingLoading(false)
                    setInterestedLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Column centerX className={styles.wrapper}>
            <Row wrap centerY centerX className={styles.eventTimes}>
                <CalendarIcon />
                <p>{findEventTimes(startTime, endTime)}</p>
                {endTime && <p>{findEventDuration(startTime, endTime)}</p>}
            </Row>
            {activeUsers && (
                <Row style={{ marginTop: 10 }}>
                    {peopleGoing.length > 0 && (
                        <FlagImageHighlights
                            type='user'
                            images={peopleGoing.map((u) => u.flagImagePath).splice(0, 3)}
                            imageSize={30}
                            text={`${peopleGoing.length} going`}
                            onClick={() => setGoingModalOpen(true)}
                            style={{ marginRight: 15 }}
                        />
                    )}
                    {peopleInterested.length > 0 && (
                        <FlagImageHighlights
                            type='user'
                            images={peopleInterested.map((u) => u.flagImagePath).splice(0, 3)}
                            imageSize={30}
                            text={`${peopleInterested.length} interested`}
                            onClick={() => setInterestedModalOpen(true)}
                        />
                    )}
                </Row>
            )}
            {allowResponses && (
                <Row style={{ marginTop: 10 }}>
                    <Button
                        text='Going'
                        color='aqua'
                        size='medium'
                        disabled={location === 'preview'}
                        loading={goingLoading}
                        icon={going ? <SuccessIcon /> : undefined}
                        onClick={() => respondToEvent('going')}
                        style={{ marginRight: 10 }}
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
            {goingModalOpen && (
                <Modal centerX close={() => setGoingModalOpen(false)}>
                    <h1>Going to event</h1>
                    <Column centerX>
                        {peopleGoing.map((user) => (
                            <UserButton
                                key={user.id}
                                user={user}
                                imageSize={32}
                                fontSize={15}
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
                        {peopleInterested.map((user) => (
                            <UserButton
                                key={user.id}
                                user={user}
                                imageSize={32}
                                fontSize={15}
                                style={{ marginBottom: 10 }}
                            />
                        ))}
                    </Column>
                </Modal>
            )}
        </Column>
    )
}

export default EventCard
