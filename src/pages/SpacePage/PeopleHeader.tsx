import Button from '@components/Button'
import DropDown from '@components/DropDown'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import { getParamString } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/Header.module.scss'
import { SlidersIcon } from '@svgs/all'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function PeopleHeader(props: { params: any }): JSX.Element {
    const { params } = props
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const location = useLocation()
    const history = useNavigate()
    const mobileView = document.documentElement.clientWidth < 900

    useEffect(() => setFilterParams(params), [params])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Button
                icon={<SlidersIcon />}
                text={mobileView ? '' : 'Filters'}
                color='aqua'
                onClick={() => setFiltersModalOpen(true)}
            />
            {filtersModalOpen && (
                <Modal centerX close={() => setFiltersModalOpen(false)}>
                    <h1>People Filters</h1>
                    <DropDown
                        title='Sort By'
                        options={['Posts', 'Comments', 'Date Created']}
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
                            history({
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

export default PeopleHeader
