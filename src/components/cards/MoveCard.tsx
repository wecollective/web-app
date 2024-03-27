/* eslint-disable react/function-component-definition */
/* eslint-disable no-nested-ternary */
import { GAME_EVENTS, Move, Post, uploadPost } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import styles from '@styles/components/cards/Comments/MessageCard.module.scss'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import Button from '../Button'
import Column from '../Column'
import Input from '../Input'
import Row from '../Row'
import UserButton from '../UserButton'
import { GameStatusIndicator } from './GameCard'

const MoveProgressBar: FC<{ move: Extract<Move, { status: 'started' | 'paused' }> }> = ({
    move,
}) => {
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

const TextMove: FC<{ post: Post; emit: (event: string, data?) => void }> = ({ post, emit }) => {
    const [text, setText] = useState('')
    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                const comment = {
                    type: 'comment',
                    links: {
                        parent: {
                            type: post.type,
                            id: post.id,
                            relationship: 'submission',
                        },
                    },
                    text,
                    searchableText: text,
                    mentions: [],
                    urls: [],
                    images: [],
                    audios: [],
                    mediaTypes: '',
                }
                const result = await uploadPost(comment)
                emit(GAME_EVENTS.outgoing.submit, { moveId: post.id })
            }}
        >
            <Input
                type='text-area'
                placeholder='Leave a text response.'
                style={{ marginBottom: 10 }}
                value={text}
                onChange={setText}
                required
            />
            <Row className={{ alignItems: 'flex-end' }} />
            <Row
                style={{
                    justifyContent: 'center',
                    marginBottom: 10,
                }}
            >
                <Button color='grey' text='Skip' onClick={() => emit(GAME_EVENTS.outgoing.skip)} />
                <Button
                    color='grey'
                    text='Pause'
                    style={{ marginLeft: 10 }}
                    onClick={() => emit(GAME_EVENTS.outgoing.pause)}
                />
                <Button
                    submit
                    color='purple'
                    style={{ marginLeft: 10 }}
                    text='Submit your move!'
                    disabled={!text}
                />
            </Row>
        </form>
    )
}

const MoveCard: FC<{ post: Post; emit: (event: string, data?) => void }> = ({ post, emit }) => {
    const move = post.move!
    const { loggedIn, accountData, alert } = useContext(AccountContext)
    const myMove = accountData.id === move.player?.id
    const ongoing = move.status === 'started' || move.status === 'stopped'
    return (
        <Column style={{ borderTop: '1px solid lightgrey', marginTop: 10, paddingTop: 10 }}>
            <Row style={{ marginBottom: 10 }} centerY>
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
                            {(() => {
                                switch (move.type) {
                                    case 'text': {
                                        return <TextMove post={post} emit={emit} />
                                    }
                                    case 'audio':
                                        return null
                                    default: {
                                        const exhaustivenessCheck: never = move
                                        throw exhaustivenessCheck
                                    }
                                }
                            })()}
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
            {post.Submissions?.map((submission) => (
                <div style={{ backgroundColor: '#ececec', borderRadius: 5, padding: 5 }}>
                    {submission.Post.text}
                </div>
            ))}
        </Column>
    )
}

export default MoveCard
