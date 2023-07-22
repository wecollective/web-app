import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import { getParamString } from '@src/Helpers'
import styles from '@styles/components/modals/SpaceSpaceLenses.module.scss'
import { EyeIcon, SpaceCirclesIcon, SpaceListIcon, SpaceTreeIcon } from '@svgs/all'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function SpaceSpaceLenses(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { spaceSpacesFilters } = useContext(SpaceContext)
    const [params, setParams] = useState({ ...spaceSpacesFilters })
    const location = useLocation()
    const history = useNavigate()

    function changeLens(type) {
        history({
            pathname: location.pathname,
            search: getParamString(params, 'lens', type),
        })
        close()
    }

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
            <Row centerY className={styles.header}>
                <h1>Space Lenses</h1>
                <EyeIcon />
            </Row>

            <p>Choose how to display the spaces</p>
            <div className={styles.lensOptions}>
                <button
                    type='button'
                    onClick={() => changeLens('Tree')}
                    className={`${params.lens === 'Tree' && styles.selected}`}
                >
                    <SpaceTreeIcon />
                    <p>Tree</p>
                </button>
                <button
                    type='button'
                    onClick={() => changeLens('Circles')}
                    className={`${params.lens === 'Circles' && styles.selected}`}
                >
                    <SpaceCirclesIcon />
                    <p>Circles</p>
                </button>
                <button
                    type='button'
                    onClick={() => changeLens('List')}
                    className={`${params.lens === 'List' && styles.selected}`}
                >
                    <SpaceListIcon />
                    <p>List</p>
                </button>
            </div>
        </Modal>
    )
}

export default SpaceSpaceLenses
