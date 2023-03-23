import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import Row from '@components/Row'
import styles from '@styles/components/DropDown.module.scss'
import { CaretDownIcon } from '@svgs/all'
import React, { useState } from 'react'

function DropDown(props: {
    title: string
    options: any[]
    selectedOption: string | number
    setSelectedOption: any
    // orientation: string
    style?: any
}): JSX.Element {
    const { title, options, selectedOption, setSelectedOption, style } = props
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <Row centerY className={styles.wrapper} style={style}>
            <p className={styles.title}>{title}</p>
            <div className={styles.divider} />
            <div
                role='button'
                className={styles.selectedOption}
                onClick={() => setMenuOpen(!menuOpen)}
                onKeyDown={() => setMenuOpen(!menuOpen)}
                tabIndex={0}
            >
                <p>{selectedOption}</p>
                <CaretDownIcon />
                {menuOpen && (
                    <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                        <Column className={styles.options}>
                            {options.map((option) => (
                                <button
                                    className={styles.option}
                                    key={option}
                                    type='button'
                                    onClick={() => {
                                        setSelectedOption(option)
                                        setMenuOpen(false)
                                    }}
                                >
                                    <p>{option}</p>
                                </button>
                            ))}
                        </Column>
                    </CloseOnClickOutside>
                )}
            </div>
        </Row>
    )
}

DropDown.defaultProps = {
    style: null,
}

export default DropDown
