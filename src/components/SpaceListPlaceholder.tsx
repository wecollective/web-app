import React from 'react'
import styles from '@styles/components/ListPlaceholder.module.scss'
import Column from '@components/Column'
import SpaceCardPlaceholder from '@components/cards/SpaceCardPlaceholder'

const SpaceListPlaceholder = (): JSX.Element => {
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
