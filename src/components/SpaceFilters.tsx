import Column from '@components/Column'
import Row from '@components/Row'
import { getParamString } from '@src/Helpers'
import styles from '@styles/components/PostFilters.module.scss'
import {
    ArrowDownIcon,
    ClockIcon,
    CommentIcon,
    EyeIcon,
    LikeIcon,
    NewIcon,
    PostIcon,
    RankingIcon,
    UsersIcon,
} from '@svgs/all'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function SpaceFilters(props: {
    pageType: 'space' | 'user'
    urlParams: any
    style?: any
}): JSX.Element {
    const { pageType, urlParams, style } = props
    const [params, setParams] = useState({ ...urlParams })
    const { filter, sortBy, timeRange, depth, lens } = params
    const [sortByModalOpen, setSortByModalOpen] = useState(false)
    const [timeRangeModalOpen, setTimeRangeModalOpen] = useState(false)
    const [depthModalOpen, setDepthModalOpen] = useState(false)
    const [lensModalOpen, setLensModalOpen] = useState(false)
    const sortByOptions = ['Likes', 'Posts', 'Comments', 'Followers']
    const timeRangeOptions = [
        'All Time',
        'This Year',
        'This Month',
        'This Week',
        'Today',
        'This Hour',
    ]
    const depthOptions = ['Deep', 'Shallow']
    const lensOptions = ['List', 'Tree', 'Circles']
    const location = useLocation()
    const history = useNavigate()

    function findSortByIcon(option) {
        if (option === 'Likes') return <LikeIcon />
        if (option === 'Comments') return <CommentIcon />
        if (option === 'Posts') return <PostIcon />
        if (option === 'Followers') return <UsersIcon />
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
                            sortBy: 'Likes',
                            timeRange: 'All Time',
                        })
                    }
                    style={{ marginRight: 10 }}
                >
                    <RankingIcon />
                    <p>Top</p>
                </button>
                <div className={styles.divider} />
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
                <Column style={{ position: 'relative' }}>
                    <button
                        type='button'
                        className={styles.button}
                        onClick={() => setDepthModalOpen(!depthModalOpen)}
                        onBlur={() => setTimeout(() => setDepthModalOpen(false), 200)}
                    >
                        <ArrowDownIcon />
                        <p>{depth}</p>
                    </button>
                    {depthModalOpen && (
                        <Column className={styles.dropDown}>
                            {depthOptions.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    className={depth === option ? styles.selected : ''}
                                    onClick={() => {
                                        updateParams({ ...params, depth: option })
                                        setDepthModalOpen(false)
                                    }}
                                >
                                    <p>{option}</p>
                                </button>
                            ))}
                        </Column>
                    )}
                </Column>
            </Row>
            <Column style={{ position: 'relative' }}>
                <button
                    type='button'
                    className={styles.button}
                    onClick={() => setLensModalOpen(!lensModalOpen)}
                    onBlur={() => setTimeout(() => setLensModalOpen(false), 200)}
                >
                    <EyeIcon />
                    <p>{lens}</p>
                </button>
                {lensModalOpen && (
                    <Column className={styles.dropDown}>
                        {lensOptions.map((option) => (
                            <button
                                key={option}
                                type='button'
                                className={lens === option ? styles.selected : ''}
                                onClick={() => {
                                    updateParams({ ...params, lens: option })
                                    setLensModalOpen(false)
                                }}
                            >
                                <p>{option}</p>
                            </button>
                        ))}
                    </Column>
                )}
            </Column>
        </Row>
    )
}

SpaceFilters.defaultProps = {
    style: null,
}

export default SpaceFilters
