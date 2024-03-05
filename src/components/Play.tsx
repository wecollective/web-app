/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { LeafStep, PlayVariables, Post, Step } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import axios from 'axios'
import { omit } from 'lodash'
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Button from './Button'
import Column from './Column'
import { GameState, SaveableSteps } from './GameCard'
import Row from './Row'
import LoadingWheel from './animations/LoadingWheel'
import MessageCard from './cards/Comments/MessageCard'
import PostCard from './cards/PostCard/PostCard'
import CommentInput from './draft-js/CommentInput'

const getFirstLeafStep = (
    step: Step | undefined,
    variables: PlayVariables,
    playerIds: number[]
): undefined | { step: LeafStep; variables: PlayVariables } => {
    if (!step) {
        return undefined
    }
    switch (step.type) {
        case 'game':
            throw new Error('TODO')
        case 'post':
            return { step, variables }
        case 'rounds': {
            const firstStep = getFirstLeafStep(step.steps[0], variables, playerIds)
            if (!firstStep) {
                return undefined
            }
            return {
                step: firstStep.step,
                variables: {
                    ...firstStep.variables,
                    [`${step.id}_round`]: firstStep.variables[`${step.id}_round`] ?? 1,
                },
            }
        }
        case 'turns': {
            const firstStep = getFirstLeafStep(step.steps[0], variables, playerIds)
            if (!firstStep) {
                return undefined
            }
            return {
                step: firstStep.step,
                variables: {
                    ...firstStep.variables,
                    [`${step.id}_player`]: firstStep.variables[`${step.id}_player`] ?? playerIds[0],
                },
            }
        }
        default: {
            const exhaustivenessCheck: never = step
            throw exhaustivenessCheck
        }
    }
}

