import Button from '@components/Button'
import DropDown from '@components/DropDown'
import Modal from '@components/Modal'
import Row from '@components/Row'
import SearchBar from '@components/SearchBar'
import { getParamString } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import React, { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

const SpacePagePeopleHeader = (props: { params: any }): JSX.Element => {
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
                placeholder={smallMobileView ? 'Search...' : 'Search people...'}
                setSearchFilter={(value) =>
                    history.push({
                        pathname: location.pathname,
                        search: getParamString(params, 'searchQuery', value),
                    })
                }
                style={{ marginRight: 10 }}
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
                    <h1>People Filters</h1>
                    <DropDown
                        title='Sort By'
                        options={['Posts', 'Comments', 'Date']}
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
        </Row>
    )
}

export default SpacePagePeopleHeader
