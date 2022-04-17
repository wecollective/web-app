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
import CreateSpaceModal from '@src/components/modals/CreateSpaceModal'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePageSpacesHeader = (props: {
    filtersOpen: boolean
    setFiltersOpen: (payload: boolean) => void
    showSpaceList: boolean
    setShowSpaceList: (payload: boolean) => void
    showSpaceMap: boolean
    setShowSpaceMap: (payload: boolean) => void
}): JSX.Element => {
    const {
        filtersOpen,
        setFiltersOpen,
        showSpaceList,
        setShowSpaceList,
        showSpaceMap,
        setShowSpaceMap,
    } = props
    const { loggedIn, setAlertModalOpen, setAlertMessage } = useContext(AccountContext)
    const { updateSpaceSpacesFilter } = useContext(SpaceContext)
    const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const { innerWidth } = window

    function openCreateSpaceModal() {
        if (loggedIn) setCreateSpaceModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a space')
        }
    }

    return (
        <Row centerY className={styles.wrapper}>
            <Button
                text='New space'
                color='blue'
                onClick={openCreateSpaceModal}
                style={{ marginRight: 10 }}
            />
            {createSpaceModalOpen && (
                <CreateSpaceModal close={() => setCreateSpaceModalOpen(false)} />
            )}
            <SearchBar
                setSearchFilter={(payload) => updateSpaceSpacesFilter('searchQuery', payload)}
                placeholder='Search spaces...'
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
                    <p>Choose how to display the spaces</p>
                    {innerWidth > 1600 ? (
                        <Column centerX>
                            <Row style={{ marginBottom: 20 }}>
                                <Toggle
                                    leftText='List'
                                    rightColor='blue'
                                    positionLeft={!showSpaceList}
                                    onClick={() => setShowSpaceList(!showSpaceList)}
                                />
                            </Row>
                            <Row>
                                <Toggle
                                    leftText='Map'
                                    rightColor='blue'
                                    positionLeft={!showSpaceMap}
                                    onClick={() => setShowSpaceMap(!showSpaceMap)}
                                />
                            </Row>
                        </Column>
                    ) : (
                        <Row>
                            <Toggle
                                leftText='List'
                                rightText='Map'
                                positionLeft={showSpaceList}
                                onClick={() => {
                                    setShowSpaceList(!showSpaceList)
                                    setShowSpaceMap(!showSpaceMap)
                                }}
                            />
                        </Row>
                    )}
                </Modal>
            )}
        </Row>
    )
}

export default SpacePageSpacesHeader