const getNextLeafStep = (
    steps: Step[],
    stepId: string,
    variables: PlayVariables,
    playerIds: number[]
): undefined | { step?: LeafStep; variables: PlayVariables } => {
    let currentFound = false
    let currentVariables = variables
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i]

        if (currentFound) {
            const nextStep = getFirstLeafStep(step, currentVariables, playerIds)
            if (nextStep) {
                return nextStep
            }
        } else {
            switch (step.type) {
                case 'game':
                    throw new Error('TODO')
                case 'post':
                    if (step.id === stepId) {
                        currentFound = true
                    }
                    break
                case 'rounds': {
                    const result = getNextLeafStep(step.steps, stepId, currentVariables, playerIds)
                    if (!result) {
                        break
                    }

                    if (result.step) {
                        return result
                    }

                    const roundKey = `${step.id}_round`
                    const currentRound = currentVariables[roundKey] as number
                    if (currentRound < +step.amount) {
                        const firstStep = getFirstLeafStep(
                            step,
                            {
                                ...result.variables,
                                [roundKey]: currentRound + 1,
                            },
                            playerIds
                        )
                        if (firstStep) {
                            return firstStep
                        }
                    }

                    currentFound = true
                    currentVariables = omit(currentVariables, roundKey)
                    break
                }
                case 'turns': {
                    const result = getNextLeafStep(step.steps, stepId, currentVariables, playerIds)
                    if (!result) {
                        break
                    }

                    if (result.step) {
                        return result
                    }

                    const playerKey = `${step.id}_player`
                    const currentPlayerId = result.variables[playerKey] as number
                    const currentPlayerIndex = playerIds.indexOf(currentPlayerId)
                    if (currentPlayerIndex < playerIds.length - 1) {
                        const firstStep = getFirstLeafStep(
                            step,
                            {
                                ...result.variables,
                                [playerKey]: playerIds[currentPlayerIndex + 1],
                            },
                            playerIds
                        )
                        if (firstStep) {
                            return firstStep
                        }
                    }

                    currentFound = true
                    currentVariables = omit(currentVariables, playerKey)
                    break
                }
                default: {
                    const exhaustivenessCheck: never = step
                    throw exhaustivenessCheck
                }
            }
        }
    }

    if (currentFound) {
        return { variables: currentVariables }
    }

    return undefined
}

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

    const firstStep = useMemo(
        () => getFirstLeafStep(play.game.steps[0], {}, playerIds),
        [playerIds, play.game.steps]
    )

    return (
        <Column style={{ width: 300, padding: 10, borderRight: '1px solid #ededef' }}>
            <h2>Play ({play.status})</h2>
            {isOwnPost && (
                <Row style={{ marginBottom: 10 }}>
                    <Button
                        color='blue'
                        text='Start'
                        onClick={
                            (!gameState.dirty &&
                                (play.status === 'waiting' ||
                                    play.status === 'ended' ||
                                    play.status === 'stopped') &&
                                firstStep) ||
                            play.status === 'paused'
                                ? () => emit('start')
                                : null
                        }
                    />
                    <Button
                        color='aqua'
                        text='Next'
                        style={{ marginLeft: 10 }}
                        onClick={
                            play.status === 'started' || play.status === 'paused'
                                ? () => emit('next')
                                : null
                        }
                    />
                    <Button
                        color='aqua'
                        text='Pause'
                        style={{ marginLeft: 10 }}
                        disabled={!play || play?.status === 'paused'}
                        onClick={play.status === 'started' ? () => emit('pause') : null}
                    />
                    <Button
                        color='aqua'
                        text='Stop'
                        style={{ marginLeft: 10 }}
                        onClick={
                            play.status === 'started' || play.status === 'paused'
                                ? () => emit('stop')
                                : null
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
                            emit('update-game', { game: newGameState.game })
                            setGameState(newGameState)
                        }}
                        setState={setGameState}
                        state={gameState}
                        stepContext={
                            play.status === 'started' || play.status === 'paused'
                                ? {
                                      stepId: play.step.id,
                                      variables: play.variables,
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
}> = ({ post }) => {
    const [totalComments, setTotalComments] = useState(post.totalComments)
    const [comments, setComments] = useState<any[]>([])
    const [remainingComments, setRemainingComments] = useState(0)
    const [loading, setLoading] = useState(true)

    function incrementTotalComments(value) {
        setTotalComments(totalComments + value)
    }

    function getComments(offset) {
        if (!offset) setLoading(true)
        axios
            .get(`${config.apiURL}/post-comments?postId=${post.id}&offset=${offset}&limit=${100}`)
            .then((res) => {
                const newComments = offset ? [...res.data.comments, ...comments] : res.data.comments
                setComments(newComments)
                setRemainingComments(res.data.totalChildren - newComments.length)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function findCommentById(children: any[], commentId: number) {
        for (let i = 0; i < children.length; i += 1) {
            if (children[i].id === commentId) return children[i]
            const match = findCommentById(children[i].Comments, commentId)
            if (match) return match
        }
        return null
    }

    function addComment(comment) {
        const { parent } = comment.links
        if (parent.id === post.id) setComments([...comments, comment])
        else {
            const newComments = [...comments]
            const parentComment = findCommentById(newComments, parent.id)
            if (parentComment) parentComment.Comments.unshift(comment)
            setComments(newComments)
        }
        incrementTotalComments(1)
    }

    function removeComment(comment) {
        incrementTotalComments(-1)
        const newComments = [...comments]
        const removedComment = findCommentById(newComments, comment.id)
        removedComment.state = 'deleted'
        setComments(newComments)
    }

    useEffect(() => {
        setComments([])
        if (totalComments) getComments(0)
        else setLoading(false)
    }, [])

    const reverseComments = useMemo(() => [...comments].reverse(), [comments])

    return (
        <>
            <Column
                style={{
                    flexGrow: 1,
                    overflowY: 'scroll',
                    flexDirection: 'column-reverse',
                    scrollbarWidth: 'none',
                }}
            >
                {reverseComments.map((comment) => (
                    <MessageCard
                        key={comment.id}
                        message={comment}
                        removeMessage={removeComment}
                        setReplyParent={() => console.log('wtf')}
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
                    onSave={(newComment) => addComment(newComment)}
                />
            </div>
        </>
    )
}

const PlayRoom: FC<{ post: Post; setPost: (post: Post) => void; onDelete: () => void }> = ({
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

    useEffect(() => {
        setToyboxCollapsed(true)
        socket.emit('outgoing-join-room', {
            roomId: post.id,
            userData,
        })

        socket.on('play:incoming-updated', ({ play }) => {
            console.log(play)
            setPost({ ...post, play })
        })
    }, [])

    const emit = useCallback(
        (action, data) => socket.emit(`play:outgoing-${action}`, { id: post.id, ...data }),
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
                <PostChildren post={post} />
            </Column>
        </Row>
    )
}

export default PlayRoom
