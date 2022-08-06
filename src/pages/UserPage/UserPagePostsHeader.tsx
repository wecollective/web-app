import DropDown from '@components/DropDown'
import SearchBar from '@components/SearchBar'
import { getParamString } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import React, { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
// import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Modal from '@components/Modal'
import Row from '@components/Row'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
// import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const UserPagePostsHeader = (props: { params: any }): JSX.Element => {
    const { params } = props
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const location = useLocation()
    const history = useHistory()
    const mobileView = document.documentElement.clientWidth < 900
    const smallMobileView = document.documentElement.clientWidth < 400

    useEffect(() => setFilterParams(params), [params])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <SearchBar
                placeholder={smallMobileView ? 'Search...' : 'Search posts...'}
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
                style={{ marginRight: 10 }}
                onClick={() => setFiltersModalOpen(true)}
            />
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
                            'Inquiry',
                            'Glass Bead Game',
                            'String',
                            'Weave',
                            'Prism',
                        ]}
                        selectedOption={filterParams.type}
                        setSelectedOption={(value) =>
                            setFilterParams({ ...filterParams, type: value })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title={filterParams.view === 'Map' ? 'Size By' : 'Sort By'}
                        options={['Reactions', 'Likes', 'Reposts', 'Ratings', 'Comments', 'Date']}
                        selectedOption={filterParams.sortBy}
                        setSelectedOption={(value) =>
                            setFilterParams({ ...filterParams, sortBy: value })
                        }
                        style={{ marginBottom: 20 }}
                    />
                    <DropDown
                        title={filterParams.view === 'Map' ? 'Size Order' : 'Sort Order'}
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
            {/* <Button
                icon={<EyeIconSVG />}
                text='View'
                color='purple'
                onClick={() => setViewModalOpen(true)}
            />
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
            )} */}
        </Row>
    )
}

export default UserPagePostsHeader
