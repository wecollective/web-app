import styles from '@styles/components/CheckBox.module.scss'
import { CheckIcon } from '@svgs/all'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'

function CheckBox(props: {
    name?: string
    text?: string
    checked?: boolean
    defaultChecked?: boolean
    onChange?: (checked: boolean) => void
    disabled?: boolean
    style?: any
}): JSX.Element {
    const { name, text, checked, defaultChecked, onChange, disabled, style } = props
    const id = uuidv4()
    return (
        <label
            htmlFor={id}
            className={`${styles.wrapper} ${disabled && styles.disabled}`}
            style={style}
        >
            <input
                type='checkbox'
                name={name}
                id={id}
                checked={checked}
                onChange={onChange && ((e) => onChange(e.target.checked))}
                disabled={disabled}
                defaultChecked={defaultChecked}
            />
            <div />
            <CheckIcon />
            {text && <p style={{ marginLeft: 5 }}>{text}</p>}
        </label>
    )
}

CheckBox.defaultProps = {
    name: null,
    text: null,
    checked: undefined,
    defaultChecked: undefined,
    onChange: null,
    disabled: false,
    style: null,
}

export default CheckBox
