/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { BaseUser, GAME_EVENTS, Peer, Post, baseUserData } from '@src/Helpers'
import PlayersSidebar from '@src/components/PlayersSidebar'
import TypingDots from '@src/components/animations/TypingDots'
import { AccountContext } from '@src/contexts/AccountContext'
import useStreaming from '@src/hooks/use-streaming'
import axios from 'axios'
import { orderBy, uniqBy } from 'lodash'
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import Button from '../../components/Button'
import Column from '../../components/Column'
import Row from '../../components/Row'
import LoadingWheel from '../../components/animations/LoadingWheel'
import MessageCard from '../../components/cards/Comments/MessageCard'
import {
    GameState,
    GameStatusIndicator,
    Plays,
    SaveableSteps,
} from '../../components/cards/GameCard'
import PostCard from '../../components/cards/PostCard/PostCard'
import CommentInput from '../../components/draft-js/CommentInput'

const GameSidebar: FC<{
    gameState: GameState
    setGameState: (gameState: GameState) => void
    post: Post
    setPost: (post: Post) => void
    emit: (action: string, data?: any) => void
}> = ({ post, setPost, emit, gameState, setGameState }) => {
    const game = post.game!
    const { play } = game
    const { accountData } = useContext(AccountContext)
    const isOwnPost = accountData && accountData.id === post.Creator?.id

    useEffect(() => {
        setGameState({
            dirty: false,
            game,
        })
    }, [game])

    return (
        <Column style={{ width: 300, padding: 10, borderRight: '1px solid #ededef' }}>
            <h2>
                Game <GameStatusIndicator status={play.status} />
            </h2>
            {isOwnPost && (
                <Row style={{ marginBottom: 10 }}>
                    <Button
                        color='blue'
                        text='Start'
                        onClick={
                            !gameState.dirty &&
                            (play.status === 'waiting' ||
                                play.status === 'paused' ||
                                play.status === 'ended' ||
                                play.status === 'stopped')
                                ? () => emit(GAME_EVENTS.outgoing.start)
                                : null
                        }
                    />
                    <Button
                        color='blue'
                        text='Pause'
                        style={{ marginLeft: 10 }}
                        onClick={
                            play.status === 'started'
                                ? () => emit(GAME_EVENTS.outgoing.pause)
                                : null
                        }
                    />
                    <Button
                        color='blue'
                        text='Skip'
                        style={{ marginLeft: 10 }}
                        onClick={
                            play.status === 'started' || play.status === 'paused'
                                ? () => emit(GAME_EVENTS.outgoing.skip)
                                : null
                        }
                    />
                    <Button
                        color='aqua'
                        text='Stop'
                        style={{ marginLeft: 10 }}
                        onClick={
                            play.status === 'started' || play.status === 'paused'
                                ? () => emit(GAME_EVENTS.outgoing.stop)
                                : null
                        }
                    />
                </Row>
            )}
            <Column
                style={{
                    padding: 5,
                    flexGrow: 1,
                }}
            >
                <SaveableSteps
                    initialGame={game}
                    saveState={(newGameState) => {
                        emit(GAME_EVENTS.outgoing.updateGame, { game: newGameState.game })
                        setPost({ ...post, game: newGameState.game })
                    }}
                    setState={
                        play.status === 'waiting' ||
                        play.status === 'ended' ||
                        play.status === 'stopped'
                            ? setGameState
                            : undefined
                    }
                    state={gameState}
                    stepContext={
                        play.status === 'started' || play.status === 'paused'
                            ? {
                                  stepId: play.step.id,
                                  variables: play.variables,
                                  players: game.players,
                              }
                            : undefined
                    }
                />
            </Column>
            <Plays post={post} onlyRelated />
        </Column>
    )
}

const PostChildren: FC<{
    post: Post
    postChildren: Post[]
    setChildren: (status: { postChildren: Post[]; childrenLimit: number }) => void
    limit: number
    loading: boolean
    emit: (event: string, data?) => void
    typing: BaseUser[]
}> = ({ post, emit, postChildren, setChildren, limit, loading, typing }) => {
    const { accountData } = useContext(AccountContext)
    const notMeTyping = typing.filter((u) => u.id !== accountData.id)

    return (
        <>
            <Column
                style={{
                    flexGrow: 1,
                    overflowY: 'scroll',
                    flexDirection: 'column-reverse',
                    scrollbarWidth: 'none',
                    padding: 10,
                }}
            >
                {postChildren.map((child) => (
                    <MessageCard
                        key={child.id}
                        message={child}
                        removeMessage={(message) => {
                            setChildren({
                                postChildren: postChildren.filter((c) => c.id !== message),
                                childrenLimit: limit - 1,
                            })
                        }}
                        setReplyParent={() => {
                            throw new Error('TODO')
                        }}
                        emit={emit}
                    />
                ))}
                {loading && (
                    <Row centerX centerY style={{ height: 50, flexShrink: 0 }}>
                        <LoadingWheel size={30} />
                    </Row>
                )}
            </Column>
            {!!notMeTyping.length && (
                <Row
                    style={{
                        width: '100%',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        padding: 10,
                    }}
                >
                    <p style={{ marginRight: 2 }}>
                        {notMeTyping.map((u) => u.name).join(', ')} typing
                    </p>
                    <TypingDots style={{ marginBottom: 1 }} />
                </Row>
            )}
            <div style={{ padding: 10 }}>
                <CommentInput
                    type='comment'
                    placeholder='Comment...'
                    links={{
                        parent: { id: post.id, type: post.type },
                    }}
                    maxChars={5000}
                    onSave={(comment) => {
                        setChildren({
                            postChildren: [comment, ...postChildren],
                            childrenLimit: limit + 1,
                        })
                    }}
                    signalTyping={(typingStatus) =>
                        emit(typingStatus ? 'user-started-typing' : 'user-stopped-typing', {
                            roomId: post.id,
                            user: { id: accountData.id, name: accountData.name },
                        })
                    }
                />
            </div>
        </>
    )
}

