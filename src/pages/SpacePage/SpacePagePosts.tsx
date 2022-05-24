import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { getNewParams } from '@src/Helpers'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePagePosts.module.scss'
import SpacePagePostsFilters from '@pages/SpacePage/SpacePagePostsFilters'
import Row from '@components/Row'
import Column from '@components/Column'
import SpacePagePostsHeader from '@pages/SpacePage/SpacePagePostsHeader'
import SpacePagePostMap from '@pages/SpacePage/SpacePagePostMap'
import SpaceNavigationList from '@pages/SpacePage/SpaceNavigationList'
import PostList from '@components/PostList'
import SpaceNotFound from '@pages/SpaceNotFound'

const SpacePagePosts = (): JSX.Element => {
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
    const history = useHistory()
    const spaceHandle = location.pathname.split('/')[2]
    const [filtersOpen, setFiltersOpen] = useState(false)

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spacePostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function applyParam(type, value) {
        history.push({
            pathname: location.pathname,
            search: getNewParams(params, type, value),
        })
    }

    function onScrollBottom() {
        if (!spacePostsLoading && !nextSpacePostsLoading && spacePostsPaginationHasMore)
            getSpacePosts(
                spaceData.id,
                spacePostsPaginationOffset,
                spacePostsPaginationLimit,
                params
            )
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpacePostsLoading(true)
        else {
            if (params.view === 'List')
                getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit, params)
            if (params.view === 'Map') getPostMapData(spaceData.id, params, 50)
        }
    }, [spaceData.handle, location])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <SpacePagePostsHeader
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                params={params}
                applyParam={applyParam}
            />
            {filtersOpen && <SpacePagePostsFilters params={params} applyParam={applyParam} />}
            <Column className={styles.content}>
                {params.view === 'List' && (
                    <Row className={styles.postListView}>
                        <SpaceNavigationList />
                        <PostList
                            location='space-posts'
                            posts={spacePosts}
                            firstPostsloading={spacePostsLoading}
                            nextPostsLoading={nextSpacePostsLoading}
                            onScrollBottom={onScrollBottom}
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
