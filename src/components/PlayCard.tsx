/* eslint-disable react/function-component-definition */
import { Play, Post } from '@src/Helpers'
import { CastaliaIcon } from '@src/svgs/all'
import styles from '@styles/components/PlayCard.module.scss'
import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Column from './Column'
import Row from './Row'

export const PLAY_BUTTON_TEXT: Record<Play['status'], string> = {
    waiting: 'Join',
    started: 'Join',
    paused: 'View',
    ended: 'View',
    stopped: 'View',
}

export type PlayState = {
    play: Play
}

const PlayCard: FC<{ post: Post; state: PlayState }> = ({ post, state }) => {
    const navigate = useNavigate()

    return (
        <Column className={styles.playCard}>
            <Row centerY style={{ marginBottom: 10 }}>
                <CastaliaIcon className={styles.icon} />
                <h3 style={{ marginLeft: 5, color: 'gray' }}>Play ({state.play.status})</h3>
            </Row>
            Players: {state.play.playerIds}
            <Row style={{ justifyContent: 'flex-end' }}>
                <Button
                    color='grey'
                    onClick={() => navigate(`/p/${state.play.gameId}`)}
                    text='View original game'
                />
                <Button
                    color='blue'
                    text={PLAY_BUTTON_TEXT[state.play.status]}
                    onClick={() => navigate(`/p/${post.id}`)}
                />
            </Row>
        </Column>
    )
}

export default PlayCard
