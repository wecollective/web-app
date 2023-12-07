import styles from '@styles/components/animations/LoadingWheel.module.scss'
import { LoadingWheelIcon } from '@svgs/all'
import React from 'react'

function LoadingWheel(props: { size?: number; style?: any }): JSX.Element {
    const { size, style } = props
    return (
        <div className={styles.wrapper} style={{ width: size, height: size, ...style }}>
            <LoadingWheelIcon width={size} height={size} />
        </div>
    )
}

LoadingWheel.defaultProps = {
    size: 40,
    style: {},
}

export default LoadingWheel
