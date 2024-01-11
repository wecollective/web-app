import Column from '@components/Column'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import LoadingWheel from '@components/animations/LoadingWheel'
import PostCard from '@components/cards/PostCard/PostCard'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import config from '@src/Config'
import { formatTimeHM, monthNames, weekDays } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/Calendar.module.scss'
import { ChevronLeftIcon, ChevronRightIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'

function Calendar(): JSX.Element {
    const { loggedIn } = useContext(AccountContext)
    const { spaceData, spaceNotFound } = useContext(SpaceContext)
    const [dateOffset, setDateOffset] = useState(0)
    const [monthText, setMonthText] = useState('')
    const [yearText, setYearText] = useState(0)
    const [squares, setSquares] = useState<any[]>([])
    const [selectedPost, setSelectedPost] = useState<any>(null)
    const [eventModalOpen, setEventModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const cookies = new Cookies()
    const mobileView = document.documentElement.clientWidth < 900

    function openEventModal(postId) {
        setSelectedPost(null)
        setEventModalOpen(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(`${config.apiURL}/post-data?postId=${postId}`, options)
            .then((res) => setSelectedPost(res.data))
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        setLoading(true)
        setSquares([])
        const date = new Date()
        if (dateOffset !== 0) date.setMonth(new Date().getMonth() + dateOffset)
        const day = date.getDate()
        const month = date.getMonth()
        const year = date.getFullYear()
        setMonthText(monthNames[month])
        setYearText(year)
        if (spaceData.handle === spaceHandle) {
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .get(
                    `${config.apiURL}/space-events?spaceHandle=${spaceHandle}&year=${year}&month=${
                        month + 1
                    }`,
                    options
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
                                const eventDate = new Date(post.Event.startTime).getDate()
                                if (eventDate === dayNumber)
                                    dayEvents.push({
                                        ...post.Event,
                                        title: post.title || post.text,
                                        type: post.type,
                                        postId: post.id,
                                    })
                            })
                            const dayNameIndex =
                                new Date(`${year}-${month}-${dayNumber}`).getDay() + 1
                            setSquares((s) => [
                                ...s,
                                {
                                    dayNumber,
                                    dayName: weekDays[dayNameIndex === 7 ? 0 : dayNameIndex],
                                    events: dayEvents,
                                    highlighted: dateOffset === 0 && dayNumber === day,
                                },
                            ])
                        }
                    }
                    setLoading(false)
                })
        }
    }, [spaceData.handle, dateOffset, loggedIn])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <Column centerX className={styles.header}>
                <Row spaceBetween centerY className={styles.month}>
                    <button type='button' onClick={() => setDateOffset(dateOffset - 1)}>
                        <ChevronLeftIcon />
                    </button>
                    <h1>
                        {monthText} {yearText}
                    </h1>
                    <button type='button' onClick={() => setDateOffset(dateOffset + 1)}>
                        <ChevronRightIcon />
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
                <div className={styles.days}>
                    {squares.map((square) => (
                        <Column
                            key={uuidv4()}
                            className={`${
                                square.type === 'padding' ? styles.padding : styles.day
                            } ${square.highlighted && styles.highlighted}`}
                        >
                            <Row style={{ marginBottom: 5 }}>
                                <p className={styles.dayNumber}>{square.dayNumber}</p>
                                <p className={styles.dayName}>{square.dayName}</p>
                            </Row>
                            {square.events && (
                                <Scrollbars>
                                    {square.events
                                        .sort((a, b) => {
                                            return (
                                                new Date(a.startTime).getTime() -
                                                new Date(b.startTime).getTime()
                                            )
                                        })
                                        .map((event) => (
                                            <button
                                                key={event.id}
                                                className={`${styles.event} ${styles[event.type]}`}
                                                type='button'
                                                onClick={() => openEventModal(event.postId)}
                                            >
                                                <p>{formatTimeHM(event.startTime)}</p>
                                                <p style={{ fontWeight: 800 }}>{event.title}</p>
                                            </button>
                                        ))}
                                </Scrollbars>
                            )}
                        </Column>
                    ))}
                </div>
            )}
            {eventModalOpen && (
                <Modal
                    centerX
                    close={() => setEventModalOpen(false)}
                    style={{ width: '100vw', maxWidth: 900 }}
                >
                    {selectedPost ? (
                        <PostCard location='post-page' post={selectedPost} />
                    ) : (
                        <LoadingWheel />
                    )}
                </Modal>
            )}
        </Column>
    )
}

export default Calendar
