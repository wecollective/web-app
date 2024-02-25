import styles from '@styles/components/PlainButton.module.scss'
import React, { MouseEvent } from 'react'

function PlainButton(props: {
    className?: string
    size: number
    onClick: (e: MouseEvent) => void
    style?: any
    children
}): JSX.Element {
    const { className, size, onClick, style, children } = props

    return (
        <button
            className={`${styles.plainButton} ${className}`}
            type='button'
            onClick={onClick}
            style={{ ...style, width: size, height: size }}
        >
            {children}
        </button>
    )
}

PlainButton.defaultProps = {
    className: '',
    style: null,
}

export default PlainButton
