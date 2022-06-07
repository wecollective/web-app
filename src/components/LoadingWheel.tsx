import React from 'react'
import styles from '@styles/components/LoadingWheel.module.scss'
import { ReactComponent as LoadingWheelIconSVG } from '@svgs/spinner.svg'

const LoadingWheel = (props: { size?: number; style?: any }): JSX.Element => {
    const { size, style } = props
    return (
        <div className={styles.wrapper} style={{ width: size, height: size, ...style }}>
            <LoadingWheelIconSVG width={size} height={size} />
        </div>
    )
}

LoadingWheel.defaultProps = {
    size: 40,
    style: {},
}

export default LoadingWheel
