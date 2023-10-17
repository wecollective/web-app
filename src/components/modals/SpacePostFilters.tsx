import Button from '@components/Button'
import DropDown from '@components/DropDown'
import Modal from '@components/modals/Modal'
import { SpaceContext } from '@contexts/SpaceContext'
import { getParamString } from '@src/Helpers'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function SpacePostFilters(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { postFilters } = useContext(SpaceContext)
    const [params, setParams] = useState({ ...postFilters })
    const location = useLocation()
    const history = useNavigate()

    useEffect(() => {
        // map url params onto spacePostsFilters in space context
        const urlParams = Object.fromEntries(new URLSearchParams(location.search))
        const newParams = { ...postFilters }
        Object.keys(urlParams).forEach((param) => {
            newParams[param] = urlParams[param]
        })
        setParams(newParams)
    }, [])

    return (
        <Modal centerX centerY close={close}>
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
                selectedOption={params.type}
                setSelectedOption={(option) => setParams({ ...params, type: option })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title={params.lens === 'Map' ? 'Size By' : 'Sort By'}
                options={[
                    'Recent Activity',
                    'Date Created',
                    'Likes',
                    'Comments',
                    'Reposts',
                    'Signal',
                    'Links',
                ]}
                selectedOption={params.sortBy}
                setSelectedOption={(option) => setParams({ ...params, sortBy: option })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title={params.lens === 'Map' ? 'Size Order' : 'Sort Order'}
                options={['Descending', 'Ascending']}
                selectedOption={params.sortOrder}
                setSelectedOption={(option) => setParams({ ...params, sortOrder: option })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title='Time Range'
                options={['All Time', 'This Year', 'This Month', 'This Week', 'Today', 'This Hour']}
                selectedOption={params.timeRange}
                setSelectedOption={(option) => setParams({ ...params, timeRange: option })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title='Depth'
                options={['All Contained Posts', 'Only Direct Posts']}
                selectedOption={params.depth}
                setSelectedOption={(option) => setParams({ ...params, depth: option })}
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

export default SpacePostFilters
