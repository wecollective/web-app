import LoadingWheel from '@components/LoadingWheel'
import { resizeTextArea } from '@src/Helpers'
import styles from '@styles/components/Input.module.scss'
import { DangerIcon, SuccessIcon } from '@svgs/all'
import React from 'react'

const Input = (props: {
    type: 'text' | 'number' | 'text-area' | 'password' | 'email'
    id?: string
    title?: string
    prefix?: string
    placeholder?: string
    state?: 'default' | 'valid' | 'invalid'
    errors?: string[]
    value?: string | number
    rows?: number
    style?: any
    disabled?: boolean
    loading?: boolean
    autoFill?: boolean
    onChange?: (payload: string) => void
}): JSX.Element => {
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
        style,
        disabled,
        loading,
        autoFill,
        onChange,
    } = props

    return (
        <div className={`${styles.wrapper} ${disabled && styles.disabled}`} style={style}>
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
                        disabled={disabled}
                        data-lpignore={!autoFill}
                    />
                ) : (
                    <input
                        id={id}
                        placeholder={placeholder}
                        type={type}
                        value={value}
                        onChange={(e) => onChange && onChange(e.target.value)}
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
    rows: null,
    style: null,
    disabled: false,
    loading: false,
    autoFill: false,
}

export default Input
