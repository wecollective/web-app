import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AccountContext } from '@src/contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePagePosts.module.scss'
import Row from '@components/Row'
import Column from '@components/Column'
import SpacePagePostsHeader from '@pages/SpacePage/SpacePagePostsHeader'
import SpacePagePostMap from '@pages/SpacePage/SpacePagePostMap'
import SpaceNavigationList from '@pages/SpacePage/SpaceNavigationList'
import PostList from '@components/PostList'
import SpaceNotFound from '@pages/SpaceNotFound'

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
