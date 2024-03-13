import { Move } from '@src/Helpers'
import styles from '@styles/components/cards/Comments/MessageCard.module.scss'
import React, { useEffect, useRef } from 'react'
import Button from '../Button'
import Row from '../Row'

function MoveProgressBar({ move }: { move: Extract<Move, { status: 'started' }> }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                const progress = (+new Date() - move.startedAt) / (move.timeout - move.startedAt)
                ref.current.style.width = `${100 * Math.max(0, Math.min(progress, 1))}%`
            }
        }, 17)
        return () => clearInterval(interval)
    }, [])

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
                <Row>
                    <Button color='aqua' text='Pause' /> <Button color='grey' text='Skip' />
                </Row>
            )}
            {move.status === 'started' && <MoveProgressBar move={move} />}
        </div>
    )
}

export default MoveCard
