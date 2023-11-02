import Column from '@components/Column'
import Row from '@components/Row'
import { getParamString } from '@src/Helpers'
import styles from '@styles/components/PostFilters.module.scss'
import { ClockIcon, CommentIcon, NewIcon, PostIcon, RankingIcon } from '@svgs/all'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function PeopleFilters(props: {
    pageType: 'space' | 'user'
    urlParams: any
    style?: any
}): JSX.Element {
    const { pageType, urlParams, style } = props
    const [params, setParams] = useState({ ...urlParams })
    const { filter, sortBy, timeRange } = params
    const [sortByModalOpen, setSortByModalOpen] = useState(false)
    const [timeRangeModalOpen, setTimeRangeModalOpen] = useState(false)
    const sortByOptions = ['Posts', 'Comments']
    const timeRangeOptions = [
        'All Time',
        'This Year',
        'This Month',
        'This Week',
        'Today',
        'This Hour',
    ]
    const location = useLocation()
    const history = useNavigate()

    function findSortByIcon(option) {
        if (option === 'Comments') return <CommentIcon />
        if (option === 'Posts') return <PostIcon />
        return null
    }

    function updateParams(newParams) {
        // remove sortBy and timeRange if not filtered by top
        const filteredParams = { ...newParams }
        if (newParams.filter !== 'Top') {
            delete filteredParams.sortBy
            delete filteredParams.timeRange
        }
        history({
            pathname: location.pathname,
            search: getParamString(filteredParams),
        })
    }

    useEffect(() => setParams({ ...urlParams }), [urlParams])

    return (
        <Row spaceBetween className={styles.filters} style={style}>
            <Row wrap>
                <button
                    type='button'
                    className={`${styles.button} ${filter === 'New' && styles.selected}`}
                    onClick={() => updateParams({ ...params, filter: 'New' })}
                    style={{ marginRight: 10 }}
                >
                    <NewIcon />
                    <p>New</p>
                </button>
                <button
                    type='button'
                    className={`${styles.button} ${filter === 'Top' && styles.selected}`}
                    onClick={() =>
                        updateParams({
                            ...params,
                            filter: 'Top',
                            sortBy: 'Posts',
                            timeRange: 'All Time',
                        })
                    }
                    style={{ marginRight: 10 }}
                >
                    <RankingIcon />
                    <p>Top</p>
                </button>
                {filter === 'Top' && <div className={styles.divider} />}
                {filter === 'Top' && (
                    <Column style={{ position: 'relative' }}>
                        <button
                            type='button'
                            className={styles.button}
                            onClick={() => setSortByModalOpen(!sortByModalOpen)}
                            onBlur={() => setTimeout(() => setSortByModalOpen(false), 200)}
                            style={{ marginRight: 10 }}
                        >
                            {findSortByIcon(sortBy)}
                            <p>{sortBy}</p>
                        </button>
                        {sortByModalOpen && (
                            <Column className={styles.dropDown}>
                                {sortByOptions.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        className={sortBy === option ? styles.selected : ''}
                                        onClick={() => {
                                            updateParams({ ...params, sortBy: option })
                                            setSortByModalOpen(false)
                                        }}
                                    >
                                        {findSortByIcon(option)}
                                        <p>{option}</p>
                                    </button>
                                ))}
                            </Column>
                        )}
                    </Column>
                )}
                {filter === 'Top' && (
                    <Column style={{ position: 'relative' }}>
                        <button
                            type='button'
                            className={styles.button}
                            onClick={() => setTimeRangeModalOpen(!timeRangeModalOpen)}
                            onBlur={() => setTimeout(() => setTimeRangeModalOpen(false), 200)}
                            style={{ marginRight: 10 }}
                        >
                            <ClockIcon />
                            <p>{timeRange}</p>
                        </button>
                        {timeRangeModalOpen && (
                            <Column className={styles.dropDown}>
                                {timeRangeOptions.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        className={timeRange === option ? styles.selected : ''}
                                        onClick={() => {
                                            updateParams({ ...params, timeRange: option })
                                            setTimeRangeModalOpen(false)
                                        }}
                                    >
                                        <p>{option}</p>
                                    </button>
                                ))}
                            </Column>
                        )}
                    </Column>
                )}
            </Row>
        </Row>
    )
}

PeopleFilters.defaultProps = {
    style: null,
}

export default PeopleFilters
