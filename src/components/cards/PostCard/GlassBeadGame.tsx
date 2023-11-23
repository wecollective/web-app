import Button from '@components/Button'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import Comments from '@components/cards/Comments/Comments'
import BeadCard from '@components/cards/PostCard/BeadCard'
import NextBeadModal from '@components/modals/NextBeadModal'
import config from '@src/Config'
import { defaultGBGSettings, formatTimeHHDDMMSS, pluralise } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import styles from '@styles/components/cards/PostCard/GlassBeadGameCard.module.scss'
import { DNAIcon, DoorIcon, PlusIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function GlassBeadGame(props: {
    postId: number
    isOwnPost: boolean
    setTopicImage: (url: string) => void
}): JSX.Element {
    const { postId, isOwnPost, setTopicImage } = props
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    const [loading, setLoading] = useState(true)
    const [game, setGame] = useState<any>(defaultGBGSettings)
    const {
        synchronous,
        multiplayer,
        totalMoves,
        movesPerPlayer,
        playerOrder,
        allowedBeadTypes,
        nextMoveDeadline,
        state,
    } = game
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
    const history = useNavigate()
    const cookies = new Cookies()

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

    function updateNextPlayer(latestBeads, latestPlayers) {
        const movesLeft =
            !movesPerPlayer || latestBeads.length < latestPlayers.length * movesPerPlayer
        setNextPlayer(movesLeft ? latestPlayers[latestBeads.length % latestPlayers.length] : null)
    }

    function getGBGData() {
        // todo: get game data as well as beads here
        // pass down setTopicImage function to render in post
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/gbg-data?postId=${postId}`, options)
            .then((res) => {
                setGame(res.data.game)
                setBeads(res.data.beads.sort((a, b) => a.Link.index - b.Link.index))
                const pending = res.data.players.filter((p) => p.UserPost.state === 'pending')
                const rejected = res.data.players.filter((p) => p.UserPost.state === 'rejected')
                setPendingPlayers(pending)
                setRejectedPlayers(rejected)
                setAllAccepted(!pending.length && !rejected.length)
                if (res.data.players.length && playerOrder) {
                    const orderedPlayers = [] as any
                    playerOrder.split(',').forEach((playerId) => {
                        orderedPlayers.push(res.data.players.find((p) => p.id === +playerId))
                    })
                    setPlayers(orderedPlayers)
                    updateNextPlayer(res.data.beads, orderedPlayers)
                    updateDeadline(nextMoveDeadline)
                }
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function hideBeadDraw() {
        // todo: useState instead of function and only update when required to prevent looping re-renders if time limit present
        const hide = synchronous
            ? !beads.length
            : !allAccepted ||
              (state === 'cancelled' && !beads.length) ||
              (nextPlayer && nextPlayer.id !== accountData.id && !beads.length)
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
        const move = `${beads.length + 1} ${totalMoves ? `/ ${totalMoves}` : ''}`
        const movesLeft = state === 'active' && (!totalMoves || totalMoves > beads.length)
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
            ? `${beads.length + 1} / ${movesPerPlayer * players.length}`
            : beads.length + 1
        const movesLeft =
            state === 'active' &&
            (!movesPerPlayer || movesPerPlayer * players.length > beads.length)
        return (
            <Row spaceBetween centerY className={styles.infoRow}>
                <FlagImageHighlights
                    type='user'
                    imagePaths={players.map((p) => p.flagImagePath)}
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
                            imagePaths={pendingPlayers.map((p) => p.flagImagePath)}
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
                            imagePaths={rejectedPlayers.map((p) => p.flagImagePath)}
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
                {beads.length > 0 && (
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
                        marginRight: beads.length > 1 ? 15 : 0,
                    }}
                >
                    <PlusIcon />
                    <p>Click to create the {beads.length ? 'next' : 'first'} bead</p>
                </button>
            </Row>
        )
    }

    function renderWaitingForPlayerCard() {
        return (
            <Row centerY>
                {beads.length > 0 && (
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
                        marginRight: beads.length > 1 ? 15 : 0,
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
        // synchronous game rooms
        if (synchronous) return beads.length > 2 ? <span style={{ marginRight: 15 }} /> : null
        // restricted async games
        if (players.length) {
            if (state === 'active' && nextPlayer) {
                if (nextPlayer.id === accountData.id) return renderNextBeadButton()
                return renderWaitingForPlayerCard()
            }
            return beads.length > 2 ? <span style={{ marginRight: 15 }} /> : null
        }
        // open async games
        const movesLeft = !totalMoves || totalMoves > beads.length
        if (multiplayer && movesLeft) return renderNextBeadButton()
        // one player async games
        if (!multiplayer && movesLeft) {
            if (isOwnPost) return renderNextBeadButton()
            if (beads.length > 2) return <span style={{ marginRight: 15 }} />
        }
        return null
    }

    useEffect(() => {
        getGBGData()
        return () => clearInterval(timeLeftInMoveInterval.current)
    }, [])

    if (loading)
        return (
            <Row centerY centerX className={styles.loading}>
                Beads loading...
                <LoadingWheel size={30} style={{ marginLeft: 20 }} />
            </Row>
        )
    return (
        <Column className={styles.wrapper} style={{ marginBottom: beads.length ? 10 : 0 }}>
            {synchronous && (
                <Row style={{ marginBottom: beads.length ? 10 : 0 }}>
                    <Button
                        text='Open game room'
                        color='gbg-white'
                        icon={<DoorIcon />}
                        onClick={() => history(`/p/${postId}/game-room`)}
                    />
                </Row>
            )}
            {!synchronous && multiplayer && renderInfoRow()}
            {!hideBeadDraw() && (
                <Row centerX>
                    <Scrollbars className={styles.beads}>
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
                                    {i < beads.length - 1 && (
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
                    location='existing-gbg'
                    settings={{
                        ...GlassBeadGame,
                        allowedBeadTypes: [...allowedBeadTypes.split(',')],
                    }}
                    postId={postId}
                    players={players}
                    addBead={(bead) => {
                        const newBeads = [...beads, { ...bead, type: `gbg-${bead.type}` }]
                        setBeads(newBeads)
                        updateNextPlayer(newBeads, players)
                        updateDeadline(bead.nextMoveDeadline)
                    }}
                    close={() => setNextBeadModalOpen(false)}
                />
            )}
            {beadCommentsOpen && (
                <Comments
                    postId={selectedBead.id}
                    type='bead'
                    location='post'
                    totalComments={selectedBead.totalComments}
                    incrementTotalComments={(value) => {
                        const newBeads = [...beads]
                        const bead = newBeads.find((b) => b.id === selectedBead.id)
                        bead.totalComments += value
                        bead.accountComment = value > 0
                        setBeads(newBeads)
                    }}
                    style={{ margin: '10px 0' }}
                />
            )}
        </Column>
    )
}

export default GlassBeadGame
