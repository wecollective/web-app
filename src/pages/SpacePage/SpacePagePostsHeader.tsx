import React, { useContext, useState } from 'react'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import SearchBar from '@components/SearchBar'
import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Row from '@components/Row'
import Column from '@components/Column'
import Modal from '@components/Modal'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePagePostsHeader = (props: {
    filtersOpen: boolean
    setFiltersOpen: (payload: boolean) => void
    showPostList: boolean
    setShowPostList: (payload: boolean) => void
    showPostMap: boolean
    setShowPostMap: (payload: boolean) => void
}): JSX.Element => {
    const {
        filtersOpen,
        setFiltersOpen,
        showPostList,
        setShowPostList,
        showPostMap,
        setShowPostMap,
    } = props
    const {
        loggedIn,
        setCreatePostModalOpen,
        setCreatePostModalType,
        setAlertModalOpen,
        setAlertMessage,
    } = useContext(AccountContext)
    const { spaceData, updateSpacePostsFilter } = useContext(SpaceContext)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const { innerWidth } = window

    function openCreatePostModal(type) {
        if (loggedIn) {
            setCreatePostModalType(type)
            setCreatePostModalOpen(true)
        } else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a post')
        }
    }

    return (
        <Row centerY className={styles.wrapper}>
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
            <Button icon={<EyeIconSVG />} color='grey' onClick={() => setViewModalOpen(true)} />
            {viewModalOpen && (
                <Modal centered close={() => setViewModalOpen(false)}>
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
    )
}

export default SpacePagePostsHeader