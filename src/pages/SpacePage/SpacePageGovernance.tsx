import Column from '@components/Column'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import styles from '@styles/pages/SpacePage/SpacePageGovernance.module.scss'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'

const SpacePageGovernance = (): JSX.Element => {
    const { spaceData, spaceNotFound } = useContext(SpaceContext)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {spaceData.handle !== spaceHandle ? (
                <p>Space data loading... </p>
            ) : (
                <Column className={styles.content}>
                    <h1>Still to be developed...</h1>
                    <p>
                        This section will contain polls and customisable governance modules to help
                        the community self govern.
                    </p>
                    <br />
                    <p>Estimate start date: Unknown</p>
                </Column>
            )}
        </Column>
    )
}

export default SpacePageGovernance
