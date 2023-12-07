import styles from '@styles/components/animations/RecordingIcon.module.scss'
import React from 'react'

function RecordingIcon(props: { size?: number; style?: any }): JSX.Element {
    const { size, style } = props
    return (
        <div className={styles.wrapper} style={{ width: size, height: size, ...style }}>
            <div className={styles.icon1} />
            <div className={styles.icon2} />
        </div>
    )
}

RecordingIcon.defaultProps = {
    size: 20,
    style: {},
}

export default RecordingIcon
