import Row from '@components/Row'
import styles from '@styles/components/Toggle.module.scss'
import React, { useEffect, useState } from 'react'

function Toggle(props: {
    leftText?: string
    rightText?: string
    leftColor?: 'blue' | 'red'
    rightColor?: 'blue' | 'red'
    positionLeft?: boolean
    onOffText?: boolean
    onClick: () => void
    style?: any
}): JSX.Element {
    const { leftText, rightText, leftColor, rightColor, positionLeft, onOffText, style, onClick } =
        props
    const [toggleLeft, setToggleLeft] = useState(positionLeft)

    function handleClick() {
        setToggleLeft(!toggleLeft)
        onClick()
    }

    useEffect(() => setToggleLeft(positionLeft), [positionLeft])

    return (
        <button type='button' className={styles.wrapper} onClick={handleClick} style={style}>
            {leftText && <p className={styles.leftText}>{leftText}</p>}
            <Row
                className={`${styles.toggle} ${toggleLeft && styles.left} ${
                    toggleLeft ? styles[leftColor || ''] : styles[rightColor || '']
                }`}
            >
                <div className={styles.toggleButton} />
                {onOffText && <p>{toggleLeft ? 'OFF' : 'ON'}</p>}
            </Row>
            {rightText && <p className={styles.rightText}>{rightText}</p>}
        </button>
    )
}

Toggle.defaultProps = {
    leftText: null,
    rightText: null,
    leftColor: null,
    rightColor: null,
    positionLeft: true,
    onOffText: false,
    style: null,
}

export default Toggle
