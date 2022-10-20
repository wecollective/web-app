import Column from '@components/Column'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import styles from '@styles/pages/SpacePage/About.module.scss'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'

const Rooms = (): JSX.Element => {
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
                    <h2>Still to be developed...</h2>
                    <p>
                        This section will allow users to create and join live video chat rooms with
                        similar features to those devloped for Glass Bead Game posts.
                    </p>
                    <br />
                    <p>Estimate start date: Unknown</p>
                </Column>
            )}
        </Column>
    )
}

export default Rooms
