import styles from '@styles/components/CheckBox.module.scss'
import { ReactComponent as CheckIcon } from '@svgs/check-solid.svg'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'

const CheckBox = (props: {
    text: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    style?: any
}): JSX.Element => {
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
            <p>{text}</p>
        </label>
    )
}

CheckBox.defaultProps = {
    disabled: false,
    style: null,
}

export default CheckBox
