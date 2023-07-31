import LoadingWheel from '@components/LoadingWheel'
import styles from '@styles/components/Button.module.scss'
import React from 'react'

function Button(props: {
    text?: string
    icon?: JSX.Element
    color:
        | 'blue'
        | 'aqua'
        | 'red'
        | 'purple'
        | 'grey'
        | 'light-green'
        | 'gbg-black'
        | 'gbg-white'
        | 'aqua-gradient'
    size?: 'small' | 'medium' | 'medium-large' | 'large'
    style?: any
    disabled?: boolean
    loading?: boolean
    submit?: boolean
    onClick?: () => void
}): JSX.Element {
    const { text, icon, color, size, style, disabled, loading, submit, onClick } = props

    return (
        <button
            className={`${styles.button} ${styles[color]} ${styles[size || 'large']} ${
                (disabled || loading) && styles.disabled
            }`}
            style={style}
            type={submit ? 'submit' : 'button'}
            disabled={disabled || loading}
            onClick={onClick}
        >
            {!!icon && icon}
            {!!text && <p>{text}</p>}
            {loading && <LoadingWheel size={25} />}
        </button>
    )
}

Button.defaultProps = {
    text: null,
    icon: null,
    size: 'large',
    style: null,
    disabled: false,
    loading: false,
    submit: false,
    onClick: null,
}

export default Button
