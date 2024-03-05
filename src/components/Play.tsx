/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { Play, PlayVariables, Post, Step } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import axios from 'axios'
import { omit } from 'lodash'
import React, { FC, useContext, useEffect, useMemo, useState } from 'react'
import Cookies from 'universal-cookie'
import Button from './Button'
import Column from './Column'
import { PlaySteps } from './GameCard'
import Row from './Row'
import LoadingWheel from './animations/LoadingWheel'
import MessageCard from './cards/Comments/MessageCard'
import PostCard from './cards/PostCard/PostCard'
import CommentInput from './draft-js/CommentInput'

const getFirstStep = (
    step: Step | undefined,
    variables: PlayVariables,
    playerIds: number[]
): undefined | { stepId: string; variables: PlayVariables } => {
    if (!step) {
        return undefined
    }
    switch (step.type) {
        case 'game':
            throw new Error('TODO')
        case 'post':
            return { stepId: step.id, variables }
        case 'rounds': {
            const firstStep = getFirstStep(step.steps[0], variables, playerIds)
            if (!firstStep) {
                return undefined
            }
            return {
                stepId: firstStep.stepId,
                variables: {
                    ...firstStep.variables,
                    [`${step.id}_round`]: firstStep.variables[`${step.id}_round`] ?? 1,
                },
            }
        }
        case 'turns': {
            const firstStep = getFirstStep(step.steps[0], variables, playerIds)
            if (!firstStep) {
                return undefined
            }
            return {
                stepId: firstStep.stepId,
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

const getNextStep = (
    steps: Step[],
    stepId: string,
    variables: PlayVariables,
    playerIds: number[]
): undefined | { stepId?: string; variables: PlayVariables } => {
    let currentFound = false
    let currentVariables = variables
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i]

        if (currentFound) {
            const nextStep = getFirstStep(step, currentVariables, playerIds)
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
                    const result = getNextStep(step.steps, stepId, currentVariables, playerIds)
                    if (!result) {
                        break
                    }

                    if (result.stepId) {
                        return result
                    }

                    const roundKey = `${step.id}_round`
                    const currentRound = currentVariables[roundKey] as number
                    if (currentRound < +step.amount) {
                        const firstStep = getFirstStep(
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
                    const result = getNextStep(step.steps, stepId, currentVariables, playerIds)
                    if (!result) {
                        break
                    }

                    if (result.stepId) {
                        return result
                    }

                    const playerKey = `${step.id}_player`
                    const currentPlayerId = result.variables[playerKey] as number
                    const currentPlayerIndex = playerIds.indexOf(currentPlayerId)
                    if (currentPlayerIndex < playerIds.length - 1) {
                        const firstStep = getFirstStep(
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
    state: PlayState
    setState: (state: PlayState) => void
    saveState: (state: PlayState) => void
}> = ({ post, state, setState, saveState }) => {
    const { accountData } = useContext(AccountContext)
    const isOwnPost = accountData && accountData.id === post.Creator?.id
    const playerIds = useMemo(() => [accountData.id], [accountData.id])
    const play = state.play!

    const firstStep = useMemo(
        () => getFirstStep(state.play.game.steps[0], {}, playerIds),
        [playerIds, state.play.game.steps]
    )

    return (
        <Column style={{ width: 300, padding: 10, borderRight: '1px solid #ededef' }}>
            <h2>Game</h2>
            <Row style={{ marginBottom: 10 }}>
                <Button
                    color='blue'
                    text='Start'
                    onClick={
                        !state.dirty &&
                        (play.status === 'waiting' ||
                            play.status === 'stopped' ||
                            play.status === 'ended') &&
                        firstStep
                            ? () => {
                                  saveState({
                                      ...state,
                                      play: {
                                          ...play,
                                          status: 'started',
                                          stepId: firstStep.stepId,
                                          variables: firstStep.variables,
                                      },
                                  })
                              }
                            : play.status === 'paused'
                            ? () => {
                                  saveState({
                                      ...state,
                                      play: {
                                          ...play,
                                          status: 'started',
                                      },
                                  })
                              }
                            : null
                    }
                />
                <Button
                    color='aqua'
                    text='Next'
                    style={{ marginLeft: 10 }}
                    onClick={
                        play.status === 'started' || play.status === 'paused'
                            ? () => {
                                  const nextStep = getNextStep(
                                      state.play.game.steps,
                                      play.stepId,
                                      play.variables,
                                      play.playerIds
                                  )
                                  if (nextStep?.stepId) {
                                      saveState({
                                          ...state,
                                          play: {
                                              ...play,
                                              stepId: nextStep.stepId,
                                              variables: nextStep.variables,
                                          },
                                      })
                                  } else {
                                      saveState({
                                          ...state,
                                          play: {
                                              game: play.game,
                                              gameId: play.gameId,
                                              playerIds: play.playerIds,
                                              status: 'ended',
                                              variables: {},
                                          },
                                      })
                                  }
                              }
                            : null
                    }
                />
                <Button
                    color='aqua'
                    text='Pause'
                    style={{ marginLeft: 10 }}
                    disabled={!play || play?.status === 'paused'}
                    onClick={
                        play.status === 'started'
                            ? () =>
                                  saveState({
                                      ...state,
                                      play: {
                                          ...play,
                                          status: 'paused',
                                      },
                                  })
                            : null
                    }
                />
                <Button
                    color='aqua'
                    text='Stop'
                    style={{ marginLeft: 10 }}
                    onClick={
                        play.status === 'started' || play.status === 'paused'
                            ? () =>
                                  saveState({
                                      ...state,
                                      play: {
                                          ...play,
                                          status: 'stopped',
                                      },
                                  })
                            : null
                    }
                />
            </Row>
            <PlaySteps
                initialGame={post.play!.game}
                state={{
                    dirty: state.dirty,
                    game: state.play.game,
                }}
                setState={
                    (isOwnPost && state.play.status === 'waiting') ||
                    state.play.status === 'stopped' ||
                    (state.play.status === 'ended' &&
                        (({ dirty, game }) =>
                            setState({
                                dirty,
                                play: {
                                    ...state.play,
                                    game,
                                },
                            })))
                }
                post={post}
                saveState={({ dirty, game }) =>
                    saveState({
                        dirty,
                        play: {
                            ...state.play,
                            game,
                        },
                    })
                }
                stepContext={
                    state.play?.status === 'started' || state.play?.status === 'paused'
                        ? {
                              stepId: state.play.stepId,
                              variables: state.play.variables,
                          }
                        : undefined
                }
            />
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

type PlayState = {
    dirty: boolean
    play: Play
}

const PlayRoom: FC<{ post: Post; setPost: (post: Post) => void; onDelete: () => void }> = ({
    post,
    setPost,
    onDelete,
}) => {
    const { accountData, setToyboxCollapsed } = useContext(AccountContext)

    useEffect(() => {
        setToyboxCollapsed(true)
    }, [])

    const play = post.play!
    const [playState, setPlayState] = useState<PlayState>(() => ({
        dirty: false,
        play,
    }))

    return (
        <Row style={{ width: '100%', height: 'calc(100vh - 60px - 25px)', marginTop: '60px' }}>
            <PlaySidebar
                post={post}
                state={playState}
                setState={setPlayState}
                saveState={async (state) => {
                    setPlayState(state)
                    await axios.post(
                        `${config.apiURL}/update-post`,
                        { id: post.id, play: state.play },
                        {
                            headers: {
                                Authorization: `Bearer ${new Cookies().get('accessToken')}`,
                            },
                        }
                    )
                    setPost({ ...post, play: state.play })
                }}
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
                <PostChildren post={post} />
            </Column>
        </Row>
    )
}

export default PlayRoom
