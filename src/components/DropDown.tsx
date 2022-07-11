import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import Row from '@components/Row'
import styles from '@styles/components/DropDown.module.scss'
import { ReactComponent as CaretDownIconSVG } from '@svgs/caret-down-solid.svg'
import React, { useState } from 'react'

const DropDown = (props: {
    title: string
    options: any[]
    selectedOption: string | number
    setSelectedOption: any
    // orientation: string
    style?: any
}): JSX.Element => {
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
                <CaretDownIconSVG />
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
            {/* {menuOpen && (
                <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                    <Column className={styles.options}>
                        {options.map((option) => (
                            <button
                                type='button'
                                className={styles.option}
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
            )} */}
            {/* <p>{title}</p>
            <div className={styles.divider} />
            <p>{selectedOption}</p> */}

            {/* <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                <div className={styles.dropDown}>
                    <div
                        className={styles.selectedOption}
                        role='button'
                        tabIndex={0}
                        onClick={() => setMenuOpen(!menuOpen)}
                        onKeyDown={() => setMenuOpen(!menuOpen)}
                    >
                        {selectedOption}
                        <img
                            className={styles.icon}
                            src='/icons/sort-down-solid.svg'
                            aria-label='drop-down'
                        />
                    </div>
                    <div
                        className={`${styles.options} ${menuOpen && styles.visible} ${
                            orientation === 'horizontal' && styles.horizontal
                        }`}
                    >
                        {options.map((option) => (
                            <div
                                className={styles.option}
                                key={option}
                                role='button'
                                tabIndex={0}
                                onClick={() => {
                                    setSelectedOption(option)
                                    setMenuOpen(false)
                                }}
                                onKeyDown={() => {
                                    setSelectedOption(option)
                                    setMenuOpen(false)
                                }}
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                </div>
            </CloseOnClickOutside> */}
        </Row>
    )
}

DropDown.defaultProps = {
    style: null,
}

export default DropDown
