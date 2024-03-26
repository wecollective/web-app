/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { GAME_EVENTS, Post } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import axios from 'axios'
import { orderBy, uniqBy } from 'lodash'
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Button from '../../components/Button'
import Column from '../../components/Column'
import Row from '../../components/Row'
import LoadingWheel from '../../components/animations/LoadingWheel'
import MessageCard from '../../components/cards/Comments/MessageCard'
import { GameState, Remixes, SaveableSteps } from '../../components/cards/GameCard'
import PostCard from '../../components/cards/PostCard/PostCard'
import CommentInput from '../../components/draft-js/CommentInput'

const GameSidebar: FC<{
    post: Post
    setPost: (post: Post) => void
    emit: (action: string, data?: any) => void
}> = ({ post, setPost, emit }) => {
    const game = post.game!
    const { play } = game
    const [gameState, setGameState] = useState<GameState>({
        dirty: false,
        game,
    })
    const { accountData } = useContext(AccountContext)
    const isOwnPost = accountData && accountData.id === post.Creator?.id
    const playerIds = useMemo(() => [accountData.id], [accountData.id])
    const navigate = useNavigate()

    useEffect(() => {
        setGameState({
            dirty: false,
            game,
        })
    }, [game])

    return (
        <Column style={{ width: 300, padding: 10, borderRight: '1px solid #ededef' }}>
            <h2>Game ({play.status})</h2>
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
                        setGameState(newGameState)
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
                                  playerIds,
                              }
                            : undefined
                    }
                />
            </Column>
            {post.Originals && (
                <>
                    <h4>Original</h4>
                    <Row centerY spaceBetween style={{ marginBottom: 5 }}>
                        {post.Originals.Parent.game.play.status},{' '}
                        {post.Originals.Parent.game.play.playerIds.length} players
                        <Button
                            style={{ marginLeft: 5 }}
                            onClick={async () => {
                                navigate(`/p/${post.Originals!.Parent.id}`)
                            }}
                            size='medium'
                            color='grey'
                            text='Play'
                        />
                    </Row>
                </>
            )}
            <Remixes post={post} />
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
}> = ({ post, emit, postChildren, setChildren, limit, loading }) => {
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
        console.log(childrenLimit)
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

        socket.on(GAME_EVENTS.incoming.updated, ({ game, changedChildren }) => {
            if (game) {
                setPost({ ...post, game })
            }
            getChildren(changedChildren.map(({ id }) => id))
        })
    }, [])

    const emit = useCallback(
        (event: string, data) => socket.emit(event, { id: post.id, ...data }),
        []
    )

    return (
        <Row style={{ width: '100%', height: 'calc(100vh - 60px - 25px)', marginTop: '60px' }}>
            <GameSidebar post={post} emit={emit} setPost={setPost} />
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
                />
            </Column>
        </Row>
    )
}

export default GamePage
