import styles from '@styles/components/CheckBox.module.scss'
import { CheckIcon } from '@svgs/all'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'

function CheckBox(props: {
    text?: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    style?: any
}): JSX.Element {
    const { text, checked, onChange, disabled, style } = props
    const id = uuidv4()
    return (
        <label
            htmlFor={id}
            className={`${styles.wrapper} ${disabled && styles.disabled}`}
            style={style}
        >
            <input
                type='checkbox'
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <div />
            <CheckIcon />
            {text && <p>{text}</p>}
        </label>
    )
}

CheckBox.defaultProps = {
    text: null,
    disabled: false,
    style: null,
}

export default CheckBox
