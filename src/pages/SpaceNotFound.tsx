import React from 'react'
import styles from '@styles/pages/PageNotFound.module.scss'

const SpaceNotFound = (): JSX.Element => {
    return (
        <div className={styles.wrapper}>
            <p>Sorry, this space does not exist... :_(</p>
        </div>
    )
}

export default SpaceNotFound
