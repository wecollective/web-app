import { PostContext } from '@contexts/PostContext'
import styles from '@styles/components/PollResultsAnswer.module.scss'
import React, { useContext } from 'react'

function PollResultsAnswer(props) {
    const { answer, index } = props
    const { postData, totalPollVotes, colorScale } = useContext(PostContext)

    let color = colorScale(index)
    let pollAnswerVotes = answer.totalVotes
    let pollAnswerScore = ((answer.totalVotes / totalPollVotes) * 100).toFixed(1)

    if (postData.subType === 'weighted-choice') {
        if (answer.totalScore != null) pollAnswerVotes = answer.totalScore.toFixed(1)
        pollAnswerScore = ((answer.totalScore / totalPollVotes) * 100).toFixed(1)
    }

    return (
        <div className={styles.pollAnswer}>
            <div className={styles.pollAnswerIndex} style={{ backgroundColor: color }}>
                {index + 1}
            </div>
            <div className={styles.pollAnswerScoreRatio}>{`${pollAnswerVotes} ↑`}</div>
            <div className={styles.pollAnswerScore}>
                <div
                    className={styles.pollAnswerScoreBar}
                    style={{ width: `${pollAnswerScore}%` }}
                />
                <div className={styles.pollAnswerScoreText}>{pollAnswerScore}%</div>
            </div>
            <div className={styles.pollAnswerText}>{answer.text}</div>
        </div>
    )
}

export default PollResultsAnswer
