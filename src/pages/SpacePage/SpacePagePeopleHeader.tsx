import React, { useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import { getParamString } from '@src/Helpers'
import SearchBar from '@components/SearchBar'
import DropDown from '@components/DropDown'
import Button from '@components/Button'
import Row from '@components/Row'
import Modal from '@components/Modal'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'

const SpacePagePeopleHeader = (props: { params: any }): JSX.Element => {
    const { params } = props
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const location = useLocation()
    const history = useHistory()

    return (
        <Row centerY centerX className={styles.wrapper}>
            <SearchBar
                setSearchFilter={(value) =>
                    history.push({
                        pathname: location.pathname,
                        search: getParamString(params, 'searchQuery', value),
                    })
                }
                placeholder='Search people...'
                style={{ marginRight: 10 }}
            />
            <Button
                icon={<SlidersIconSVG />}
                text='Filters'
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
