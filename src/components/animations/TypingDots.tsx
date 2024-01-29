import styles from '@styles/components/animations/TypingDots.module.scss'
import React from 'react'
import Row from '@components/Row'

function TypingDots(props: { size?: number; style?: any }): JSX.Element {
    const { size, style } = props
    return (
        <Row className={styles.wrapper} style={style}>
            <div className={styles.dot1} />
            <div className={styles.dot2} />
            <div className={styles.dot3} />
        </Row>
    )
}

TypingDots.defaultProps = {
    size: 20,
    style: {},
}

export default TypingDots
