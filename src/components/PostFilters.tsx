import Column from '@components/Column'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import { postTypeIcons } from '@src/Helpers'
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
import React, { useContext, useState } from 'react'
import { useLocation } from 'react-router-dom'

function PostFilters(): JSX.Element {
    const { spacePostsFilters } = useContext(SpaceContext)
    const [filter, setFilter] = useState('Active')
    const [sortBy, setSortBy] = useState('Likes')
    const [timeRange, setTimeRange] = useState('All Time')
    const [type, setType] = useState('All Types')
    const [depth, setDepth] = useState('Deep')
    const [lens, setLens] = useState('List')
    const [sortByModalOpen, setSortByModalOpen] = useState(false)
    const [timeRangeModalOpen, setTimeRangeModalOpen] = useState(false)
    const [typeModalOpen, setTypeModalOpen] = useState(false)
    const [depthModalOpen, setDepthModalOpen] = useState(false)
    const [lensModalOpen, setLensModalOpen] = useState(false)
    const sortByOptions = ['Likes', 'Comments', 'Links', 'Signal', 'Reposts']
    const timeRangeOptions = [
        'All Time',
        'Last Year',
        'Last Month',
        'Last Week',
        'Today',
        'Last Hour',
    ]
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
    const depthOptions = ['Deep', 'Shallow']
    const lensOptions = ['List', 'Map']
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    // calculate params
    // todo: move into context and update space post filters there?
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spacePostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

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

    return (
        <Row spaceBetween className={styles.filters}>
            <Row>
                <button
                    type='button'
                    className={`${styles.button} ${filter === 'Active' && styles.selected}`}
                    onClick={() => setFilter('Active')}
                    style={{ marginRight: 10 }}
                >
                    <ReactionIcon />
                    <p style={{ marginLeft: 5 }}>Active</p>
                </button>
                <button
                    type='button'
                    className={`${styles.button} ${filter === 'New' && styles.selected}`}
                    onClick={() => setFilter('New')}
                    style={{ marginRight: 10 }}
                >
                    <NewIcon />
                    <p style={{ marginLeft: 5 }}>New</p>
                </button>
                <button
                    type='button'
                    className={`${styles.button} ${filter === 'Top' && styles.selected}`}
                    onClick={() => setFilter('Top')}
                    style={{ marginRight: 10 }}
                >
                    <RankingIcon />
                    <p style={{ marginLeft: 5 }}>Top</p>
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
                            <p style={{ marginLeft: 5 }}>{sortBy}</p>
                        </button>
                        {sortByModalOpen && (
                            <Column className={styles.dropDown}>
                                {sortByOptions.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        className={sortBy === option ? styles.selected : ''}
                                        onClick={() => {
                                            setSortBy(option)
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
                            <p style={{ marginLeft: 5 }}>{timeRange}</p>
                        </button>
                        {timeRangeModalOpen && (
                            <Column className={styles.dropDown}>
                                {timeRangeOptions.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        className={timeRange === option ? styles.selected : ''}
                                        onClick={() => {
                                            setTimeRange(option)
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
                        <p style={{ marginLeft: 5 }}>{type}</p>
                    </button>
                    {typeModalOpen && (
                        <Column className={styles.dropDown}>
                            {typeOptions.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    className={type === option ? styles.selected : ''}
                                    onClick={() => {
                                        setType(option)
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
                        <p style={{ marginLeft: 5 }}>{depth}</p>
                    </button>
                    {depthModalOpen && (
                        <Column className={styles.dropDown}>
                            {depthOptions.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    className={type === option ? styles.selected : ''}
                                    onClick={() => {
                                        setDepth(option)
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
                    <p style={{ marginLeft: 5 }}>{lens}</p>
                </button>
                {lensModalOpen && (
                    <Column className={styles.dropDown}>
                        {lensOptions.map((option) => (
                            <button
                                key={option}
                                type='button'
                                className={type === option ? styles.selected : ''}
                                onClick={() => {
                                    setLens(option)
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
