import React, { useContext, useState, useEffect } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
// import { SpaceContext } from '@contexts/SpaceContext'
import { getParamString } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import DropDown from '@components/DropDown'
import SearchBar from '@components/SearchBar'
import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Row from '@components/Row'
import Modal from '@components/Modal'
import CreatePostModal from '@src/components/modals/CreatePostModal'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePagePostsHeader = (props: { params: any }): JSX.Element => {
    const { params } = props
    const { loggedIn, setAlertModalOpen, setAlertMessage } = useContext(AccountContext)
    // const { spaceData } = useContext(SpaceContext)
    const [createPostModalType, setCreatePostModalType] = useState('Text')
    const [createPostModalOpen, setCreatePostModalOpen] = useState(false)
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const [lensesModalOpen, setLensesModalOpen] = useState(false)
    const location = useLocation()
    const history = useHistory()
    const mobileView = document.documentElement.clientWidth < 900
    const smallMobileView = document.documentElement.clientWidth < 400

    function openCreatePostModal(type) {
        if (loggedIn) {
            setCreatePostModalType(type)
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
                icon={smallMobileView ? <PlusIconSVG /> : undefined}
                text={smallMobileView ? '' : 'New post'}
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
                placeholder='Search posts...'
                setSearchFilter={(value) =>
                    history.push({
                        pathname: location.pathname,
                        search: getParamString(params, 'searchQuery', value),
                    })
                }
                style={{ width: 250, marginRight: 10 }}
            />
            <Button
                icon={<SlidersIconSVG />}
                text={mobileView ? '' : 'Filters'}
                color='aqua'
                onClick={() => setFiltersModalOpen(true)}
                style={{ marginRight: 10 }}
            />
            <Button
                icon={<EyeIconSVG />}
                text={mobileView ? '' : 'Lenses'}
                color='purple'
                onClick={() => setLensesModalOpen(true)}
            />
            {createPostModalOpen && (
                <CreatePostModal
                    initialType={createPostModalType}
                    close={() => setCreatePostModalOpen(false)}
                />
            )}
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
                            'Glass Bead Game',
                            'String',
                            'Weave',
                            'Prism',
                        ]}
                        selectedOption={filterParams.type}
                        setSelectedOption={(payload) =>
                            setFilterParams({ ...filterParams, type: payload })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title={filterParams.view === 'Map' ? 'Size By' : 'Sort By'}
                        options={['Likes', 'Comments', 'Reposts', 'Ratings', 'Date']}
                        selectedOption={filterParams.sortBy}
                        setSelectedOption={(payload) =>
                            setFilterParams({ ...filterParams, sortBy: payload })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title={filterParams.view === 'Map' ? 'Size Order' : 'Sort Order'}
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
                            history.push({
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
                        positionLeft={params.view === 'List'}
                        onClick={() => {
                            history.push({
                                pathname: location.pathname,
                                search: getParamString(
                                    params,
                                    'view',
                                    params.view === 'Map' ? 'List' : 'Map'
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

export default SpacePagePostsHeader
