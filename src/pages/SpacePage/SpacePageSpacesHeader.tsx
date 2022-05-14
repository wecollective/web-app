import React, { useContext, useState } from 'react'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import SearchBar from '@components/SearchBar'
import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Row from '@components/Row'
import Modal from '@components/Modal'
import CreateSpaceModal from '@src/components/modals/CreateSpaceModal'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePageSpacesHeader = (props: {
    filtersOpen: boolean
    setFiltersOpen: (payload: boolean) => void
    params: any
    applyParam: (param: string, value: string) => void
}): JSX.Element => {
    const { filtersOpen, setFiltersOpen, params, applyParam } = props
    const { loggedIn, setAlertModalOpen, setAlertMessage } = useContext(AccountContext)
    const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)

    function openCreateSpaceModal() {
        if (loggedIn) setCreateSpaceModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a space')
        }
    }

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Button
                text='New space'
                color='blue'
                onClick={openCreateSpaceModal}
                style={{ marginRight: 10 }}
            />
            <SearchBar
                setSearchFilter={(value) => applyParam('searchQuery', value)}
                placeholder='Search spaces...'
                style={{ marginRight: 10 }}
            />
            <Button
                icon={<SlidersIconSVG />}
                text='Filters'
                color='aqua'
                style={{ marginRight: 10 }}
                onClick={() => setFiltersOpen(!filtersOpen)}
            />
            <Button
                icon={<EyeIconSVG />}
                text='View'
                color='purple'
                onClick={() => setViewModalOpen(true)}
            />
            {createSpaceModalOpen && (
                <CreateSpaceModal close={() => setCreateSpaceModalOpen(false)} />
            )}
            {viewModalOpen && (
                <Modal centered close={() => setViewModalOpen(false)}>
                    <h1>Views</h1>
                    <p>Choose how to display the spaces</p>
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

export default SpacePageSpacesHeader
