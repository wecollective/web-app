import styles from '@styles/pages/PageNotFound.module.scss'
import React from 'react'

function PageNotFound(): JSX.Element {
    return (
        <div className={styles.wrapper}>
            <p>Sorry, this page does not exist... :_(</p>
        </div>
    )
}

export default PageNotFound
