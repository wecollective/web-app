import Column from '@components/Column'
import PostList from '@components/PostList'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import SpaceNavigationList from '@pages/SpacePage/SpaceNavigationList'
import SpacePagePostMap from '@pages/SpacePage/SpacePagePostMap'
import SpacePagePostsHeader from '@pages/SpacePage/SpacePagePostsHeader'
import styles from '@styles/pages/SpacePage/SpacePagePosts.module.scss'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const SpacePagePosts = (): JSX.Element => {
    const { pageBottomReached } = useContext(AccountContext)
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
    const [showNavList, setShowNavList] = useState(false)

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spacePostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpacePostsLoading(true)
        else {
            if (params.view === 'List')
                getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit, params)
            if (params.view === 'Map') getPostMapData(spaceData.id, params, 50)
        }
    }, [spaceData.handle, location])

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
        setShowNavList(document.documentElement.clientWidth >= 900)
        window.addEventListener('resize', () =>
            setShowNavList(document.documentElement.clientWidth >= 900)
        )
    }, [])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <SpacePagePostsHeader params={params} />
            <Column className={styles.content}>
                {params.view === 'List' && (
                    <Row className={styles.postListView}>
                        {showNavList && (
                            <Column className={styles.spaceNavWrapper}>
                                <SpaceNavigationList />
                            </Column>
                        )}
                        <PostList
                            location='space-posts'
                            posts={spacePosts}
                            firstPostsloading={spacePostsLoading}
                            nextPostsLoading={nextSpacePostsLoading}
                        />
                    </Row>
                )}
                {params.view === 'Map' && (
                    <Column className={styles.postMapView}>
                        <SpacePagePostMap postMapData={postMapData} params={params} />
                    </Column>
                )}
            </Column>
        </Column>
    )
}

export default SpacePagePosts
