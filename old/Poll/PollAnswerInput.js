import styles from '@styles/components/PollAnswerInput.module.scss'
import React from 'react'

function PollAnswerInput(props) {
    const { pollAnswer, removePollAnswer } = props
    return (
        <div className={styles.pollAnswer}>
            <div className={styles.pollAnswerText}>{pollAnswer}</div>
            <div
                className={styles.pollAnswerCloseButton}
                onClick={() => {
                    removePollAnswer(pollAnswer)
                }}
            />
        </div>
    )
}

export default PollAnswerInput
