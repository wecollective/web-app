import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/SpacePageCalendar.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { weekDays, monthNames, formatTimeHM } from '@src/Functions'
import Column from '@components/Column'
import Row from '@components/Row'
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

    useEffect(() => {
        setSelectedSpaceSubPage('calendar')
        if (!accountDataLoading && spaceHandle !== handle) getSpaceData(spaceHandle, false)
    }, [accountDataLoading, spaceHandle])

    useEffect(() => {
        setSquares([])
        // calculate month data
        const date = new Date()
        if (dateOffset !== 0) date.setMonth(new Date().getMonth() + dateOffset)
        const day = date.getDate()
        const month = date.getMonth()
        const year = date.getFullYear()
        setMonthText(monthNames[month])
        setYearText(year)
        const firstDayOfMonth = new Date(year, month, 1)
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const dateString = firstDayOfMonth.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        })
        const paddingDays = weekDays.indexOf(dateString.split(', ')[0])
        // get events
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-events?accountId=${accountData.id
                }&spaceHandle=${spaceHandle
                }&year=${+year
                }&month=${+month + 1}`
            )
            .then((res) => {
                // loop through days, add event data
                for (let i = 1; i <= daysInMonth + paddingDays; i += 1) {
                    if (i <= paddingDays) setSquares((ds) => [...ds, { type: 'padding' }])
                    else {
                        const dayNumber = i - paddingDays
                        const dayEvents = [] as any[]
                        res.data.forEach((post) => {
                            const eventDate = new Date(post.Event.eventStartTime).getDate()
                            if (eventDate === dayNumber) dayEvents.push(post.Event)
                        })
                        setSquares((previousDaySquares) => [
                            ...previousDaySquares,
                            {
                                day: dayNumber,
                                events: dayEvents,
                                highlighted: dateOffset === 0 && dayNumber === day,
                            },
                        ])
                    }
                }
            })
    }, [spaceHandle, dateOffset])

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
                            <p>{day}</p>
                        ))}
                    </Row>
                </Column>
                <Row wrap className={styles.days}>
                    {squares.map((square) => (
                        <Column
                            className={`${
                                square.type === 'padding' ? styles.padding : styles.day
                            } ${square.highlighted && styles.highlighted}`}
                        >
                            <p style={{ fontWeight: 800 }}>{square.day}</p>
                            {square.events && (
                                <Column>
                                    {square.events.map((event) => (
                                        <Row className={styles.event}>
                                            <p>{formatTimeHM(event.eventStartTime)}</p>
                                            <p style={{ fontWeight: 800 }}>{event.title}</p>
                                        </Row>
                                    ))}
                                </Column>
                            )}
                        </Column>
                    ))}
                </Row>
            </Column>
        </Column>
    )
}

export default SpacePageCalendar
