import LoadingWheel from '@components/LoadingWheel'
import { resizeTextArea } from '@src/Helpers'
import styles from '@styles/components/Input.module.scss'
import { DangerIcon, SuccessIcon } from '@svgs/all'
import React from 'react'

function Input(props: {
    type: 'text' | 'number' | 'text-area' | 'password' | 'email'
    id?: string
    title?: string
    prefix?: string
    placeholder?: string
    value?: string | number
    rows?: number
    min?: number
    max?: number
    disabled?: boolean
    loading?: boolean
    autoFill?: boolean
    state?: 'default' | 'valid' | 'invalid'
    errors?: string[]
    style?: any
    onChange?: (payload: any) => void
    onBlur?: () => void
}): JSX.Element {
    const {
        type,
        id,
        title,
        prefix,
        placeholder,
        state,
        errors,
        value,
        rows,
        min,
        max,
        style,
        disabled,
        loading,
        autoFill,
        onChange,
        onBlur,
    } = props

    function handleChange(newValue) {
        let validatedValue = type === 'number' ? +newValue : newValue
        if (min && +newValue < min) validatedValue = min
        if (max && +newValue > max) validatedValue = max
        if (onChange) onChange(validatedValue)
    }

    return (
        <div
            className={`${styles.wrapper} ${styles[type]} ${disabled && styles.disabled}`}
            style={style}
        >
            {title && <h1>{title}</h1>}
            {state === 'invalid' && errors && errors.map((error) => <h2 key={error}>{error}</h2>)}
            <div className={`${styles.inputWrapper} ${styles[state || 'default']}`}>
                {prefix && <span>{prefix}</span>}
                {type === 'text-area' ? (
                    <textarea
                        id={id}
                        rows={rows}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => {
                            if (onChange) onChange(e.target.value)
                            resizeTextArea(e.target)
                        }}
                        onBlur={onBlur}
                        disabled={disabled}
                        data-lpignore={!autoFill}
                    />
                ) : (
                    <input
                        id={id}
                        placeholder={placeholder}
                        type={type}
                        value={value}
                        min={min}
                        max={max}
                        onChange={(e) => handleChange(e.target.value)}
                        onBlur={onBlur}
                        disabled={disabled}
                        data-lpignore={!autoFill}
                    />
                )}
                <div className={styles.stateIcon}>
                    {state === 'invalid' && <DangerIcon />}
                    {state === 'valid' && <SuccessIcon />}
                    {loading && <LoadingWheel size={30} style={{ marginTop: -5 }} />}
                </div>
            </div>
        </div>
    )
}

Input.defaultProps = {
    title: null,
    id: null,
    prefix: null,
    placeholder: null,
    state: 'default',
    errors: null,
    value: '',
    onChange: null,
    onBlur: null,
    rows: null,
    min: null,
    max: null,
    style: null,
    disabled: false,
    loading: false,
    autoFill: false,
}

export default Input
