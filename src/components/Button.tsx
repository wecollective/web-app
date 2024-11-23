import LoadingWheel from '@components/animations/LoadingWheel'
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
        | 'game-black'
        | 'game-white'
        | 'aqua-gradient'
    size?: 'small' | 'medium' | 'medium-large' | 'large'
    style?: any
    disabled?: boolean
    loading?: boolean
    submit?: boolean
    onClick?: (() => void) | null
}): JSX.Element {
    const { text, icon, color, size, style, disabled, loading, submit, onClick } = props
    const isDisabled = disabled || loading || onClick === null
    if (text === 'Add Step') {
        console.log(disabled, loading, onClick, isDisabled)
    }

    return (
        <button
            className={`${styles.button} ${styles[color]} ${styles[size || 'large']} ${
                isDisabled && styles.disabled
            }`}
            style={style}
            type={submit ? 'submit' : 'button'}
            disabled={isDisabled}
            onClick={onClick ?? undefined}
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
    onClick: undefined,
}

export default Button
