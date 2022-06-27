import React, { useContext, useState } from 'react'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import SearchBar from '@components/SearchBar'
import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Row from '@components/Row'
import Modal from '@components/Modal'
import CreatePostModal from '@src/components/modals/CreatePostModal'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePagePostsHeader = (props: {
    filtersOpen: boolean
    setFiltersOpen: (payload: boolean) => void
    params: any
    applyParam: (param: string, value: string) => void
}): JSX.Element => {
    const { filtersOpen, setFiltersOpen, params, applyParam } = props
    const { loggedIn, setAlertModalOpen, setAlertMessage } = useContext(AccountContext)
    // const { spaceData } = useContext(SpaceContext)
    const [createPostModalType, setCreatePostModalType] = useState('Text')
    const [createPostModalOpen, setCreatePostModalOpen] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const mobileView = document.documentElement.clientWidth < 900

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
        <Row centerY centerX className={styles.wrapper}>
            <Button
                // icon={mobileView ? <PlusIconSVG /> : undefined}
                // text={mobileView ? '' : 'New post'}
                text='New post'
                color='blue'
                onClick={() => openCreatePostModal('Text')}
                style={{ marginRight: 10 }}
            />
            {/* {spaceData.HolonHandles.map((h) => h.handle).includes('castalia') && (
                <Button
                    text='New game'
                    color='purple'
                    onClick={() => openCreatePostModal('Glass Bead Game')}
                    style={{ marginRight: 10 }}
                />
            )} */}
            <SearchBar
                setSearchFilter={(value) => applyParam('searchQuery', value)}
                placeholder='Search posts...'
                style={{ width: 250, marginRight: 10 }}
            />
            <Button
                icon={<SlidersIconSVG />}
                text={mobileView ? '' : 'Filters'}
                color='aqua'
                style={{ marginRight: 10 }}
                onClick={() => setFiltersOpen(!filtersOpen)}
            />
            <Button
                icon={<EyeIconSVG />}
                text={mobileView ? '' : 'View'}
                color='purple'
                onClick={() => setViewModalOpen(true)}
            />
            {createPostModalOpen && (
                <CreatePostModal
                    initialType={createPostModalType}
                    close={() => setCreatePostModalOpen(false)}
                />
            )}
            {viewModalOpen && (
                <Modal centered close={() => setViewModalOpen(false)}>
                    <h1>Views</h1>
                    <p>Choose how to display the posts</p>
                    <Toggle
                        leftText='List'
                        rightText='Map'
                        positionLeft={params.view === 'List'}
                        onClick={() => applyParam('view', params.view === 'Map' ? 'List' : 'Map')}
                    />
                </Modal>
            )}
        </Row>
    )
}

export default SpacePagePostsHeader
