import { AccountContext } from '@contexts/AccountContext'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
// import { SpaceContext } from '@contexts/SpaceContext'
import Button from '@components/Button'
import DropDown from '@components/DropDown'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import Toggle from '@components/Toggle'
import { getParamString } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/Header.module.scss'
import { EyeIcon, PlusIcon, SlidersIcon } from '@svgs/all'

function PostsHeader(props: { params: any }): JSX.Element {
    const { params } = props
    const {
        loggedIn,
        setAlertModalOpen,
        setAlertMessage,
        // setCreatePostModalSettings,
        setCreatePostModalOpen,
    } = useContext(AccountContext)
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const [lensesModalOpen, setLensesModalOpen] = useState(false)
    const location = useLocation()
    const history = useNavigate()
    const mobileView = document.documentElement.clientWidth < 900
    const smallMobileView = document.documentElement.clientWidth < 400

    function openCreatePostModal() {
        if (loggedIn) {
            // setCreatePostModalSettings({ type: 'text' })
            setCreatePostModalOpen(true)
        } else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a post')
        }
    }

    useEffect(() => setFilterParams(params), [params])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Button
                icon={smallMobileView ? <PlusIcon /> : undefined}
                text={smallMobileView ? '' : 'New post'}
                color='blue'
                onClick={() => openCreatePostModal()}
                style={{ marginRight: 10 }}
            />
            {/* {spaceData.SpaceAncestors.map((h) => h.handle).includes('castalia') && (
                <Button
                    text='New game'
                    color='purple'
                    onClick={() => openCreatePostModal('Glass Bead Game')}
                    style={{ marginRight: 10 }}
                />
            )} */}
            <Button
                icon={<SlidersIcon />}
                text={mobileView ? '' : 'Filters'}
                color='aqua'
                onClick={() => setFiltersModalOpen(true)}
                style={{ marginRight: 10 }}
            />
            <Button
                icon={<EyeIcon />}
                text={mobileView ? '' : 'Lenses'}
                color='purple'
                onClick={() => setLensesModalOpen(true)}
            />
            {/* {createPostModalOpen && (
                <CreatePostModal
                    initialType={createPostModalSettings}
                    close={() => setCreatePostModalOpen(false)}
                />
            )} */}
            {filtersModalOpen && (
                <Modal centered close={() => setFiltersModalOpen(false)}>
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
                            // 'String',
                            // 'Weave',
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
                        options={['Date', 'Likes', 'Comments', 'Reposts', 'Ratings', 'Links']}
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
                <Modal centered close={() => setLensesModalOpen(false)}>
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
