import Column from '@components/Column'
import Row from '@components/Row'
import { getParamString, postTypeIcons } from '@src/Helpers'
import styles from '@styles/components/PostFilters.module.scss'
import {
    ArrowDownIcon,
    CastaliaIcon,
    ClockIcon,
    CommentIcon,
    EyeIcon,
    LikeIcon,
    NeuronIcon,
    NewIcon,
    PostIcon,
    RankingIcon,
    ReactionIcon,
    RepostIcon,
    ZapIcon,
} from '@svgs/all'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function PostFilters(props: { pageType: 'space' | 'user'; urlParams: any }): JSX.Element {
    const { pageType, urlParams } = props
    const [params, setParams] = useState({ ...urlParams })
    const { filter, type, sortBy, timeRange, depth, searchQuery, lens } = params
    const [typeModalOpen, setTypeModalOpen] = useState(false)
    const [sortByModalOpen, setSortByModalOpen] = useState(false)
    const [timeRangeModalOpen, setTimeRangeModalOpen] = useState(false)
    const [depthModalOpen, setDepthModalOpen] = useState(false)
    const [lensModalOpen, setLensModalOpen] = useState(false)
    const typeOptions = [
        'All Types',
        'Text',
        'Image',
        'Url',
        'Audio',
        'Event',
        'Poll',
        'Glass Bead Game',
        'Card',
    ]
    const sortByOptions = ['Likes', 'Comments', 'Links', 'Signal', 'Reposts']
    const timeRangeOptions = [
        'All Time',
        'Last Year',
        'Last Month',
        'Last Week',
        'Today',
        'Last Hour',
    ]
    const depthOptions = ['Deep', 'Shallow']
    const lensOptions = ['List', 'Map']
    const location = useLocation()
    const history = useNavigate()
    const spaceHandle = location.pathname.split('/')[2]

    function findSortByIcon(option) {
        if (option === 'Likes') return <LikeIcon />
        if (option === 'Comments') return <CommentIcon />
        if (option === 'Links') return <NeuronIcon />
        if (option === 'Signal') return <ZapIcon />
        if (option === 'Reposts') return <RepostIcon />
        return null
    }

    function findTypeIcon(option) {
        if (option === 'All Types') return <PostIcon />
        if (option === 'Glass Bead Game') return <CastaliaIcon />
        return postTypeIcons[option.toLowerCase()]
    }

    function updateParams(newParams) {
        history({
            pathname: location.pathname,
            search: getParamString(newParams),
        })
    }

    useEffect(() => setParams({ ...urlParams }), [urlParams])

    return (
        <Row spaceBetween className={styles.filters}>
            <Row wrap>
                <button
                    type='button'
                    className={`${styles.button} ${filter === 'Active' && styles.selected}`}
                    onClick={() => updateParams({ ...params, filter: 'Active' })}
                    style={{ marginRight: 10 }}
                >
                    <ReactionIcon />
                    <p>Active</p>
                </button>
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
                    onClick={() => updateParams({ ...params, filter: 'Top' })}
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
                        onClick={() => setTypeModalOpen(!typeModalOpen)}
                        onBlur={() => setTimeout(() => setTypeModalOpen(false), 200)}
                        style={{ marginRight: 10 }}
                    >
                        {findTypeIcon(type)}
                        <p>{type}</p>
                    </button>
                    {typeModalOpen && (
                        <Column className={styles.dropDown}>
                            {typeOptions.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    className={type === option ? styles.selected : ''}
                                    onClick={() => {
                                        updateParams({ ...params, type: option })
                                        setTypeModalOpen(false)
                                    }}
                                >
                                    {findTypeIcon(option)}
                                    <p>{option}</p>
                                </button>
                            ))}
                        </Column>
                    )}
                </Column>
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

export default PostFilters
