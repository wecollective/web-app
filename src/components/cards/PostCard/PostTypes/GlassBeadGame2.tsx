import Button from '@components/Button'
import BeadCard from '@components/cards/PostCard/BeadCard2'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import NextBeadModal from '@components/modals/NextBeadModal2'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import Comments from '@src/components/cards/Comments/Comments'
import { AccountContext } from '@src/contexts/AccountContext'
import { formatTimeHHDDMMSS, pluralise } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/PostTypes/GlassBeadGame2.module.scss'
import { DNAIcon, DoorIcon, PlusIcon, UsersIcon } from '@svgs/all'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function GlassBeadGame(props: {
    postData: any
    setPostData: (data: any) => void
    location: string
}): JSX.Element {
    const { postData, setPostData, location } = props
    const { id, text, GlassBeadGame2, Beads, Players } = postData
    const { synchronous, multiplayer, totalMoves, movesPerPlayer, playerOrder, nextMoveDeadline } =
        GlassBeadGame2
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
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
    const hideBeadDraw = synchronous ? !Beads.length : !allAccepted

    Beads.sort((a, b) => a.Link.index - b.Link.index)

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
        const move = `${Beads.length + 1} ${totalMoves && `/ ${totalMoves}`}`
        const movesLeft = !totalMoves || totalMoves > Beads.length
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
        const move = `${Beads.length + 1} / ${movesPerPlayer * Players.length}`
        const movesLeft = movesPerPlayer * Players.length > Beads.length
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
                {allAccepted && nextPlayer && (
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
                            <p>Game finished</p>
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
                <Row centerY className={styles.beadDivider}>
                    <DNAIcon />
                </Row>
                <button
                    type='button'
                    className={styles.nextBeadCard}
                    onClick={() => setNextBeadModalOpen(true)}
                    // todo: refactor margin with screen width taken into account
                    style={{
                        marginRight: Beads.length > 1 ? 15 : 0,
                    }}
                >
                    <PlusIcon />
                    <p>Click to create the {Beads.length ? 'next' : 'first'} bead</p>
                </button>
            </Row>
        )
    }

    function renderWaitingForPlayerCard() {
        return (
            <Row centerY>
                <Row centerY className={styles.beadDivider}>
                    <DNAIcon />
                </Row>
                <Column
                    centerX
                    centerY
                    className={styles.waitingForPlayerCard}
                    // todo: refactor margin with screen width taken into account
                    style={{
                        marginRight: Beads.length > 1 ? 15 : 0,
                    }}
                >
                    <p>Waiting for</p>
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
        const movesLeft =
            !synchronous && (totalMoves || movesPerPlayer * Players.length) > Beads.length
        const waitingForOtherPlayer = !synchronous && nextPlayer && nextPlayer.id !== accountData.id
        if (waitingForOtherPlayer) return renderWaitingForPlayerCard()
        if (movesLeft) return renderNextBeadButton()
        return <span style={{ marginRight: 15 }} />
    }

    useEffect(() => {
        if (Players.length && playerOrder) {
            // order players and find next player
            const players = [] as any
            playerOrder.split(',').forEach((playerId) => {
                players.push(Players.find((p) => p.id === +playerId))
            })
            setOrderedPlayers(players)
            setNextPlayer(players[Beads.length % Players.length])
            // set up timer if nextMoveDeadline active
            const deadlineActive = nextMoveDeadline && new Date(nextMoveDeadline) < new Date()
            if (deadlineActive) {
                timeLeftInMoveInterval.current = setInterval(() => {
                    const now = new Date().getTime()
                    const deadline = new Date(nextMoveDeadline).getTime()
                    setTimeLeftInMove((deadline - now) / 1000)
                }, 1000)
            }
        }
        return () => clearInterval(timeLeftInMoveInterval.current)
    }, [])

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
                            {Beads.map((bead, i) => (
                                <Row key={bead.id}>
                                    <BeadCard
                                        bead={bead}
                                        postId={id}
                                        postType={postData.type}
                                        beadIndex={bead.Link.index}
                                        location={location}
                                        selected={selectedBead && selectedBead.id === bead.id}
                                        toggleBeadComments={() => toggleBeadComments(bead)}
                                        // style={{
                                        //     marginRight:
                                        //         Beads.length > 2 && i === Beads.length - 1 ? 15 : 0,
                                        // }}
                                    />
                                    {i < Beads.length - 1 && (
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
                    settings={{
                        ...GlassBeadGame2,
                        allowedBeadTypes: [...GlassBeadGame2.allowedBeadTypes.split(',')],
                    }}
                    beads={Beads}
                    saveBead={(bead) => {
                        console.log('save next bead!', bead)
                        // setBeads([...beads, bead])
                        // setNoBeadsError(false)
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
                        const newPostData = { ...postData }
                        const bead = newPostData.Beads.find((b) => b.id === selectedBead.id)
                        bead.totalComments += value
                        bead.accountComment = value > 0
                        setPostData(newPostData)
                    }}
                    style={{ margin: '10px 0' }}
                />
            )}
        </Column>
    )
}

export default GlassBeadGame
