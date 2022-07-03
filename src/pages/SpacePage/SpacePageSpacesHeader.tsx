import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import { getParamString } from '@src/Helpers'
import SearchBar from '@components/SearchBar'
import DropDown from '@components/DropDown'
import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Row from '@components/Row'
import Modal from '@components/Modal'
import CreateSpaceModal from '@src/components/modals/CreateSpaceModal'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePageSpacesHeader = (props: { params: any }): JSX.Element => {
    const { params } = props
    const { loggedIn, setAlertModalOpen, setAlertMessage } = useContext(AccountContext)
    const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
    const [filtersModalOpen, setFiltersModalOpen] = useState(false)
    const [filterParams, setFilterParams] = useState(params)
    const [lensesModalOpen, setLensesModalOpen] = useState(false)
    const location = useLocation()
    const history = useHistory()
    const mobileView = document.documentElement.clientWidth < 900
    const smallMobileView = document.documentElement.clientWidth < 400

    function openCreateSpaceModal() {
        if (loggedIn) setCreateSpaceModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a space')
        }
    }

    useEffect(() => setFilterParams(params), [params])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Button
                icon={smallMobileView ? <PlusIconSVG /> : undefined}
                text={smallMobileView ? '' : 'New space'}
                color='blue'
                onClick={openCreateSpaceModal}
                style={{ marginRight: 10 }}
            />
            <SearchBar
                placeholder='Search spaces...'
                setSearchFilter={(value) => {
                    // toggle depth param for text searches so results from all levels included
                    const depth = value ? 'All Contained Spaces' : 'Only Direct Descendants'
                    params.depth = depth
                    setFilterParams({ ...filterParams, depth })
                    history.push({
                        pathname: location.pathname,
                        search: getParamString(params, 'searchQuery', value),
                    })
                }}
                style={{ marginRight: 10 }}
            />
            <Button
                icon={<SlidersIconSVG />}
                text={mobileView ? '' : 'Filters'}
                color='aqua'
                style={{ marginRight: 10 }}
                onClick={() => setFiltersModalOpen(true)}
            />
            <Button
                icon={<EyeIconSVG />}
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
                            'Date',
                            'Reactions',
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
                    <h1>Space Lenses</h1>
                    <p>Choose how to display the spaces</p>
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

export default SpacePageSpacesHeader
