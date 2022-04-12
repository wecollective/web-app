import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import config from '@src/Config'
import { v4 as uuidv4 } from 'uuid'
import styles from '@styles/pages/SpacePage/SpacePageCalendar.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { weekDays, monthNames, formatTimeHM } from '@src/Functions'
import Column from '@components/Column'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import Modal from '@components/Modal'
import PostCard from '@components/Cards/PostCard/PostCard'
import LoadingWheel from '@components/LoadingWheel'
import { ReactComponent as LeftChevronSVG } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as RightChevronSVG } from '@svgs/chevron-right-solid.svg'

const SpacePageCalendar = ({
    match,
}: {
    match: { params: { spaceHandle: string } }
}): JSX.Element => {
    const { params } = match
    const { spaceHandle } = params
    const { accountData, accountDataLoading } = useContext(AccountContext)
    const { spaceData, getSpaceData, setSelectedSpaceSubPage } = useContext(SpaceContext)
    const { handle } = spaceData
    const [dateOffset, setDateOffset] = useState(0)
    const [monthText, setMonthText] = useState('')
    const [yearText, setYearText] = useState(0)
    const [squares, setSquares] = useState<any[]>([])
    const [selectedPost, setSelectedPost] = useState<any>(null)
    const [eventModalOpen, setEventModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    function openEventModal(postId) {
        setSelectedPost(null)
        setEventModalOpen(true)
        axios
            .get(`${config.apiURL}/post-data?accountId=${accountData.id}&postId=${postId}`)
            .then((res) => setSelectedPost(res.data))
    }

    useEffect(() => {
        setSelectedSpaceSubPage('calendar')
        if (!accountDataLoading && spaceHandle !== handle) getSpaceData(spaceHandle, false)
    }, [accountDataLoading, spaceHandle])

    useEffect(() => {
        if (!accountDataLoading) {
            setLoading(true)
            setSquares([])
            const date = new Date()
            if (dateOffset !== 0) date.setMonth(new Date().getMonth() + dateOffset)
            const day = date.getDate()
            const month = date.getMonth()
            const year = date.getFullYear()
            setMonthText(monthNames[month])
            setYearText(year)
            // get events
            axios
                .get(
                    `${config.apiURL}/space-events?spaceHandle=${spaceHandle}&year=${+year}&month=${
                        +month + 1
                    }`
                )
                .then((res) => {
                    // calculate month data
                    const firstDayOfMonth = new Date(year, month, 1)
                    const daysInMonth = new Date(year, month + 1, 0).getDate()
                    const dateString = firstDayOfMonth.toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                    })
                    const paddingDays = weekDays.indexOf(dateString.split(', ')[0])
                    // loop through days, add event data
                    for (let i = 1; i <= daysInMonth + paddingDays; i += 1) {
                        if (i <= paddingDays) setSquares((s) => [...s, { type: 'padding' }])
                        else {
                            const dayNumber = i - paddingDays
                            const dayEvents = [] as any[]
                            res.data.forEach((post) => {
                                const eventDate = new Date(post.Event.eventStartTime).getDate()
                                if (eventDate === dayNumber)
                                    dayEvents.push({
                                        ...post.Event,
                                        title: post.Event.title || post.GlassBeadGame.topic,
                                        type: post.type,
                                        postId: post.id,
                                    })
                            })
                            setSquares((s) => [
                                ...s,
                                {
                                    day: dayNumber,
                                    events: dayEvents,
                                    highlighted: dateOffset === 0 && dayNumber === day,
                                },
                            ])
                        }
                    }
                    setLoading(false)
                })
        }
    }, [accountDataLoading, spaceHandle, dateOffset])

    return (
        <Column className={styles.wrapper}>
            <Column centerX className={styles.content}>
                <Column centerX className={styles.header}>
                    <Row spaceBetween centerY className={styles.month}>
                        <button type='button' onClick={() => setDateOffset(dateOffset - 1)}>
                            <LeftChevronSVG />
                        </button>
                        <h1>
                            {monthText} {yearText}
                        </h1>
                        <button type='button' onClick={() => setDateOffset(dateOffset + 1)}>
                            <RightChevronSVG />
                        </button>
                    </Row>
                    <Row className={styles.days}>
                        {weekDays.map((day) => (
                            <p key={day}>{day}</p>
                        ))}
                    </Row>
                </Column>
                {loading ? (
                    <Column centerY style={{ height: 400 }}>
                        <LoadingWheel />
                    </Column>
                ) : (
                    <Row wrap className={styles.days}>
                        {squares.map((square) => (
                            <Column
                                key={uuidv4()}
                                className={`${
                                    square.type === 'padding' ? styles.padding : styles.day
                                } ${square.highlighted && styles.highlighted}`}
                            >
                                <p style={{ fontWeight: 800 }}>{square.day}</p>
                                {square.events && (
                                    <Scrollbars>
                                        {square.events
                                            .sort((a, b) => {
                                                return (
                                                    new Date(a.eventStartTime).getTime() -
                                                    new Date(b.eventStartTime).getTime()
                                                )
                                            })
                                            .map((event) => (
                                                <button
                                                    key={event.id}
                                                    className={`${styles.event} ${
                                                        styles[event.type]
                                                    }`}
                                                    type='button'
                                                    onClick={() => openEventModal(event.postId)}
                                                >
                                                    <p>{formatTimeHM(event.eventStartTime)}</p>
                                                    <p style={{ fontWeight: 800 }}>{event.title}</p>
                                                </button>
                                            ))}
                                    </Scrollbars>
                                )}
                            </Column>
                        ))}
                    </Row>
                )}
                {eventModalOpen && (
                    <Modal close={() => setEventModalOpen(false)}>
                        {selectedPost ? (
                            <PostCard location='post-page' post={selectedPost} />
                        ) : (
                            <LoadingWheel />
                        )}
                    </Modal>
                )}
            </Column>
        </Column>
    )
}

export default SpacePageCalendar
