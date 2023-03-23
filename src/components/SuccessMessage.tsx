import styles from '@styles/components/SuccessMessage.module.scss'
import { SuccessIcon } from '@svgs/all'
import React from 'react'

function SuccessMessage(props: { text: string }): JSX.Element {
    const { text } = props
    return (
        <div className={styles.wrapper}>
            <SuccessIcon />
            <h3>{text}</h3>
        </div>
    )
}

export default SuccessMessage
