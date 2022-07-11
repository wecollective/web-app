import styles from '@styles/pages/PageNotFound.module.scss'
import React from 'react'

const SpaceNotFound = (): JSX.Element => {
    return (
        <div className={styles.wrapper}>
            <p>Sorry, this space does not exist... :_(</p>
        </div>
    )
}

export default SpaceNotFound
