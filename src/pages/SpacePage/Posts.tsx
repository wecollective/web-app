import Column from '@components/Column'
import PostList from '@components/PostList'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import NavigationList from '@src/pages/SpacePage/NavigationList'
import PostMap from '@src/pages/SpacePage/PostMap'
import TopContributors from '@src/pages/SpacePage/TopContributors'
import styles from '@styles/pages/SpacePage/Posts.module.scss'
import {
    ArrowDownIcon,
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
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

function Posts(): JSX.Element {
    const { pageBottomReached, loggedIn } = useContext(AccountContext)
    const {
        spaceData,
        spaceNotFound,
        spacePosts,
        getSpacePosts,
        spacePostsLoading,
        setSpacePostsLoading,
        nextSpacePostsLoading,
        postMapData,
        getPostMapData,
        spacePostsFilters,
        spacePostsPaginationOffset,
        spacePostsPaginationLimit,
        spacePostsPaginationHasMore,
    } = useContext(SpaceContext)
    const [filter, setFilter] = useState('active')
    const [topModalOpen, setTopModalOpen] = useState(false)
    const topModalOptions = ['Likes', 'Comments', 'Links', 'Signal', 'Reposts']
    const [sortBy, setSortBy] = useState('Likes')
    // const [mediumScreen, setMediumScreen] = useState(false)
    const [largeScreen, setLargeScreen] = useState(false)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const wecoSpace =
        spaceData.id && (spaceData.id === 51 || spaceData.SpaceAncestors.find((a) => a.id === 51))

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

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpacePostsLoading(true)
        else if (params.lens === 'List') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit, params)
        } else if (params.lens === 'Map') {
            window.scrollTo({ top: 310, behavior: 'smooth' })
            getPostMapData(spaceData.id, params, 50)
        }
    }, [spaceData.handle, location, loggedIn])

    useEffect(() => {
        if (
            !spacePostsLoading &&
            !nextSpacePostsLoading &&
            spaceData.handle === spaceHandle &&
            spacePostsPaginationHasMore &&
            pageBottomReached
        ) {
            getSpacePosts(
                spaceData.id,
                spacePostsPaginationOffset,
                spacePostsPaginationLimit,
                params
            )
        }
    }, [pageBottomReached])

    useEffect(() => {
        // setMediumScreen(document.documentElement.clientWidth >= 1000)
        setLargeScreen(document.documentElement.clientWidth >= 1200)
        window.addEventListener('resize', () => {
            // setMediumScreen(document.documentElement.clientWidth >= 1000)
            setLargeScreen(document.documentElement.clientWidth >= 1200)
        })
    }, [])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {params.lens === 'List' && (
                <Row centerX style={{ width: '100%' }}>
                    {largeScreen && (
                        <Column className={styles.spaceNavWrapper}>
                            <NavigationList />
                        </Column>
                    )}
                    <Column style={{ width: '100%' }}>
                        <Row spaceBetween className={styles.filters}>
                            <Row>
                                <button
                                    type='button'
                                    className={`${styles.button} ${
                                        filter === 'active' && styles.selected
                                    }`}
                                    onClick={() => setFilter('active')}
                                    style={{ marginRight: 10 }}
                                >
                                    <ReactionIcon />
                                    <p style={{ marginLeft: 5 }}>Active</p>
                                </button>
                                <button
                                    type='button'
                                    className={`${styles.button} ${
                                        filter === 'new' && styles.selected
                                    }`}
                                    onClick={() => setFilter('new')}
                                    style={{ marginRight: 10 }}
                                >
                                    <NewIcon />
                                    <p style={{ marginLeft: 5 }}>New</p>
                                </button>
                                <button
                                    type='button'
                                    className={`${styles.button} ${
                                        filter === 'top' && styles.selected
                                    }`}
                                    onClick={() => setFilter('top')}
                                    style={{ marginRight: 10 }}
                                >
                                    <RankingIcon />
                                    <p style={{ marginLeft: 5 }}>Top</p>
                                </button>
                                <div className={styles.divider} />
                                {filter === 'top' && (
                                    <Column style={{ position: 'relative' }}>
                                        <button
                                            type='button'
                                            className={styles.button}
                                            onClick={() => setTopModalOpen(!topModalOpen)}
                                            onBlur={() =>
                                                setTimeout(() => setTopModalOpen(false), 200)
                                            }
                                            style={{ marginRight: 10 }}
                                        >
                                            {findSortByIcon(sortBy)}
                                            <p style={{ marginLeft: 5 }}>{sortBy}</p>
                                        </button>
                                        {topModalOpen && (
                                            <Column className={styles.dropDown}>
                                                {topModalOptions.map((option) => (
                                                    <button
                                                        type='button'
                                                        className={
                                                            sortBy === option ? styles.selected : ''
                                                        }
                                                        onClick={() => {
                                                            setSortBy(option)
                                                            setTopModalOpen(false)
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
                                {filter === 'top' && (
                                    <button
                                        type='button'
                                        className={styles.button}
                                        onClick={() => setFilter('top')}
                                        style={{ marginRight: 10 }}
                                    >
                                        <ClockIcon />
                                        <p style={{ marginLeft: 5 }}>All time</p>
                                    </button>
                                )}
                                <button
                                    type='button'
                                    className={styles.button}
                                    onClick={() => null}
                                    style={{ marginRight: 10 }}
                                >
                                    <PostIcon />
                                    <p style={{ marginLeft: 5 }}>All types</p>
                                </button>
                                <button
                                    type='button'
                                    className={styles.button}
                                    onClick={() => null}
                                >
                                    <ArrowDownIcon />
                                    <p style={{ marginLeft: 5 }}>Deep</p>
                                </button>
                            </Row>
                            <Row>
                                <button
                                    type='button'
                                    className={styles.button}
                                    onClick={() => null}
                                >
                                    <EyeIcon />
                                    <p style={{ marginLeft: 5 }}>List</p>
                                </button>
                            </Row>
                        </Row>
                        <PostList
                            location='space-posts'
                            posts={spacePosts}
                            totalPosts={spaceData.totalPosts}
                            loading={spacePostsLoading}
                            nextPostsLoading={nextSpacePostsLoading}
                            className={styles.postList}
                            styling={wecoSpace}
                        />
                    </Column>
                    {largeScreen && (
                        <Column className={styles.topContributorsWrapper}>
                            <TopContributors />
                        </Column>
                    )}
                </Row>
            )}
            {params.lens === 'Map' && (
                <Column className={styles.postMapView}>
                    <PostMap postMapData={postMapData} params={params} />
                </Column>
            )}
        </Column>
    )
}

export default Posts
