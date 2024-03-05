/* eslint-disable react/function-component-definition */
import { Play, Post } from '@src/Helpers'
import { CastaliaIcon } from '@src/svgs/all'
import styles from '@styles/components/PlayCard.module.scss'
import React, { FC } from 'react'
import Column from './Column'
import { GameCardContent } from './GameCard'
import Row from './Row'

export type PlayState = {
    play: Play
}

const PlayCard: FC<{ post: Post; state: PlayState }> = ({ post, state }) => {
    return (
        <Column className={styles.playCard}>
            <Row centerY style={{ marginBottom: 10 }}>
                <CastaliaIcon className={styles.icon} />
                <h3 style={{ marginLeft: 5, color: 'gray' }}>Play ({state.play.status})</h3>
            </Row>
            Players: {state.play.playerIds}
            <Row style={{ justifyContent: 'flex-end' }}>
                <GameCardContent
                    initialGame={state.play.game}
                    state={{ game: state.play.game, dirty: false }}
                    postContext={{
                        post,
                    }}
                />
            </Row>
        </Column>
    )
}

export default PlayCard
