import LoadingWheel from '@components/animations/LoadingWheel'
import { resizeTextArea } from '@src/Helpers'
import styles from '@styles/components/Input.module.scss'
import { DangerIcon, SuccessIcon } from '@svgs/all'
import React from 'react'

function Input(props: {
    type: 'text' | 'number' | 'text-area' | 'password' | 'email'
    id?: string
    name?: string
    title?: string
    prefix?: string
    placeholder?: string
    defaultValue?: string | number
    value?: string | number
    rows?: number
    maxLength?: number
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
        name,
        title,
        prefix,
        placeholder,
        state,
        errors,
        defaultValue,
        value,
        rows,
        maxLength,
        min,
        max,
        style,
        disabled,
        loading,
        autoFill,
        onChange,
        onBlur,
    } = props

    console.log(defaultValue, value)

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
                        name={name}
                        rows={rows}
                        placeholder={placeholder}
                        defaultValue={defaultValue}
                        value={value}
                        maxLength={maxLength}
                        onChange={(e) => {
                            onChange?.(e.target.value)
                            resizeTextArea(e.target)
                        }}
                        onBlur={onBlur}
                        disabled={disabled}
                        data-lpignore={!autoFill}
                    />
                ) : (
                    <input
                        id={id}
                        name={name}
                        placeholder={placeholder}
                        type={type}
                        defaultValue={defaultValue}
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...(value !== undefined && {
                            value,
                        })}
                        maxLength={maxLength}
                        min={min}
                        max={max}
                        onChange={(e) => {
                            const newValue = e.target.value
                            let validatedValue = type === 'number' ? +newValue : newValue
                            if (min && +newValue < min) validatedValue = min
                            if (max && +newValue > max) validatedValue = max
                            onChange?.(validatedValue)
                        }}
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
    name: null,
    prefix: null,
    placeholder: null,
    state: 'default',
    errors: null,
    value: undefined,
    defaultValue: undefined,
    onChange: undefined,
    onBlur: null,
    rows: null,
    maxLength: null,
    min: null,
    max: null,
    style: null,
    disabled: false,
    loading: false,
    autoFill: false,
}

export default Input
