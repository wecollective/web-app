import styles from '@styles/components/PlainButton.module.scss'
import React from 'react'

function PlainButton(props: {
    size: number
    onClick: () => void
    style?: any
    children
}): JSX.Element {
    const { size, onClick, style, children } = props

    return (
        <button
            className={styles.plainButton}
            type='button'
            onClick={onClick}
            style={{ ...style, width: size, height: size }}
        >
            {children}
        </button>
    )
}

PlainButton.defaultProps = {
    style: null,
}

export default PlainButton
