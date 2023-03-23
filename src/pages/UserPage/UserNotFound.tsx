import styles from '@styles/pages/PageNotFound.module.scss'
import React from 'react'

function UserNotFound(): JSX.Element {
    return (
        <div className={styles.wrapper}>
            <p>Sorry, this user does not exist... :_(</p>
        </div>
    )
}

export default UserNotFound