const GamePage: FC<{ post: Post; setPost: (post: Post) => void; onDelete: () => void }> = ({
    post,
    setPost,
    onDelete,
}) => {
    const { accountData, setToyboxCollapsed } = useContext(AccountContext)
    const socket = useMemo(() => io(config.apiWebSocketURL || ''), [])
    const userData = {
        id: accountData.id,
        handle: accountData.handle,
        name: accountData.name || 'Anonymous',
        flagImagePath: accountData.flagImagePath,
    }
    const [{ postChildren, childrenLimit }, setChildren] = useState<{
        postChildren: any[]
        childrenLimit: number
    }>({ postChildren: [], childrenLimit: 100 })
    const [childrenLoading, setChildrenLoading] = useState(true)
    const game = post.game!
    const [gameState, setGameState] = useState<GameState>({
        dirty: false,
        game,
    })
    const [allPresent, setPresent] = useState<Peer[]>([])
    const present = uniqBy(allPresent, ({ id }) => id)
    const [allTyping, setTyping] = useState<Peer[]>([])
    const typing = uniqBy(allTyping, ({ id }) => id)
    const ongoing =
        gameState.game.play.status === 'started' || gameState.game.play.status === 'paused'
    const streaming = useStreaming({
        socket,
        roomId: post.id,
        showVideos: true,
        onRefreshRequest: () => console.log('todo'),
        onStartStreaming: () => console.log('todo'),
        onStream: () => console.log('todo'),
        onStreamDisconnected: () => console.log('todo'),
    })

    async function getChildren(childrenIds?: number[]) {
        const {
            data: { children: changedChildren },
        } = await axios.get(
            `${config.apiURL}/post-children?postId=${post.id}${
                childrenIds ? `&childrenIds=${childrenIds}` : `&limit=${childrenLimit}&offset=${0}`
            }`
        )
        setChildren(({ postChildren: oldChildren, childrenLimit: oldChildrenLimit }) => {
            const newPostChildren = orderBy(
                uniqBy([...changedChildren, ...oldChildren], (p) => p.id),
                'createdAt',
                'desc'
            )
            return {
                postChildren: newPostChildren,
                childrenLimit: Math.max(oldChildrenLimit, newPostChildren.length),
            }
        })
        setChildrenLoading(false)
    }

    useEffect(() => {
        if (childrenLimit > postChildren.length) {
            setChildrenLoading(true)
            getChildren()
        }
    }, [childrenLimit])

    useEffect(() => {
        setToyboxCollapsed(true)
        socket.emit('outgoing-join-room', {
            roomId: post.id,
            userData,
        })
        // TODO
        socket.on('incoming-room-joined', (payload) => {
            const { socketId: incomingSocketId, usersInRoom } = payload
            streaming.mySocketIdRef.current = incomingSocketId

            console.log(usersInRoom)
            for (const user of usersInRoom) {
                // streaming.createPeer(user.socketId, user.userData)
            }
        })

        socket.on(GAME_EVENTS.incoming.updated, ({ game: newGame, changedChildren }) => {
            if (newGame) {
                setPost({ ...post, game: newGame })
            }
            getChildren(changedChildren.map(({ id }) => id))
        })

        socket.emit('enter-room', {
            roomId: post.id,
            user: { socketId: socket.id, ...baseUserData(accountData) },
        })
        // listen for events
        socket.on('room-entered', (usersInRoom) => setPresent(usersInRoom))
        socket.on('user-entering', (user) => setPresent((people) => [user, ...people]))
        socket.on('user-exiting', (socketId) =>
            setPresent((people) => people.filter((u) => u.socketId !== socketId))
        )
        socket.on('user-started-typing', (user) => setTyping((people) => [user, ...people]))
        socket.on('user-stopped-typing', (user) =>
            setTyping((people) => people.filter((u) => u.id !== user.id))
        )
    }, [])

    const emit = useCallback(
        (event: string, data) => socket.emit(event, { id: post.id, ...data }),
        []
    )

    return (
        <Row style={{ width: '100%', height: 'calc(100vh - 60px - 25px)', marginTop: '60px' }}>
            <GameSidebar
                post={post}
                emit={emit}
                setPost={setPost}
                gameState={gameState}
                setGameState={setGameState}
            />
            <Column style={{ height: '100%', flexGrow: 1, background: 'white' }}>
                <div style={{ padding: 10 }}>
                    <PostCard
                        post={post}
                        setPost={setPost}
                        onDelete={onDelete}
                        location='post-page'
                    />
                </div>
                <PostChildren
                    post={post}
                    postChildren={postChildren}
                    setChildren={setChildren}
                    limit={childrenLimit}
                    loading={childrenLoading}
                    emit={emit}
                    typing={typing}
                />
            </Column>
            <PlayersSidebar
                players={gameState.game.players}
                setPlayers={
                    ongoing
                        ? undefined
                        : (players) => {
                              const newGame = {
                                  ...gameState.game,
                                  players,
                              }
                              emit(GAME_EVENTS.outgoing.updateGame, { game: newGame })
                              setPost({ ...post, game: newGame })
                          }
                }
                present={present}
                streaming={streaming}
            />
        </Row>
    )
}

export default GamePage
