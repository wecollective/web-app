import Button from '@components/Button'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { PostContext } from '@contexts/PostContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import { formatTimeHHDDMMSS, pluralise } from '@src/Helpers'
import Comments from '@src/components/cards/Comments/Comments'
import BeadCard from '@src/components/cards/PostCard/BeadCard'
import NextBeadModal from '@src/components/modals/NextBeadModal'
import { AccountContext } from '@src/contexts/AccountContext'
import styles from '@styles/components/cards/PostCard/GlassBeadGameCard.module.scss'
import { DNAIcon, DoorIcon, PlusIcon, UsersIcon } from '@svgs/all'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function GlassBeadGameCard(props: { postData: any; location: string }): JSX.Element {
    const { postData, location } = props
    const { id, Creator, GlassBeadGame, Beads, Players } = postData
    const {
        synchronous,
        multiplayer,
        totalMoves,
        movesPerPlayer,
        playerOrder,
        nextMoveDeadline,
        state,
    } = GlassBeadGame
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    const { spacePosts, setSpacePosts } = useContext(SpaceContext)
    const { userPosts, setUserPosts } = useContext(UserContext)
    const { setPostData } = useContext(PostContext)
    const [beads, setBeads] = useState<any[]>(Beads.sort((a, b) => a.Link.index - b.Link.index))
    const [orderedPlayers, setOrderedPlayers] = useState<any[]>([])
    const [nextPlayer, setNextPlayer] = useState<any>(null)
    const [timeLeftInMove, setTimeLeftInMove] = useState(0)
    const timeLeftInMoveInterval = useRef<any>(null)
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)
    const [beadCommentsOpen, setBeadCommentsOpen] = useState(false)
    const [selectedBead, setSelectedBead] = useState<any>(null)
    const history = useNavigate()
    const pendingPlayers = Players.filter((p) => p.UserPost.state === 'pending')
    const rejectedPlayers = Players.filter((p) => p.UserPost.state === 'rejected')
    const allAccepted = !pendingPlayers.length && !rejectedPlayers.length
    const hideBeadDraw = synchronous
        ? !beads.length
        : !allAccepted || (state === 'cancelled' && !beads.length)

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
            ? `${beads.length + 1} / ${movesPerPlayer * Players.length}`
            : beads.length + 1
        const movesLeft =
            state === 'active' &&
            (!movesPerPlayer || movesPerPlayer * Players.length > beads.length)
        return (
            <Row spaceBetween centerY className={styles.infoRow}>
                <FlagImageHighlights
                    type='user'
                    imagePaths={orderedPlayers.map((p) => p.flagImagePath)}
                    imageSize={30}
                    text={`${Players.length} players`}
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
        return Players.length ? renderRestrictedPlayersRow() : renderOpenToAllUsersRow()
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
        // game rooms
        if (synchronous) return <span style={{ marginRight: 15 }} />
        // restricted weaves
        if (Players.length) {
            if (state === 'active' && nextPlayer) {
                if (nextPlayer.id === accountData.id) return renderNextBeadButton()
                return renderWaitingForPlayerCard()
            }
            return <span style={{ marginRight: 15 }} />
        }
        // open weaves
        const movesLeft = !totalMoves || totalMoves > beads.length
        if (multiplayer && movesLeft) {
            return renderNextBeadButton()
        }
        // strings
        if (!multiplayer && movesLeft) {
            return Creator.id === accountData.id ? (
                renderNextBeadButton()
            ) : (
                <span style={{ marginRight: 15 }} />
            )
        }
        return null
    }

    // handle players and move deadline
    useEffect(() => {
        setBeads(Beads.sort((a, b) => a.Link.index - b.Link.index))
        if (Players.length && playerOrder) {
            // order players and find next player
            const players = [] as any
            playerOrder.split(',').forEach((playerId) => {
                players.push(Players.find((p) => p.id === +playerId))
            })
            setOrderedPlayers(players)
            const movesLeft = !movesPerPlayer || Beads.length < Players.length * movesPerPlayer
            setNextPlayer(movesLeft ? players[Beads.length % Players.length] : null)
            const deadlineActive = nextMoveDeadline && new Date(nextMoveDeadline) > new Date()
            if (deadlineActive) {
                timeLeftInMoveInterval.current = setInterval(() => {
                    const now = new Date().getTime()
                    const deadline = new Date(nextMoveDeadline).getTime()
                    setTimeLeftInMove((deadline - now) / 1000)
                }, 1000)
            }
        }
        return () => clearInterval(timeLeftInMoveInterval.current)
    }, [postData, postData.Beads])

    return (
        <Column className={styles.wrapper}>
            {synchronous && (
                <Row style={{ marginBottom: 10 }}>
                    <Button
                        text='Open game room'
                        color='gbg-white'
                        icon={<DoorIcon />}
                        onClick={() => history(`/p/${id}/game-room`)}
                    />
                </Row>
            )}
            {!synchronous && multiplayer && renderInfoRow()}
            {!hideBeadDraw && (
                <Row centerX>
                    <Scrollbars className={styles.beads}>
                        <Row>
                            {beads.map((bead, i) => (
                                <Row key={bead.id}>
                                    <BeadCard
                                        bead={bead}
                                        postId={id}
                                        postType={postData.type}
                                        beadIndex={i + 1}
                                        location={location}
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
                        allowedBeadTypes: [...GlassBeadGame.allowedBeadTypes.split(',')],
                    }}
                    postId={id}
                    players={Players}
                    addBead={(bead) => {
                        // update context state
                        let newPosts = [] as any
                        if (location === 'space-posts') newPosts = [...spacePosts]
                        if (location === 'user-posts') newPosts = [...userPosts]
                        if (location === 'post-page') newPosts = [{ ...postData }]
                        const newPost = newPosts.find((p) => p.id === postData.id)
                        newPost.Beads = [...beads, { ...bead, type: `gbg-${bead.type}` }]
                        newPost.GlassBeadGame.nextMoveDeadline = bead.nextMoveDeadline
                        if (location === 'space-posts') setSpacePosts(newPosts)
                        if (location === 'user-posts') setUserPosts(newPosts)
                        if (location === 'post-page') setPostData(newPosts[0])
                    }}
                    close={() => setNextBeadModalOpen(false)}
                />
            )}
            {beadCommentsOpen && (
                <Comments
                    postId={selectedBead.id}
                    type='bead'
                    location={location}
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

export default GlassBeadGameCard
