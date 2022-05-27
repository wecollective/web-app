/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react'
import styles from '@styles/components/CollapsibleCards.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import { ReactComponent as ChevronDownIcon } from '@svgs/chevron-down-solid.svg'

const Card = (props: {
    data: any
    index: number
    row: number
    selectedCard: number | null
    toggleCard: (row: number, index: number | null) => void
}): JSX.Element => {
    const { data, index, row, selectedCard, toggleCard } = props
    const { text, link, imagePath, svg, smallIcon, children } = data

    return (
        <Column
            spaceBetween
            centerX
            className={`${styles.card} ${styles[`card${index}`]} ${
                selectedCard && selectedCard !== index && styles.hidden
            }`}
        >
            <button
                type='button'
                className={`${styles.contentWrapper} ${link && styles.link}`}
                onClick={() => link && window.open(link, '_blank')}
            >
                <Column
                    centerX
                    centerY
                    className={`${styles.content} ${smallIcon && styles.smallIcon}`}
                >
                    {imagePath && <img src={imagePath} alt='card 1' />}
                    {svg && svg}
                    <h1>{text}</h1>
                </Column>
            </button>
            {children.length > 0 && (
                <Row centerX centerY className={styles.footer}>
                    <button
                        type='button'
                        onClick={() => toggleCard(row, index)}
                        className={selectedCard === index ? styles.rotate : ''}
                    >
                        <ChevronDownIcon />
                    </button>
                </Row>
            )}
        </Column>
    )
}

const CollapsibleCards = (props: { data: any; style?: any }): JSX.Element => {
    const { data, style } = props

    const [row1selectedCard, setRow1SelectedCard] = useState<null | number>(null)
    const [row2selectedCard, setRow2SelectedCard] = useState<null | number>(null)
    const [row1State, setRow1State] = useState<'visible' | 'hidden' | 'collapsed'>('visible')
    const [row2State, setRow2State] = useState<'visible' | 'hidden' | 'collapsed'>('hidden')

    function toggleCard(row, index) {
        if (row === 1) {
            setRow1SelectedCard(row1selectedCard ? null : index)
            setRow2State(row1selectedCard ? 'hidden' : 'visible')
            if (!row1selectedCard) {
                setTimeout(() => {
                    window.scrollTo({ top: 2000, behavior: 'smooth' })
                }, 200)
            }
        }
    }

    return (
        <Column centerX className={styles.wrapper} style={style}>
            <Row centerX className={`${styles.row} ${row1selectedCard && styles.collapsed}`}>
                {data.map((card, index) => (
                    <Card
                        key={index}
                        data={card}
                        row={1}
                        index={index + 1}
                        selectedCard={row1selectedCard}
                        toggleCard={toggleCard}
                    />
                ))}
            </Row>
            {row1selectedCard && (
                <Row centerX className={`${styles.row} ${styles[row2State]}`}>
                    {data[(row1selectedCard || 0) - 1].children.map((card, index) => (
                        <Card
                            key={index}
                            data={card}
                            row={1}
                            index={index + 1}
                            selectedCard={row2selectedCard}
                            toggleCard={toggleCard}
                        />
                    ))}
                </Row>
            )}
        </Column>
    )
}

CollapsibleCards.defaultProps = {
    style: null,
}

export default CollapsibleCards
