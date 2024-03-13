/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { Post } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import axios from 'axios'
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Button from '../../components/Button'
import Column from '../../components/Column'
import Row from '../../components/Row'
import LoadingWheel from '../../components/animations/LoadingWheel'
import MessageCard from '../../components/cards/Comments/MessageCard'
import { GameState, SaveableSteps } from '../../components/cards/GameCard'
import PostCard from '../../components/cards/PostCard/PostCard'
import CommentInput from '../../components/draft-js/CommentInput'

const EVENTS = {
    outgoing: {
        updateGame: 'outgoing-update-play-game',
        start: 'outgoing-start-play',
        stop: 'outgoing-stop-play',

        skip: 'outgoing-skip-move',
        pause: 'outgoing-pause-move',
    },
    incoming: {
        updated: 'incoming-play-updated',
    },
} as const

const PlaySidebar: FC<{
    post: Post
    setPost: (post: Post) => void
    emit: (action: string, data?: any) => void
}> = ({ post, setPost, emit }) => {
    const play = post.play!
    const { game } = play
    const [gameState, setGameState] = useState<GameState>({
        dirty: false,
        game: play.game,
    })
    const { accountData } = useContext(AccountContext)
    const isOwnPost = accountData && accountData.id === post.Creator?.id
    const playerIds = useMemo(() => [accountData.id], [accountData.id])
    const navigate = useNavigate()

    useEffect(() => {
        setGameState({
            dirty: false,
            game: play.game,
        })
    }, [play.game])

    return (
        <Column style={{ width: 300, padding: 10, borderRight: '1px solid #ededef' }}>
            <h2>Play ({play.status})</h2>
            {isOwnPost && (
                <Row style={{ marginBottom: 10 }}>
                    <Button
                        color='blue'
                        text='Start'
                        onClick={
                            !gameState.dirty &&
                            (play.status === 'waiting' ||
                                play.status === 'ended' ||
                                play.status === 'stopped')
                                ? () => emit(EVENTS.outgoing.start)
                                : null
                        }
                    />
                    <Button
                        color='aqua'
                        text='Stop'
                        style={{ marginLeft: 10 }}
                        onClick={
                            play.status === 'started' ? () => emit(EVENTS.outgoing.stop) : null
                        }
                    />
                </Row>
            )}
            <Row style={{ flexGrow: 1 }}>
                <Column
                    style={{
                        padding: 5,
                        flexGrow: 1,
                    }}
                >
                    <SaveableSteps
                        initialGame={game}
                        saveState={(newGameState) => {
                            emit(EVENTS.outgoing.updateGame, { game: newGameState.game })
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
                            play.status === 'started'
                                ? {
                                      stepId: play.stepId,
                                      variables: play.variables,
                                      playerIds,
                                  }
                                : undefined
                        }
                    />
                    <Button
                        color='grey'
                        onClick={() => navigate(`/p/${play.gameId}`)}
                        text='View original game'
                    />
                </Column>
            </Row>
        </Column>
    )
}

const PostChildren: FC<{
    post: Post
    postChildren: Post[]
    setChildren: (children: Post[]) => void
    loading: boolean
    limit: number
    setLimit: (limit: number) => void
}> = ({ post, postChildren, setChildren, limit, setLimit, loading }) => {
    console.log(postChildren.length)
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
                            setChildren(postChildren.filter((c) => c.id !== message))
                            setLimit(limit - 1)
                        }}
                        setReplyParent={() => {
                            throw new Error('TODO')
                        }}
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
                        setChildren([...postChildren, comment])
                        setLimit(limit + 1)
                    }}
                />
            </div>
        </>
    )
}

const PlayPage: FC<{ post: Post; setPost: (post: Post) => void; onDelete: () => void }> = ({
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
    const [postChildren, setChildren] = useState<any[]>([])
    const [childrenLimit, setChildrenLimit] = useState(100)
    const [childrenLoading, setChildrenLoading] = useState(true)

    async function getChildren() {
        const {
            data: { children: newChildren },
        } = await axios.get(
            `${config.apiURL}/post-children?postId=${post.id}&limit=${childrenLimit}&offset=${0}`
        )
        setChildren(newChildren)
        setChildrenLoading(false)
    }

    useEffect(() => {
        setChildrenLoading(true)
        getChildren()
    }, [childrenLimit])

    useEffect(() => {
        setToyboxCollapsed(true)
        socket.emit('outgoing-join-room', {
            roomId: post.id,
            userData,
        })

        socket.on(EVENTS.incoming.updated, ({ play }) => {
            setPost({ ...post, play })
            getChildren()
        })
    }, [])

    const emit = useCallback(
        (event: string, data) => socket.emit(event, { id: post.id, ...data }),
        []
    )

    return (
        <Row style={{ width: '100%', height: 'calc(100vh - 60px - 25px)', marginTop: '60px' }}>
            <PlaySidebar post={post} emit={emit} setPost={setPost} />
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
                    setLimit={setChildrenLimit}
                    loading={childrenLoading}
                />
            </Column>
        </Row>
    )
}

export default PlayPage
