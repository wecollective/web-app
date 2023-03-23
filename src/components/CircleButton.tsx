import LoadingWheel from '@components/LoadingWheel'
import styles from '@styles/components/CircleButton.module.scss'
import React, { useState } from 'react'

function Button(props: {
    icon?: JSX.Element
    size?: number
    style?: any
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
    children?: any
}): JSX.Element {
    const { icon, size, style, disabled, loading, onClick, children } = props
    const [mouseOver, setMouseOver] = useState(false)

    return (
        <div className={styles.wrapper}>
            <button
                className={`${styles.button} ${(disabled || loading) && styles.disabled}`}
                style={{ ...style, height: size, width: size }}
                type='button'
                disabled={disabled || loading}
                onClick={onClick}
                onMouseEnter={() => setMouseOver(true)}
                onMouseLeave={() => setMouseOver(false)}
            >
                {!!icon && icon}
                {loading && <LoadingWheel size={25} />}
                {mouseOver && children}
            </button>
        </div>
    )
}

Button.defaultProps = {
    icon: null,
    size: 30,
    style: null,
    disabled: false,
    loading: false,
    onClick: null,
    children: null,
}

export default Button
