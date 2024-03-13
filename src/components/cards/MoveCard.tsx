import { Move } from '@src/Helpers'
import styles from '@styles/components/cards/Comments/MessageCard.module.scss'
import React, { useEffect, useRef } from 'react'
import Button from '../Button'
import Row from '../Row'

function MoveProgressBar({ move }: { move: Extract<Move, { status: 'started' | 'paused' }> }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                const progress =
                    move.status === 'started'
                        ? (move.elapsedTime + +new Date() - move.startedAt) /
                          (move.elapsedTime + move.timeout - move.startedAt)
                        : move.elapsedTime / (move.remainingTime + move.elapsedTime)
                ref.current.style.width = `${100 * Math.max(0, Math.min(progress, 1))}%`
            }
        }, 17)
        return () => clearInterval(interval)
    }, [move.status])

    return (
        <div className={styles.progressBar}>
            <div ref={ref} className={styles.progress} />
        </div>
    )
}

function MoveCard({ move }: { move: Move }) {
    return (
        <div>
            <div>{move.status}</div>
            {move.status === 'started' && (
                <Row style={{ justifyContent: 'center' }}>
                    <Button color='grey' text='Pause' />
                    <Button color='grey' text='Skip' style={{ marginLeft: 10 }} />
                </Row>
            )}
            {move.status === 'paused' && (
                <Row>
                    <Button color='grey' text='Start' />
                </Row>
            )}
            {(move.status === 'started' || move.status === 'paused') && (
                <MoveProgressBar move={move} />
            )}
        </div>
    )
}

export default MoveCard
