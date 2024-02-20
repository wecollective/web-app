import Button from '@components/Button'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import LoadingWheel from '@components/animations/LoadingWheel'
import BeadCard from '@components/cards/PostCard/BeadCard'
import NextBeadModal from '@components/modals/NextBeadModal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { GameState, GameType, formatTimeHHDDMMSS, pluralise } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/GlassBeadGameCard.module.scss'
import { DNAIcon, DoorIcon, PlusIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Game(props: {
    type: GameType
    postId: number
    isOwnPost: boolean
    setTopicImage: (url: string) => void
    style?: any
}): JSX.Element {
    const { type, postId, isOwnPost, setTopicImage, style } = props
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    const [game, setGame] = useState<GameState>()
    const [beads, setBeads] = useState<any[]>([])
    const [players, setPlayers] = useState<any[]>([])
    const [pendingPlayers, setPendingPlayers] = useState<any[]>([])
    const [rejectedPlayers, setRejectedPlayers] = useState<any[]>([])
    const [allAccepted, setAllAccepted] = useState(false)
    const [nextPlayer, setNextPlayer] = useState<any>(null)
    const [timeLeftInMove, setTimeLeftInMove] = useState(0)
    const timeLeftInMoveInterval = useRef<any>(null)
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)
    const [beadCommentsOpen, setBeadCommentsOpen] = useState(false)
    const [selectedBead, setSelectedBead] = useState<any>(null)
    const [nextBeadsLoading, setNextBeadsLoading] = useState(false)
    const history = useNavigate()
    const cookies = new Cookies()

    function updateNextPlayer(
        movesPerPlayer: number | undefined,
        numberOfBeads: number,
        latestPlayers: any[]
    ) {
        const movesLeft = !movesPerPlayer || numberOfBeads < latestPlayers.length * movesPerPlayer
        setNextPlayer(movesLeft ? latestPlayers[numberOfBeads % latestPlayers.length] : null)
    }

    function updateDeadline(deadline) {
        clearInterval(timeLeftInMoveInterval.current)
        const deadlineActive = deadline && new Date(deadline) > new Date()
        if (deadlineActive) {
            timeLeftInMoveInterval.current = setInterval(() => {
                // todo: handle timeout when still on screen
                const now = new Date().getTime()
                const newDeadline = new Date(deadline).getTime()
                setTimeLeftInMove((newDeadline - now) / 1000)
            }, 1000)
        }
    }

    function getGameData() {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/gbg-data?postId=${postId}`, options)
            .then((res) => {
                if (!res.data.game) {
                    return
                }
                setTopicImage(res.data.game.topicImage)
                setGame({
                    ...res.data.game,
                    allowedBeadTypes: res.data.game.allowedBeadTypes.split(','),
                })
                setBeads(res.data.beads)
                const pending = res.data.players.filter((p) => p.UserPost.state === 'pending')
                const rejected = res.data.players.filter((p) => p.UserPost.state === 'rejected')
                setPendingPlayers(pending)
                setRejectedPlayers(rejected)
                setAllAccepted(!pending.length && !rejected.length)
                if (res.data.players.length && res.data.game.playerOrder) {
                    const orderedPlayers = [] as any
                    res.data.game.playerOrder.split(',').forEach((playerId) => {
                        orderedPlayers.push(res.data.players.find((p) => p.id === +playerId))
                    })
                    setPlayers(orderedPlayers)
                    updateNextPlayer(
                        res.data.game.movesPerPlayer,
                        res.data.game.totalBeads,
                        orderedPlayers
                    )
                    updateDeadline(res.data.game.nextMoveDeadline)
                }
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        getGameData()
        return () => clearInterval(timeLeftInMoveInterval.current)
    }, [])

    if (!game) {
        return (
            <Row centerY centerX className={styles.loading}>
                Beads loading...
                <LoadingWheel size={30} style={{ marginLeft: 20 }} />
            </Row>
        )
    }

    const {
        synchronous,
        multiplayer,
        totalMoves,
        movesPerPlayer,
        totalBeads,
        state,
        nextMoveDeadline,
    } = game

    function getNextBeads() {
        if (!nextBeadsLoading && totalBeads > beads.length) {
            setNextBeadsLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .get(`${config.apiURL}/next-beads?postId=${postId}&offset=${beads.length}`, options)
                .then((res) => {
                    setBeads([...beads, ...res.data])
                    setNextBeadsLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    function hideBeadDraw() {
        // todo: useState instead of function and only update when required to prevent looping re-renders if time limit present
        const hide = synchronous
            ? !totalBeads
            : !allAccepted ||
              (state === 'cancelled' && !totalBeads) ||
              (nextPlayer && nextPlayer.id !== accountData.id && !totalBeads)
        return hide
    }

    function toggleBeadComments(bead) {
        if (beadCommentsOpen) {
            if (bead.id !== selectedBead.id) setSelectedBead(bead)
            else setBeadCommentsOpen(false)
        } else {
            setSelectedBead(bead)
            setBeadCommentsOpen(true)
        }
    }

    function renderOpenToAllUsersRow() {
        const move = `${totalBeads + 1} ${totalMoves ? `/ ${totalMoves}` : ''}`
        const movesLeft = state === 'active' && (!totalMoves || totalMoves > totalBeads)
        return (
            <Row spaceBetween centerY className={styles.infoRow}>
                <Row centerY>
                    <UsersIcon />
                    <p>Open to all users</p>
                </Row>
                {movesLeft ? <p>Waiting for move: {move}</p> : <p>Game finished</p>}
            </Row>
        )
    }

    function renderRestrictedPlayersRow() {
        const move = movesPerPlayer
            ? `${totalBeads + 1} / ${movesPerPlayer * players.length}`
            : totalBeads + 1
        const movesLeft =
            state === 'active' && (!movesPerPlayer || movesPerPlayer * players.length > totalBeads)
        return (
            <Row spaceBetween centerY className={styles.infoRow}>
                <FlagImageHighlights
                    type='user'
                    images={players.map((p) => p.flagImagePath).splice(0, 3)}
                    imageSize={30}
                    text={`${players.length} players`}
                />
                {nextMoveDeadline && timeLeftInMove > 0 && (
                    <p style={{ color: 'black' }} title='Time left for next move'>
                        {formatTimeHHDDMMSS(timeLeftInMove)}
                    </p>
                )}
                {allAccepted && (nextPlayer || !movesLeft) && (
                    <Row centerY>
                        {movesLeft ? (
                            <Row centerY>
                                <ImageTitle
                                    type='user'
                                    imagePath={nextPlayer.flagImagePath}
                                    title={nextPlayer.name.split(' ')[0]}
                                    fontSize={16}
                                    link={`/u/${nextPlayer.handle}/posts`}
                                />
                                <p>&apos;s move: {move}</p>
                            </Row>
                        ) : (
                            <p>Game {state === 'cancelled' ? 'cancelled' : 'finished'}</p>
                        )}
                    </Row>
                )}
                {pendingPlayers.length > 0 && !rejectedPlayers.length && (
                    <Row centerY>
                        <p>Waiting for {pendingPlayers.length}</p>
                        <FlagImageHighlights
                            type='user'
                            images={pendingPlayers.map((p) => p.flagImagePath).splice(0, 3)}
                            imageSize={30}
                            style={{ marginLeft: 5 }}
                        />
                    </Row>
                )}
                {rejectedPlayers.length > 0 && (
                    <Row centerY>
                        <p>
                            Invitation rejected by {rejectedPlayers.length} player
                            {pluralise(rejectedPlayers.length)}
                        </p>
                        <FlagImageHighlights
                            type='user'
                            images={rejectedPlayers.map((p) => p.flagImagePath).splice(0, 3)}
                            imageSize={30}
                        />
                    </Row>
                )}
            </Row>
        )
    }

    function renderInfoRow() {
        // displayed for async multiplayer games
        return players.length ? renderRestrictedPlayersRow() : renderOpenToAllUsersRow()
    }

    function renderNextBeadButton() {
        return (
            <Row centerY>
                {totalBeads > 0 && (
                    <Row centerY className={styles.beadDivider}>
                        <DNAIcon />
                    </Row>
                )}
                <button
                    type='button'
                    className={styles.nextBeadCard}
                    onClick={() => {
                        if (loggedIn) setNextBeadModalOpen(true)
                        else {
                            setAlertMessage('Log in to add beads')
                            setAlertModalOpen(true)
                        }
                    }}
                    // todo: refactor margin with screen width taken into account
                    style={{
                        marginRight: totalBeads > 1 ? 15 : 0,
                    }}
                >
                    <PlusIcon />
                    <p>Click to create the {totalBeads ? 'next' : 'first'} bead</p>
                </button>
            </Row>
        )
    }

    function renderWaitingForPlayerCard() {
        return (
            <Row centerY>
                {totalBeads > 0 && (
                    <Row centerY className={styles.beadDivider}>
                        <DNAIcon />
                    </Row>
                )}
                <Column
                    centerX
                    centerY
                    className={styles.waitingForPlayerCard}
                    // todo: refactor margin with screen width taken into account
                    style={{
                        marginRight: totalBeads > 1 ? 15 : 0,
                    }}
                >
                    <p style={{ marginBottom: 10 }}>Waiting for</p>
                    <ImageTitle
                        type='user'
                        imagePath={nextPlayer.flagImagePath}
                        title={`${nextPlayer.name}...`}
                        link={`/u/${nextPlayer.handle}/posts`}
                    />
                </Column>
            </Row>
        )
    }

    function renderNextCard() {
        const allBeadsLoaded = beads.length === totalBeads
        // synchronous game rooms
        if (synchronous) return totalBeads > 2 ? <span style={{ marginRight: 15 }} /> : null
        // restricted async games
        if (players.length) {
            if (state === 'active' && nextPlayer && allBeadsLoaded) {
                if (nextPlayer.id === accountData.id) return renderNextBeadButton()
                return renderWaitingForPlayerCard()
            }
            return totalBeads > 2 ? <span style={{ marginRight: 15 }} /> : null
        }
        // open async games
        const movesLeft = allBeadsLoaded && (!totalMoves || totalMoves > totalBeads)
        if (multiplayer && movesLeft) return renderNextBeadButton()
        // one player async games
        if (!multiplayer && movesLeft) {
            if (isOwnPost) return renderNextBeadButton()
            if (totalBeads > 2) return <span style={{ marginRight: 15 }} />
        }
        return null
    }

    return (
        <Column className={styles.wrapper} style={{ ...style, marginBottom: totalBeads ? 10 : 0 }}>
            {synchronous && (
                <Row style={{ marginBottom: 10 }}>
                    <Button
                        text={`Play ${type.replaceAll('-', ' ')}`}
                        color='game-white'
                        icon={<DoorIcon />}
                        onClick={() => history(`/p/${postId}/game-room`)}
                    />
                </Row>
            )}
            {!synchronous && multiplayer && renderInfoRow()}
            {!hideBeadDraw() && (
                <Row centerX>
                    <Scrollbars className={styles.beads} onScrollRightEnd={getNextBeads}>
                        <Row>
                            {beads.map((bead, i) => (
                                <Row key={bead.id}>
                                    <BeadCard
                                        bead={bead}
                                        postId={postId}
                                        beadIndex={i + 1}
                                        location='post'
                                        selected={selectedBead && selectedBead.id === bead.id}
                                        toggleBeadComments={() => toggleBeadComments(bead)}
                                    />
                                    {i < totalBeads - 1 && (
                                        <Row centerY className={styles.beadDivider}>
                                            <DNAIcon />
                                        </Row>
                                    )}
                                </Row>
                            ))}
                            {renderNextCard()}
                            <span style={{ marginLeft: -7, width: 7, flexShrink: 0 }} />
                        </Row>
                    </Scrollbars>
                </Row>
            )}
            {nextBeadModalOpen && (
                <NextBeadModal
                    settings={game}
                    postId={postId}
                    players={players}
                    onSave={({ newBead, newDeadline }) => {
                        setGame({
                            ...game,
                            totalBeads: game.totalBeads + 1,
                        })
                        const newBeads = [...beads, newBead]
                        setBeads(newBeads)
                        updateNextPlayer(game.movesPerPlayer, game.totalBeads + 1, players)
                        updateDeadline(newDeadline)
                    }}
                    close={() => setNextBeadModalOpen(false)}
                />
            )}
        </Column>
    )
}

Game.defaultProps = {
    style: null,
}

export default Game
