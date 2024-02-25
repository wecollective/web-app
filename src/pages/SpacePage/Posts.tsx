import Column from '@components/Column'
import PostFilters from '@components/PostFilters'
import PostList from '@components/PostList'
import Row from '@components/Row'
import UserButton from '@components/UserButton'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import Followers from '@pages/SpacePage/Followers'
import NavigationList from '@pages/SpacePage/NavigationList'
import PostMap from '@pages/SpacePage/PostMap'
import TopContributors from '@pages/SpacePage/TopContributors'
import styles from '@styles/pages/SpacePage/Posts.module.scss'
import { HereIcon } from '@svgs/all'
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
        setPostMapOffset,
        postFilters,
        spacePostsPaginationOffset,
        spacePostsPaginationLimit,
        spacePostsPaginationHasMore,
        peopleInRoom,
    } = useContext(SpaceContext)
    // const [mediumScreen, setMediumScreen] = useState(false)
    const [largeScreen, setLargeScreen] = useState(false)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const wecoSpace =
        spaceData.id && (spaceData.id === 51 || spaceData.SpaceAncestors.find((a) => a.id === 51))

    // calculate params
    // todo: move into context and update space post filters there?
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...postFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpacePostsLoading(true)
        else if (params.lens === 'List') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit, params)
        } else if (params.lens === 'Map') {
            window.scrollTo({ top: 310, behavior: 'smooth' })
            setPostMapOffset(0)
            getPostMapData(spaceData.id, 0, params)
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
        return () => setSpacePostsLoading(true)
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
                        <PostFilters pageType='space' urlParams={params} />
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
                            {/* todo: create one component for this whole bar */}
                            <Followers />
                            <Column style={{ marginBottom: 20 }}>
                                <Row centerY className={styles.roomHeader}>
                                    <HereIcon />
                                    <p>Present</p>
                                </Row>
                                {peopleInRoom.map((user) => (
                                    <UserButton
                                        key={user.socketId}
                                        user={user}
                                        imageSize={35}
                                        maxChars={18}
                                        style={{ marginBottom: 10 }}
                                    />
                                ))}
                            </Column>
                            <TopContributors />
                        </Column>
                    )}
                </Row>
            )}
            {params.lens === 'Map' && (
                <Column centerX className={styles.postMapView}>
                    <Row style={{ width: '100%', maxWidth: 770 }}>
                        <PostFilters pageType='space' urlParams={params} />
                    </Row>
                    <PostMap postMapData={postMapData} params={params} />
                </Column>
            )}
        </Column>
    )
}

export default Posts
