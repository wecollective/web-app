import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/SpacePageCalendar.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { weekDays, monthNames } from '@src/Functions'
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

    function getSpaceEvents(year, month) {
        console.log('getSpaceEvents: ', year, month)
        axios
            .get(
                /* prettier-ignore */
                `${config.apiURL}/space-events?accountId=${accountData.id
                }&spaceHandle=${spaceHandle
                }&year=${year
                }&month=${month}`
            )
            .then((res) => {
                console.log('events: ', res.data)
            })
    }

    useEffect(() => {
        setSelectedSpaceSubPage('calendar')
        if (!accountDataLoading && spaceHandle !== handle) getSpaceData(spaceHandle, false)
    }, [accountDataLoading, spaceHandle])

    useEffect(() => {
        const calendar = document.getElementById('calendar')
        if (calendar) {
            const date = new Date()
            if (dateOffset !== 0) date.setMonth(new Date().getMonth() + dateOffset)
            const day = date.getDate()
            const month = date.getMonth()
            const year = date.getFullYear()

            getSpaceEvents(+year, +month + 1)

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
            calendar.innerHTML = ''

            for (let i = 1; i <= daysInMonth + paddingDays; i += 1) {
                const daySquare = document.createElement('div')
                if (i <= paddingDays) daySquare.classList.add(styles.paddingSquare)
                else {
                    daySquare.classList.add(styles.daySquare)
                    if (i - paddingDays === day && dateOffset === 0) {
                        daySquare.classList.add(styles.highlighted)
                    }
                    daySquare.innerText = (i - paddingDays).toString()
                }
                calendar.appendChild(daySquare)
            }
        }
    }, [spaceHandle, dateOffset])

    return (
        <Column className={styles.wrapper}>
            <Column centerX className={styles.content}>
                <Row centerY spaceBetween className={styles.header}>
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
                        <p style={{ width: 100, margin: '0 5px' }}>{day}</p>
                    ))}
                </Row>
                <Row wrap id='calendar'>
                    {/* {days.map((day) => (
                        <Column centerX centerY className={styles.daySquare}>
                            {day}
                        </Column>
                    ))} */}
                </Row>
            </Column>
        </Column>
    )
}

export default SpacePageCalendar
