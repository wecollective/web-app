import Button from '@components/Button'
import DropDown from '@components/DropDown'
import Row from '@components/Row'
import Toggle from '@components/Toggle'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { getParamString } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/Header.module.scss'
import { EyeIcon, PlusIcon, SlidersIcon } from '@svgs/all'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function PostsHeader(props: { params: any }): JSX.Element {
    const { params } = props
    const { loggedIn, setAlertModalOpen, setAlertMessage, setCreatePostModalOpen } =
        useContext(AccountContext)
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const [lensesModalOpen, setLensesModalOpen] = useState(false)
    const location = useLocation()
    const history = useNavigate()
    const mobileView = document.documentElement.clientWidth < 900

    function openCreatePostModal() {
        if (loggedIn) setCreatePostModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a post')
        }
    }

    useEffect(() => setFilterParams(params), [params])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Button
                icon={<PlusIcon />}
                text={mobileView ? '' : 'New post'}
                color='blue'
                onClick={openCreatePostModal}
            />
            <Button
                icon={<SlidersIcon />}
                text={mobileView ? '' : 'Filters'}
                color='aqua'
                onClick={() => setFiltersModalOpen(true)}
            />
            <Button
                icon={<EyeIcon />}
                text={mobileView ? '' : 'Lenses'}
                color='purple'
                onClick={() => setLensesModalOpen(true)}
            />
            {filtersModalOpen && (
                <Modal centerX centerY close={() => setFiltersModalOpen(false)}>
                    <h1>Post Filters</h1>
                    <DropDown
                        title='Post Type'
                        options={[
                            'All Types',
                            'Text',
                            'Image',
                            'Url',
                            'Audio',
                            'Event',
                            'Poll',
                            'Glass Bead Game',
                            'Card',
                            // 'Prism',
                        ]}
                        selectedOption={filterParams.type}
                        setSelectedOption={(payload) =>
                            setFilterParams({ ...filterParams, type: payload })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title={filterParams.lens === 'Map' ? 'Size By' : 'Sort By'}
                        options={[
                            'Recent Activity',
                            'Date Created',
                            'Likes',
                            'Comments',
                            'Reposts',
                            'Ratings',
                            'Links',
                        ]}
                        selectedOption={filterParams.sortBy}
                        setSelectedOption={(payload) =>
                            setFilterParams({ ...filterParams, sortBy: payload })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title={filterParams.lens === 'Map' ? 'Size Order' : 'Sort Order'}
                        options={['Descending', 'Ascending']}
                        selectedOption={filterParams.sortOrder}
                        setSelectedOption={(payload) =>
                            setFilterParams({ ...filterParams, sortOrder: payload })
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
                        setSelectedOption={(payload) =>
                            setFilterParams({ ...filterParams, timeRange: payload })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title='Depth'
                        options={['All Contained Posts', 'Only Direct Posts']}
                        selectedOption={filterParams.depth}
                        setSelectedOption={(payload) =>
                            setFilterParams({ ...filterParams, depth: payload })
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
                <Modal centerX centerY close={() => setLensesModalOpen(false)}>
                    <h1>Post Lenses</h1>
                    <p>Choose how to display the posts</p>
                    <Toggle
                        leftText='List'
                        rightText='Map'
                        positionLeft={params.lens === 'List'}
                        onClick={() => {
                            history({
                                pathname: location.pathname,
                                search: getParamString(
                                    params,
                                    'lens',
                                    params.lens === 'Map' ? 'List' : 'Map'
                                ),
                            })
                            setLensesModalOpen(false)
                        }}
                    />
                </Modal>
            )}
        </Row>
    )
}

export default PostsHeader

/* {spaceData.SpaceAncestors.map((h) => h.handle).includes('castalia') && (
    <Button
        text='New game'
        color='purple'
        onClick={() => openCreatePostModal('Glass Bead Game')}
        style={{ marginRight: 10 }}
    />
)} */
