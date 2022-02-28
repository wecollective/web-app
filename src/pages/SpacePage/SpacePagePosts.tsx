import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePagePosts.module.scss'
import PostCard from '@components/Cards/PostCard/PostCard'
import SpacePagePostsPlaceholder from '@pages/SpacePage/SpacePagePostsPlaceholder'
import SpacePagePostsFilters from '@pages/SpacePage/SpacePagePostsFilters'
import SearchBar from '@components/SearchBar'
import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Row from '@components/Row'
import Column from '@components/Column'
import Modal from '@components/Modal'
import SpacePagePostMap from '@pages/SpacePage/SpacePagePostMap'
import LoadingWheel from '@components/LoadingWheel'
import Scrollbars from '@src/components/Scrollbars'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePagePosts = ({ match }: { match: { params: { spaceHandle: string } } }): JSX.Element => {
    const { params } = match
    const { spaceHandle } = params
    const {
        accountDataLoading,
        loggedIn,
        setCreatePostModalOpen,
        setCreatePostModalType,
        setAlertModalOpen,
        setAlertMessage,
    } = useContext(AccountContext)
    const {
        spaceData,
        getSpaceData,
        spaceDataLoading,
        spacePosts,
        getSpacePosts,
        resetSpacePosts,
        spacePostsLoading,
        nextSpacePostsLoading,
        setSelectedSpaceSubPage,
        spacePostsPaginationOffset,
        spacePostsPaginationLimit,
        spacePostsFilters,
        updateSpacePostsFilter,
        spacePostsPaginationHasMore,
    } = useContext(SpaceContext)
    const { innerWidth } = window
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [viewsModalOpen, setViewsModalOpen] = useState(false)
    const [showPostList, setShowPostList] = useState(true)
    const [showPostMap, setShowPostMap] = useState(innerWidth > 1500)

    function openCreatePostModal(type) {
        if (loggedIn) {
            setCreatePostModalType(type)
            setCreatePostModalOpen(true)
        } else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a post')
        }
    }

    function onScrollBottom() {
        if (!spacePostsLoading && !nextSpacePostsLoading && spacePostsPaginationHasMore)
            getSpacePosts(spaceData.id, spacePostsPaginationOffset, spacePostsPaginationLimit)
    }

    useEffect(() => {
        // todo: use url instead of variable in store?
        setSelectedSpaceSubPage('posts')
        return () => resetSpacePosts()
    }, [])

    const location = useLocation()
    const getFirstPosts = (spaceId) => getSpacePosts(spaceId, 0, spacePostsPaginationLimit)
    useEffect(() => {
        if (!accountDataLoading) {
            if (spaceHandle !== spaceData.handle)
                getSpaceData(spaceHandle, showPostList ? getFirstPosts : null)
            else if (showPostList) getFirstPosts(spaceData.id)
        }
    }, [accountDataLoading, location, spacePostsFilters])

    return (
        <Column className={styles.wrapper}>
            <Row centerY className={styles.header}>
                <Button
                    text='New post'
                    color='blue'
                    onClick={() => openCreatePostModal('Text')}
                    style={{ marginRight: 10 }}
                />
                {spaceData.HolonHandles.map((h) => h.handle).includes('castalia') && (
                    <Button
                        text='New game'
                        color='purple'
                        onClick={() => openCreatePostModal('Glass Bead Game')}
                        style={{ marginRight: 10 }}
                    />
                )}
                <SearchBar
                    setSearchFilter={(payload) => updateSpacePostsFilter('searchQuery', payload)}
                    placeholder='Search posts...'
                    style={{ marginRight: 10 }}
                />
                <Button
                    icon={<SlidersIconSVG />}
                    color='grey'
                    style={{ marginRight: 10 }}
                    onClick={() => setFiltersOpen(!filtersOpen)}
                />
                <Button
                    icon={<EyeIconSVG />}
                    color='grey'
                    onClick={() => setViewsModalOpen(true)}
                />
                {viewsModalOpen && (
                    <Modal centered close={() => setViewsModalOpen(false)}>
                        <h1>Views</h1>
                        <p>Choose how to display the posts</p>
                        {innerWidth > 1600 ? (
                            <Column centerX>
                                <Row style={{ marginBottom: 20 }}>
                                    <Toggle
                                        leftText='List'
                                        rightColor='blue'
                                        positionLeft={!showPostList}
                                        onClick={() => setShowPostList(!showPostList)}
                                    />
                                </Row>
                                <Row>
                                    <Toggle
                                        leftText='Map'
                                        rightColor='blue'
                                        positionLeft={!showPostMap}
                                        onClick={() => setShowPostMap(!showPostMap)}
                                    />
                                </Row>
                            </Column>
                        ) : (
                            <Row>
                                <Toggle
                                    leftText='List'
                                    rightText='Map'
                                    positionLeft={showPostList}
                                    onClick={() => {
                                        setShowPostList(!showPostList)
                                        setShowPostMap(!showPostMap)
                                    }}
                                />
                            </Row>
                        )}
                    </Modal>
                )}
            </Row>
            {filtersOpen && (
                <Row className={styles.filters}>
                    <SpacePagePostsFilters />
                </Row>
            )}
            <Row className={styles.content}>
                {showPostList && (
                    <Scrollbars className={styles.posts} onScrollBottom={onScrollBottom}>
                        {accountDataLoading || spaceDataLoading || spacePostsLoading ? (
                            <SpacePagePostsPlaceholder />
                        ) : (
                            <>
                                {spacePosts.length ? (
                                    <>
                                        {spacePosts.map((post) => (
                                            <PostCard
                                                post={post}
                                                key={post.id}
                                                location='space-posts'
                                                style={{ marginBottom: 15 }}
                                                // todo: add class prop to posts?
                                            />
                                        ))}
                                        {nextSpacePostsLoading && (
                                            <Row centerX>
                                                <LoadingWheel />
                                            </Row>
                                        )}
                                    </>
                                ) : (
                                    <div className='wecoNoContentPlaceholder'>
                                        No posts yet that match those settings...
                                    </div>
                                )}
                            </>
                        )}
                    </Scrollbars>
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
