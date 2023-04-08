import Button from '@components/Button'
import DropDown from '@components/DropDown'
import CreateSpaceModal from '@components/modals/CreateSpaceModal'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { getParamString } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/Header.module.scss'
import {
    EyeIcon,
    PlusIcon,
    SlidersIcon,
    SpaceCirclesIcon,
    SpaceListIcon,
    SpaceTreeIcon,
} from '@svgs/all'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function SpacesHeader(props: { params: any }): JSX.Element {
    const { params } = props
    const { loggedIn, setAlertModalOpen, setAlertMessage } = useContext(AccountContext)
    const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const [lensesModalOpen, setLensesModalOpen] = useState(false)
    const location = useLocation()
    const history = useNavigate()
    const mobileView = document.documentElement.clientWidth < 900

    function openCreateSpaceModal() {
        if (loggedIn) setCreateSpaceModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a space')
        }
    }

    function changeLens(type) {
        history({
            pathname: location.pathname,
            search: getParamString(params, 'lens', type),
        })
        setLensesModalOpen(false)
    }

    useEffect(() => setFilterParams(params), [params])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Button
                icon={<PlusIcon />}
                text={mobileView ? '' : 'New space'}
                color='blue'
                onClick={openCreateSpaceModal}
                style={{ marginRight: 10 }}
            />
            <Button
                icon={<SlidersIcon />}
                text={mobileView ? '' : 'Filters'}
                color='aqua'
                style={{ marginRight: 10 }}
                onClick={() => setFiltersModalOpen(true)}
            />
            <Button
                icon={<EyeIcon />}
                text={mobileView ? '' : 'Lenses'}
                color='purple'
                onClick={() => setLensesModalOpen(true)}
            />
            {createSpaceModalOpen && (
                <CreateSpaceModal close={() => setCreateSpaceModalOpen(false)} />
            )}
            {filtersModalOpen && (
                <Modal centered close={() => setFiltersModalOpen(false)}>
                    <h1>Space Filters</h1>
                    <DropDown
                        title='Sort By'
                        options={[
                            'Followers',
                            'Posts',
                            'Comments',
                            'Date Created',
                            'Likes',
                            'Ratings',
                        ]}
                        selectedOption={filterParams.sortBy}
                        setSelectedOption={(value) =>
                            setFilterParams({ ...filterParams, sortBy: value })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title='Sort Order'
                        options={['Descending', 'Ascending']}
                        selectedOption={filterParams.sortOrder}
                        setSelectedOption={(value) =>
                            setFilterParams({ ...filterParams, sortOrder: value })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title='Time Range'
                        options={[
                            'All Time',
                            'Last Year',
                            'Last Month',
                            'Last Week',
                            'Last 24 Hours',
                            'Last Hour',
                        ]}
                        selectedOption={filterParams.timeRange}
                        setSelectedOption={(value) =>
                            setFilterParams({ ...filterParams, timeRange: value })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title='Depth'
                        options={['All Contained Spaces', 'Only Direct Descendants']}
                        selectedOption={filterParams.depth}
                        setSelectedOption={(value) =>
                            setFilterParams({ ...filterParams, depth: value })
                        }
                        style={{ marginBottom: 40 }}
                    />
                    <Button
                        text='Apply filters'
                        color='blue'
                        onClick={() => {
                            history({
                                pathname: location.pathname,
                                search: getParamString(filterParams),
                            })
                            setFiltersModalOpen(false)
                        }}
                    />
                </Modal>
            )}
            {lensesModalOpen && (
                <Modal centered close={() => setLensesModalOpen(false)}>
                    <Row centerY className={styles.header}>
                        <h1>Space Lenses</h1>
                        <EyeIcon />
                    </Row>

                    <p>Choose how to display the spaces</p>
                    <div className={styles.lensOptions}>
                        <button
                            type='button'
                            onClick={() => changeLens('Circles')}
                            className={`${params.lens === 'Circles' && styles.selected}`}
                        >
                            <SpaceCirclesIcon />
                            <p>Circles</p>
                        </button>
                        <button
                            type='button'
                            onClick={() => changeLens('Tree')}
                            className={`${params.lens === 'Tree' && styles.selected}`}
                        >
                            <SpaceTreeIcon />
                            <p>Tree</p>
                        </button>
                        <button
                            type='button'
                            onClick={() => changeLens('List')}
                            className={`${params.lens === 'List' && styles.selected}`}
                        >
                            <SpaceListIcon />
                            <p>List</p>
                        </button>
                    </div>
                </Modal>
            )}
        </Row>
    )
}

export default SpacesHeader
