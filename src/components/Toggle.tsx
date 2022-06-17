import React, { useState } from 'react'
import styles from '@styles/components/Toggle.module.scss'
import Row from '@components/Row'

const Toggle = (props: {
    leftText?: string
    rightText?: string
    leftColor?: 'blue' | 'red'
    rightColor?: 'blue' | 'red'
    positionLeft?: boolean
    onClick: () => void
    style?: any
}): JSX.Element => {
    const { leftText, rightText, leftColor, rightColor, positionLeft, onClick, style } = props
    const [toggleLeft, setToggleLeft] = useState(positionLeft)

    function handleClick() {
        setToggleLeft(!toggleLeft)
        onClick()
    }

    return (
        <button type='button' className={styles.wrapper} onClick={handleClick} style={style}>
            <p>{leftText}</p>
            <Row
                className={`${styles.toggle} ${
                    toggleLeft ? styles[leftColor || ''] : styles[rightColor || '']
                }`}
            >
                <div className={`${styles.toggleButton} ${toggleLeft && styles.toggleLeft}`} />
            </Row>
            <p>{rightText}</p>
        </button>
    )
}

Toggle.defaultProps = {
    leftText: null,
    rightText: null,
    leftColor: null,
    rightColor: null,
    positionLeft: true,
    style: null,
}

export default Toggle
