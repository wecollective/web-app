import Toggle from '@components/Toggle'
import Modal from '@components/modals/Modal'
import { SpaceContext } from '@contexts/SpaceContext'
import { getParamString } from '@src/Helpers'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function SpacePostLenses(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { spacePostsFilters } = useContext(SpaceContext)
    const [params, setParams] = useState({ ...spacePostsFilters })
    const location = useLocation()
    const history = useNavigate()

    useEffect(() => {
        // map url params onto spacePostsFilters in space context
        const urlParams = Object.fromEntries(new URLSearchParams(location.search))
        const newParams = { ...spacePostsFilters }
        Object.keys(urlParams).forEach((param) => {
            newParams[param] = urlParams[param]
        })
        setParams(newParams)
    }, [])

    return (
        <Modal centerX centerY close={close}>
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
                    close()
                }}
            />
        </Modal>
    )
}

export default SpacePostLenses
