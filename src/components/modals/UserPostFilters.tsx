import Button from '@components/Button'
import DropDown from '@components/DropDown'
import Modal from '@components/modals/Modal'
import { UserContext } from '@contexts/UserContext'
import { getParamString } from '@src/Helpers'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function UserPostFilters(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { userPostsFilters } = useContext(UserContext)
    const [params, setParams] = useState({ ...userPostsFilters })
    const location = useLocation()
    const history = useNavigate()

    useEffect(() => {
        // map url params onto userPostsFilters in space context
        const urlParams = Object.fromEntries(new URLSearchParams(location.search))
        const newParams = { ...userPostsFilters }
        Object.keys(urlParams).forEach((param) => {
            newParams[param] = urlParams[param]
        })
        setParams(newParams)
    }, [])

    return (
        <Modal centerX close={close}>
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
                setSelectedOption={(value) => setParams({ ...params, type: value })}
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
                setSelectedOption={(value) => setParams({ ...params, sortBy: value })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title={params.lens === 'Map' ? 'Size Order' : 'Sort Order'}
                options={['Descending', 'Ascending']}
                selectedOption={params.sortOrder}
                setSelectedOption={(value) => setParams({ ...params, sortOrder: value })}
                style={{ marginBottom: 20 }}
            />
            <DropDown
                title='Time Range'
                options={['All Time', 'This Year', 'This Month', 'This Week', 'Today', 'This Hour']}
                selectedOption={params.timeRange}
                setSelectedOption={(value) => setParams({ ...params, timeRange: value })}
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

export default UserPostFilters
