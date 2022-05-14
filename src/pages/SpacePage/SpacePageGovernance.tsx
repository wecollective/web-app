import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageAbout.module.scss'
import Column from '@components/Column'
import SpaceNotFound from '@pages/SpaceNotFound'

const SpacePageGovernance = (): JSX.Element => {
    const { spaceData, spaceNotFound } = useContext(SpaceContext)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column className={styles.wrapper}>
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
