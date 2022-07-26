import CheckBox from '@components/CheckBox'
import CloseButton from '@components/CloseButton'
import Row from '@components/Row'
import styles from '@styles/components/cards/InquiryAnswer.module.scss'
import React from 'react'

const InquiryAnswer = (props: {
    index: number
    answer: any
    color: string
    preview?: boolean
    selected?: boolean
    onChange?: (selected: boolean) => void
    close?: () => void
}): JSX.Element => {
    const { index, answer, color, preview, selected, onChange, close } = props

    return (
        <Row centerY className={styles.wrapper}>
            {!preview && (
                <CheckBox
                    checked={selected || false}
                    onChange={(v) => onChange && onChange(v)}
                    style={{ marginRight: 10 }}
                />
            )}
            <div style={{ backgroundColor: color }}>
                <p>{index + 1}</p>
            </div>
            <p>{answer.text}</p>
            {close && <CloseButton size={20} onClick={() => close()} />}
        </Row>
    )
}

InquiryAnswer.defaultProps = {
    preview: false,
    selected: false,
    onChange: null,
    close: null,
}

export default InquiryAnswer
