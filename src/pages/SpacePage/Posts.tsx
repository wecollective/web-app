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
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const [largeScreen, setLargeScreen] = useState(false)
    const wecoSpace =
        spaceData.id && (spaceData.id === 51 || spaceData.SpaceAncestors.find((a) => a.id === 51))

    // calculate params
    // todo: move into context and update space post filters there?
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spacePostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    useEffect(() => {
        if (params.lens === 'List') window.scrollTo({ top: 0, behavior: 'smooth' })
        else window.scrollTo({ top: 310, behavior: 'smooth' })
        if (spaceData.handle !== spaceHandle) setSpacePostsLoading(true)
        else {
            if (params.lens === 'List')
                getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit, params)
            if (params.lens === 'Map') getPostMapData(spaceData.id, params, 50)
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
        setLargeScreen(document.documentElement.clientWidth >= 1200)
        window.addEventListener('resize', () =>
            setLargeScreen(document.documentElement.clientWidth >= 1200)
        )
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
                    <PostList
                        location='space-posts'
                        posts={spacePosts}
                        totalPosts={spaceData.totalPosts}
                        loading={spacePostsLoading}
                        nextPostsLoading={nextSpacePostsLoading}
                        className={styles.postList}
                        styling={wecoSpace}
                    />
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
