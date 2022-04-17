import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePagePosts.module.scss'
import SpacePagePostsFilters from '@pages/SpacePage/SpacePagePostsFilters'
import Row from '@components/Row'
import Column from '@components/Column'
import SpacePagePostsHeader from '@pages/SpacePage/SpacePagePostsHeader'
import SpacePagePostMap from '@pages/SpacePage/SpacePagePostMap'
import PostList from '@components/PostList'
import SpaceNotFound from '@pages/SpaceNotFound'

const SpacePagePosts = (): JSX.Element => {
    const {
        spaceData,
        spaceNotFound,
        spacePosts,
        getSpacePosts,
        resetSpacePosts,
        spacePostsLoading,
        setSpacePostsLoading,
        nextSpacePostsLoading,
        spacePostsPaginationOffset,
        spacePostsPaginationLimit,
        spacePostsFilters,
        spacePostsPaginationHasMore,
    } = useContext(SpaceContext)
    const { innerWidth } = window
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [showPostList, setShowPostList] = useState(true)
    const [showPostMap, setShowPostMap] = useState(innerWidth > 1500)

    function onScrollBottom() {
        if (!spacePostsLoading && !nextSpacePostsLoading && spacePostsPaginationHasMore)
            getSpacePosts(spaceData.id, spacePostsPaginationOffset, spacePostsPaginationLimit)
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpacePostsLoading(true)
        else getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit)
    }, [spaceData.handle, spacePostsFilters])

    useEffect(() => () => resetSpacePosts(), [])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column className={styles.wrapper}>
            <SpacePagePostsHeader
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                showPostList={showPostList}
                setShowPostList={setShowPostList}
                showPostMap={showPostMap}
                setShowPostMap={setShowPostMap}
            />
            {filtersOpen && <SpacePagePostsFilters />}
            <Row className={styles.content}>
                {showPostList && (
                    <Column className={styles.postList}>
                        <PostList
                            location='space-posts'
                            posts={spacePosts}
                            firstPostsloading={spacePostsLoading}
                            nextPostsLoading={nextSpacePostsLoading}
                            onScrollBottom={onScrollBottom}
                        />
                    </Column>
                )}
                {showPostMap && (
                    <Column className={styles.postMap}>
                        <SpacePagePostMap />
                    </Column>
                )}
            </Row>
        </Column>
    )
}

export default SpacePagePosts
