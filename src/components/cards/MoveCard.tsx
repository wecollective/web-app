/* eslint-disable no-nested-ternary */
import { GAME_EVENTS, Move } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import styles from '@styles/components/cards/Comments/MessageCard.module.scss'
import React, { useContext, useEffect, useRef } from 'react'
import Button from '../Button'
import Column from '../Column'
import Row from '../Row'
import UserButton from '../UserButton'
import { GameStatusIndicator } from './GameCard'

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

function MoveCard({ move, emit }: { move: Move; emit: (event: string, data?) => void }) {
    const { loggedIn, accountData, alert } = useContext(AccountContext)
    const myMove = accountData.id === move.player?.id
    const ongoing = move.status === 'started' || move.status === 'stopped'
    return (
        <Column style={{ borderTop: '1px solid lightgrey', marginTop: 10, paddingTop: 10 }}>
            <Row style={{ marginBottom: 10 }} centerY>
                <span style={{ marginRight: 5, fontWeight: 'bold' }}>Move:</span>
                <span style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    {myMove
                        ? ongoing
                            ? 'Your move!'
                            : 'Your move'
                        : move.player && <UserButton user={move.player} />}
                </span>
                <GameStatusIndicator status={move.status} style={{ marginLeft: 5, fontSize: 12 }} />
            </Row>
            {myMove && (
                <>
                    {move.status === 'started' && (
                        <>
                            <Row style={{ justifyContent: 'center', marginBottom: 10 }}>
                                <Button
                                    color='grey'
                                    text='Pause'
                                    onClick={() => emit(GAME_EVENTS.outgoing.pause)}
                                />
                                <Button
                                    color='grey'
                                    text='Skip'
                                    style={{ marginLeft: 10 }}
                                    onClick={() => emit(GAME_EVENTS.outgoing.skip)}
                                />
                            </Row>
                        </>
                    )}
                    {move.status === 'paused' && (
                        <Row style={{ justifyContent: 'center', marginBottom: 10 }}>
                            <Button
                                color='grey'
                                text='Start'
                                onClick={() => emit(GAME_EVENTS.outgoing.start)}
                            />
                        </Row>
                    )}
                </>
            )}
            {(move.status === 'started' || move.status === 'paused') && (
                <MoveProgressBar move={move} />
            )}
        </Column>
    )
}

export default MoveCard
