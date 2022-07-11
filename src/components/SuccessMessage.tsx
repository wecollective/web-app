import styles from '@styles/components/SuccessMessage.module.scss'
import { ReactComponent as SuccessIconSVG } from '@svgs/check-circle-solid.svg'
import React from 'react'

const SuccessMessage = (props: { text: string }): JSX.Element => {
    const { text } = props
    return (
        <div className={styles.wrapper}>
            <SuccessIconSVG />
            <h3>{text}</h3>
        </div>
    )
}

export default SuccessMessage
