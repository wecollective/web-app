import CheckBox from '@components/CheckBox'
import CloseButton from '@components/CloseButton'
import FlagImageHighlights from '@components/FlagImageHighlights'
import Input from '@components/Input'
import Row from '@components/Row'
import styles from '@styles/components/cards/PollAnswer.module.scss'
import React from 'react'

const PollAnswer = (props: {
    index: number
    type: string // 'single-choice' | 'multiple-choice' | 'weighted-choice'
    answer: any
    totalVotes: number
    totalPoints: number
    color: string
    preview?: boolean
    selected?: boolean
    onChange?: (value: boolean | number) => void
    close?: () => void
}): JSX.Element => {
    const {
        index,
        type,
        answer,
        totalVotes,
        totalPoints,
        color,
        preview,
        selected,
        onChange,
        close,
    } = props

    const weighted = type === 'weighted-choice'
    const points = weighted ? answer.totalPoints / 100 : answer.totalVotes
    const activeReactions = answer.Reactions.filter((r) => r.state === 'active')

    function findPercentage() {
        let percent = 0
        if (weighted && totalPoints) percent = (answer.totalPoints / totalPoints) * 100
        if (!weighted && totalVotes) percent = (100 / totalVotes) * answer.totalVotes
        return +percent.toFixed(1)
    }

    return (
        <Row centerY className={styles.wrapper}>
            <div className={styles.index} style={{ backgroundColor: color }}>
                <p>{index + 1}</p>
            </div>
            {!preview && (
                <Row centerY style={{ flexShrink: 0 }}>
                    {activeReactions.length > 0 && (
                        <FlagImageHighlights
                            type='user'
                            imagePaths={activeReactions.map((r) => r.Creator.flagImagePath)}
                            imageSize={30}
                            style={{ marginRight: 10 }}
                        />
                    )}
                    <p className={styles.percentage}>{findPercentage()}%</p>
                    <p className={styles.points}>{+points.toFixed(2)} ↑</p>
                </Row>
            )}
            <p>{answer.text}</p>
            <Row className={styles.buttons}>
                {weighted && !preview && (
                    <Input
                        type='text'
                        value={answer.accountPoints}
                        disabled={preview}
                        onChange={(v) => onChange && onChange(+v.replace(/\D/g, ''))}
                        style={{ width: 60 }}
                    />
                )}
                {!weighted && !preview && (
                    <CheckBox
                        checked={selected || false}
                        disabled={preview}
                        onChange={(v) => onChange && onChange(v)}
                    />
                )}
                {close && <CloseButton size={20} onClick={() => close()} />}
            </Row>
        </Row>
    )
}

PollAnswer.defaultProps = {
    preview: false,
    selected: false,
    onChange: null,
    close: null,
}

export default PollAnswer
