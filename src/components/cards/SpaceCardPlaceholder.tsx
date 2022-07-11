import styles from '@styles/components/cards/SpaceCardPlaceholder.module.scss'
import React from 'react'

const SpaceCardPlaceholder = (): JSX.Element => {
    return (
        <div className={styles.PHHolon}>
            <div className='PHHolonShine' />
            <div className={styles.PHHolonImage} />
            <div className={styles.PHHolonInfo}>
                <div className={styles.PHHolonTitle} />
                <div className={styles.PHHolonDescription1} />
                <div className={styles.PHHolonDescription2} />
            </div>
        </div>
    )
}

export default SpaceCardPlaceholder
