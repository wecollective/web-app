import StringBeadCard from '@components/cards/PostCard/StringBeadCard'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import NextBeadModal from '@components/modals/NextBeadModal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import ShowMoreLess from '@components/ShowMoreLess'
import Comments from '@src/components/cards/Comments/Comments'
import { AccountContext } from '@src/contexts/AccountContext'
import { formatTimeHHDDMMSS, pluralise } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/PostTypes/Weave.module.scss'
import { DNAIcon, PlusIcon, UsersIcon } from '@svgs/all'
import React, { useContext, useEffect, useRef, useState } from 'react'

// todo: clean up logic when GBG refactored
function Weave(props: {
    postData: any
    setPostData: (data: any) => void
    location: string
}): JSX.Element {
    const { postData, setPostData, location } = props
    const {
        id,
        text,
        Weave: weave,
        StringPosts: stringPosts,
        StringPlayers: stringPlayers,
    } = postData
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    const [nextBeadModalOpen, setNextBeadModalOpen] = useState(false)
    const [timeLeftInMove, setTimeLeftInMove] = useState(0)
    const timeLeftInMoveIntervalRef = useRef<any>(null)
    const [beadCommentsOpen, setBeadCommentsOpen] = useState(false)
    const [selectedBead, setSelectedBead] = useState<any>(null)
    stringPosts.sort((a, b) => a.Link.index - b.Link.index)
    const deadlinePassed = () => {
        return weave.nextMoveDeadline && new Date(weave.nextMoveDeadline) < new Date()
    }
    stringPlayers.sort((a, b) => a.UserPost.index - b.UserPost.index)
    const currentPlayer =
        weave.privacy === 'only-selected-users'
            ? stringPlayers[stringPosts.length % stringPlayers.length] // calculates current player index
            : null
    const playersPending = stringPlayers.filter((p) => p.UserPost.state === 'pending')
    const playersRejected = stringPlayers.filter((p) => p.UserPost.state === 'rejected')
    const playersReady = !playersPending.length && !playersRejected.length
    const totalMoves =
        weave.privacy === 'only-selected-users'
            ? weave.numberOfTurns * stringPlayers.length
            : weave.numberOfMoves
    const movesLeft = stringPosts.length < totalMoves
    const waitingForPlayer =
        weave.privacy === 'only-selected-users' && movesLeft && currentPlayer.state !== 'deleted'
    const nextMoveAvailable =
        weave.privacy === 'all-users-allowed'
            ? movesLeft
            : movesLeft && currentPlayer.id === accountData.id && currentPlayer.state !== 'deleted'

    useEffect(() => {
        if (weave.nextMoveDeadline && !deadlinePassed()) {
            timeLeftInMoveIntervalRef.current = setInterval(() => {
                const now = new Date().getTime()
                const deadline = new Date(weave.nextMoveDeadline).getTime()
                setTimeLeftInMove((deadline - now) / 1000)
            }, 1000)
        }
        return () => clearInterval(timeLeftInMoveIntervalRef.current)
    }, [postData])

    return (
        <Column>
            {weave.privacy === 'only-selected-users' ? (
                <Row centerY spaceBetween wrap style={{ marginBottom: 10, color: '#acacae' }}>
                    <FlagImageHighlights
                        type='user'
                        imagePaths={stringPlayers.map((p) => p.flagImagePath)}
                        imageSize={30}
                        text={`${stringPlayers.length} players`}
                        style={{ marginRight: 15 }}
                    />
                    {playersRejected.length > 0 && (
                        <Row centerY>
                            <p>
                                {playersRejected.length} player
                                {pluralise(playersRejected.length)} rejected the game
                            </p>
                            <FlagImageHighlights
                                type='user'
                                imagePaths={playersRejected.map((p) => p.flagImagePath)}
                                imageSize={30}
                                style={{ marginLeft: 5 }}
                            />
                        </Row>
                    )}
                    {weave.state === 'active' &&
                        weave.nextMoveDeadline &&
                        !deadlinePassed() &&
                        timeLeftInMove > 0 && (
                            <p style={{ color: 'black' }} title='Time left for next move'>
                                {formatTimeHHDDMMSS(timeLeftInMove)}
                            </p>
                        )}
                    {!playersRejected.length &&
                        weave.state !== 'cancelled' &&
                        playersPending.length > 0 && (
                            <Row centerY>
                                <p>Waiting for {playersPending.length}</p>
                                <FlagImageHighlights
                                    type='user'
                                    imagePaths={playersPending.map((p) => p.flagImagePath)}
                                    imageSize={30}
                                    style={{ marginLeft: 5 }}
                                />
                            </Row>
                        )}
                    {playersReady &&
                        weave.state !== 'cancelled' &&
                        currentPlayer.state !== 'deleted' && (
                            <Row>
                                {movesLeft ? (
                                    <ImageTitle
                                        type='user'
                                        imagePath={currentPlayer.flagImagePath}
                                        title={`${currentPlayer.name}'s move: ${
                                            stringPosts.length + 1
                                        }/${weave.numberOfTurns * stringPlayers.length}`}
                                        link={`/u/${currentPlayer.handle}/posts`}
                                    />
                                ) : (
                                    <p>Game finished</p>
                                )}
                            </Row>
                        )}
                    {weave.state === 'cancelled' ||
                        (currentPlayer.state === 'deleted' && <p>Game cancelled</p>)}
                </Row>
            ) : (
                <Row spaceBetween centerY style={{ marginBottom: 10, color: '#acacae' }}>
                    <Row centerY>
                        <UsersIcon style={{ width: 30, height: 30, marginRight: 5 }} />
                        <p>Open to all users</p>
                    </Row>
                    {movesLeft ? (
                        <p>
                            Waiting for move: {stringPosts.length + 1} / {weave.numberOfMoves}
                        </p>
                    ) : (
                        <p>Game finished</p>
                    )}
                </Row>
            )}
            {text && (
                <Column style={{ marginBottom: 10 }}>
                    <ShowMoreLess height={150}>
                        <DraftText stringifiedDraft={text} />
                    </ShowMoreLess>
                </Column>
            )}
            {playersReady && weave.state !== 'cancelled' && (
                <Row centerX>
                    <Scrollbars className={styles.beadDraw}>
                        <Row>
                            {stringPosts.map((bead, i) => (
                                <Row key={bead.id}>
                                    <StringBeadCard
                                        bead={bead}
                                        postId={id}
                                        postType={postData.type}
                                        beadIndex={i}
                                        location={location}
                                        selected={selectedBead && selectedBead.id === bead.id}
                                        toggleBeadComments={() => {
                                            if (beadCommentsOpen) {
                                                if (bead.id !== selectedBead.id)
                                                    setSelectedBead(bead)
                                                else setBeadCommentsOpen(false)
                                            } else {
                                                setSelectedBead(bead)
                                                setBeadCommentsOpen(true)
                                            }
                                        }}
                                        style={{
                                            marginRight:
                                                i === stringPosts.length - 1 &&
                                                !movesLeft &&
                                                stringPosts.length > 2
                                                    ? 15
                                                    : 0,
                                        }}
                                    />
                                    {(i < stringPosts.length - 1 || movesLeft) && (
                                        <Row centerY className={styles.beadDivider}>
                                            <DNAIcon />
                                        </Row>
                                    )}
                                </Row>
                            ))}
                            {nextMoveAvailable ? (
                                <button
                                    type='button'
                                    className={styles.newBeadButton}
                                    onClick={() => {
                                        if (!loggedIn) {
                                            setAlertMessage('Log in to create the bead')
                                            setAlertModalOpen(true)
                                        } else if (location !== 'preview')
                                            setNextBeadModalOpen(true)
                                    }}
                                    style={{ marginRight: stringPosts.length > 1 ? 15 : 0 }}
                                >
                                    <PlusIcon />
                                    <p>
                                        Click to create the {stringPosts.length ? 'next' : 'first'}{' '}
                                        bead
                                    </p>
                                </button>
                            ) : (
                                waitingForPlayer && (
                                    <Column
                                        centerX
                                        centerY
                                        className={styles.pendingBead}
                                        style={{
                                            marginRight: stringPosts.length > 1 ? 15 : 0,
                                        }}
                                    >
                                        <p>Waiting for</p>
                                        <ImageTitle
                                            type='user'
                                            imagePath={currentPlayer.flagImagePath}
                                            title={`${currentPlayer.name}...`}
                                            link={`/u/${currentPlayer.handle}/posts`}
                                            style={{ margin: '0 5px' }}
                                        />
                                    </Column>
                                )
                            )}
                            {(stringPosts.length > 2 || (stringPosts.length > 1 && movesLeft)) && (
                                <span style={{ marginLeft: -7, width: 7, flexShrink: 0 }} />
                            )}
                        </Row>
                    </Scrollbars>
                </Row>
            )}
            {nextBeadModalOpen && (
                <NextBeadModal
                    postData={postData}
                    setPostData={setPostData}
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
                        const bead = newPostData.StringPosts.find((b) => b.id === selectedBead.id)
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

export default Weave
