import CheckBox from '@components/CheckBox'
import CloseButton from '@components/CloseButton'
import Input from '@components/Input'
import Row from '@components/Row'
import styles from '@styles/components/cards/InquiryAnswer.module.scss'
import React from 'react'

const InquiryAnswer = (props: {
    index: number
    type: 'single-choice' | 'multiple-choice' | 'weighted-choice'
    answer: any
    color: string
    preview?: boolean
    selected?: boolean
    onChange?: (value: boolean | number) => void
    close?: () => void
}): JSX.Element => {
    const { index, type, answer, color, preview, selected, onChange, close } = props

    return (
        <Row centerY className={styles.wrapper}>
            {!preview && ['single-choice', 'multiple-choice'].includes(type) && (
                <CheckBox
                    checked={selected || false}
                    onChange={(v) => onChange && onChange(v)}
                    style={{ marginRight: 10 }}
                />
            )}
            {!preview && type === 'weighted-choice' && (
                <Input
                    type='text'
                    value={answer.accountPoints}
                    onChange={(v) => onChange && onChange(+v.replace(/\D/g, ''))}
                    style={{ width: 60 }}
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
