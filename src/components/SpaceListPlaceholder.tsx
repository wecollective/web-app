import SpaceCardPlaceholder from '@components/cards/SpaceCardPlaceholder'
import Column from '@components/Column'
import styles from '@styles/components/ListPlaceholder.module.scss'
import React from 'react'

function SpaceListPlaceholder(): JSX.Element {
    return (
        <Column>
            <div className={styles.gradient} />
            <SpaceCardPlaceholder />
            <SpaceCardPlaceholder />
            <SpaceCardPlaceholder />
            <SpaceCardPlaceholder />
            <SpaceCardPlaceholder />
        </Column>
    )
}

export default SpaceListPlaceholder
