/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Markdown from '@components/Markdown'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { formatTimeDHM, formatTimeHM, formatTimeMDYT } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/PostTypes/Event.module.scss'
import { ClockIcon, SuccessIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

const Event = (props: {
    postData: any
    setPostData: (data: any) => void
    location: string
}): JSX.Element => {
    const { postData, setPostData, location } = props
    const { id, text, Event: event } = postData
    const { accountData, setAlertMessage, setAlertModalOpen } = useContext(AccountContext)
    const [goingModalOpen, setGoingModalOpen] = useState(false)
    const [interestedModalOpen, setInterestedModalOpen] = useState(false)
    const [goingLoading, setGoingLoading] = useState(false)
    const [interestedLoading, setInterestedLoading] = useState(false)
    const going = event && event.Going.map((u) => u.id).includes(accountData.id)
    const interested = event && event.Interested.map((u) => u.id).includes(accountData.id)
    const cookies = new Cookies()

    // todo: move into helpers as also used in GBG post type
    function findEventTimes() {
        const startDate = new Date(event.startTime)
        const endDate = new Date(event.endTime)
        const sameDay =
            event.endTime &&
            startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate()
        const sameMinute =
            sameDay &&
            startDate.getHours() === endDate.getHours() &&
            startDate.getMinutes() === endDate.getMinutes()
        // format:
        // different day: June 29, 2022 at 22:00 → June 30, 2022 at 22:00
        // same day: June 29, 2022 at 22:00 → 23:00
        // same minute: June 29, 2022 at 22:00
        return `${formatTimeMDYT(event.startTime)} ${
            event.endTime && !sameMinute
                ? `→ ${sameDay ? formatTimeHM(event.endTime) : formatTimeMDYT(event.endTime)}`
                : ''
        }`
    }

    function findEventDuration() {
        const startDate = new Date(event.startTime)
        const endDate = new Date(event.endTime)
        const sameMinute =
            startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate() &&
            startDate.getHours() === endDate.getHours() &&
            startDate.getMinutes() === endDate.getMinutes()
        const difference = (endDate.getTime() - startDate.getTime()) / 1000
        if (event.endTime && !sameMinute)
            // rounded up to nearest minute
            return `(${formatTimeDHM(Math.ceil(difference / 60) * 60)})`
        return null
    }

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
                userName: accountData.name,
                userEmail: accountData.email,
                postId: id,
                eventId: event.id,
                startTime: event.startTime,
                response,
            }
            axios
                .post(`${config.apiURL}/respond-to-event`, data, options)
                .then(() => {
                    setPostData({
                        ...postData,
                        Event: {
                            ...event,
                            Going: going
                                ? [...event.Going.filter((u) => u.id !== accountData.id)]
                                : response === 'going'
                                ? [...event.Going, accountData]
                                : event.Going,
                            Interested: interested
                                ? [...event.Interested.filter((u) => u.id !== accountData.id)]
                                : response === 'interested'
                                ? [...event.Interested, accountData]
                                : event.Interested,
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
            <Markdown text={`# ${event.title}`} className={styles.title} />
            {text && (
                <ShowMoreLess height={150} style={{ marginBottom: 10 }}>
                    <DraftText stringifiedDraft={text} />
                </ShowMoreLess>
            )}
            <Row wrap centerY className={styles.eventTimes}>
                <ClockIcon />
                <p>{findEventTimes()}</p>
                <p>{findEventDuration()}</p>
            </Row>
            {(event.Going.length > 0 || event.Interested.length > 0) && (
                <Row>
                    {event.Going.length > 0 && (
                        <FlagImageHighlights
                            type='user'
                            imagePaths={event.Going.map((u) => u.flagImagePath)}
                            imageSize={30}
                            text={`${event.Going.length} going`}
                            onClick={() => setGoingModalOpen(true)}
                            style={{ marginRight: 15 }}
                        />
                    )}
                    {event.Interested.length > 0 && (
                        <FlagImageHighlights
                            type='user'
                            imagePaths={event.Interested.map((u) => u.flagImagePath)}
                            imageSize={30}
                            text={`${event.Interested.length} interested`}
                            onClick={() => setInterestedModalOpen(true)}
                        />
                    )}
                </Row>
            )}
            {goingModalOpen && (
                <Modal centered close={() => setGoingModalOpen(false)}>
                    <h1>Going to event</h1>
                    <Column>
                        {event.Going.map((user) => (
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
                <Modal centered close={() => setInterestedModalOpen(false)}>
                    <h1>Interested in event</h1>
                    <Column>
                        {event.Interested.map((user) => (
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
            {new Date(event.startTime) > new Date() && (
                <Row style={{ marginTop: 10 }}>
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

export default Event
