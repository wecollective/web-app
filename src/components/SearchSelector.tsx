import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import styles from '@styles/components/SearchSelector.module.scss'
import React, { useState } from 'react'

// general purpose search selector:
// • text input fires onSearchQuery function
// • results fed back into option list via options prop
// • clicking an option passes the option to onOptionSelected function

function SearchSelector(props: {
    type: 'space' | 'user'
    title?: string
    placeholder?: string
    style?: any
    disabled?: boolean
    state?: 'default' | 'valid' | 'invalid'
    errors?: string[]
    options: any[]
    loading?: boolean
    onSearchQuery: (payload: string) => void
    onOptionSelected: (payload: any) => void
    onBlur?: () => void
}): JSX.Element {
    const {
        type,
        title,
        placeholder,
        style,
        disabled,
        state,
        errors,
        options,
        loading,
        onSearchQuery,
        onOptionSelected,
        onBlur,
    } = props
    const [inputValue, setInputValue] = useState('')

    function handleSearchQuery(query) {
        setInputValue(query)
        onSearchQuery(query)
    }

    function selectOption(option) {
        onOptionSelected(option)
        setInputValue('')
    }

    return (
        <div className={styles.wrapper} style={style}>
            <Input
                type='text'
                title={title}
                placeholder={placeholder}
                disabled={disabled}
                state={state || 'default'}
                errors={errors}
                loading={loading}
                value={inputValue}
                onChange={(newValue) => handleSearchQuery(newValue)}
                onBlur={onBlur}
            />
            {options.length > 0 && (
                <div className={styles.dropDown}>
                    {options.map((option) => (
                        <ImageTitle
                            key={option.handle}
                            type={type}
                            imagePath={option.flagImagePath}
                            title={`${option.name} (${option.handle})`}
                            onClick={() => selectOption(option)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

SearchSelector.defaultProps = {
    title: null,
    placeholder: null,
    style: null,
    disabled: false,
    state: 'default',
    errors: null,
    loading: false,
    onBlur: null,
}

export default SearchSelector
