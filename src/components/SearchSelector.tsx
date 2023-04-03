import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import styles from '@styles/components/SearchSelector.module.scss'
import React, { useState } from 'react'
// import Row from '@components/Row'

// general purpose search selector:
// • text input fires onSearchQuery function
// • results fed back into option list via options prop
// • clicking an option passes the option to onOptionSelected function

// todo: add selectedOptions array and allowMultiple boolean?

function SearchSelector(props: {
    type: 'space' | 'user' | 'topic'
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
    // selectedOptions: any[]
    // allowMultiple: boolean
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
            />
            {options.length > 0 && (
                <div className={styles.dropDown}>
                    {type === 'topic'
                        ? options.map((option) => (
                              <ImageTitle
                                  key={option.handle}
                                  type='space'
                                  imagePath={option.imagePath}
                                  title={option.name}
                                  onClick={() => selectOption(option)}
                              />
                          ))
                        : options.map((option) => (
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
}

export default SearchSelector
