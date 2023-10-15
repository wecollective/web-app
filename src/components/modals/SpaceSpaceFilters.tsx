import Button from '@components/Button'
import DropDown from '@components/DropDown'
import Modal from '@components/modals/Modal'
import { SpaceContext } from '@contexts/SpaceContext'
import { getParamString } from '@src/Helpers'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function SpaceSpaceFilters(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { spaceSpacesFilters } = useContext(SpaceContext)
    const [params, setParams] = useState({ ...spaceSpacesFilters })
    const location = useLocation()
    const history = useNavigate()

    useEffect(() => {
        // map url params onto spaceSpacesFilters in space context
        const urlParams = Object.fromEntries(new URLSearchParams(location.search))
        const newParams = { ...spaceSpacesFilters }
        Object.keys(urlParams).forEach((param) => {
            newParams[param] = urlParams[param]
        })
        setParams(newParams)
    }, [])

    return (
        <Modal centerX centerY close={close}>
            <h1>Space Filters</h1>
            <DropDown
                title='Sort By'
                options={['Likes', 'Posts', 'Comments', 'Followers', 'Date Created']}
                selectedOption={params.sortBy}
                setSelectedOption={(value) => setParams({ ...params, sortBy: value })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title='Sort Order'
                options={['Descending', 'Ascending']}
                selectedOption={params.sortOrder}
                setSelectedOption={(value) => setParams({ ...params, sortOrder: value })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title='Time Range'
                options={['All Time', 'Last Year', 'Last Month', 'Last Week', 'Today', 'Last Hour']}
                selectedOption={params.timeRange}
                setSelectedOption={(value) => setParams({ ...params, timeRange: value })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title='Depth'
                options={['All Contained Spaces', 'Only Direct Descendants']}
                selectedOption={params.depth}
                setSelectedOption={(value) => setParams({ ...params, depth: value })}
                style={{ marginBottom: 40 }}
            />
            <Button
                text='Apply filters'
                color='blue'
                onClick={() => {
                    history({
                        pathname: location.pathname,
                        search: getParamString(params),
                    })
                    close()
                }}
            />
        </Modal>
    )
}

export default SpaceSpaceFilters
