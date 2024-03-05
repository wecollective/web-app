/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/function-component-definition */
import {
    Game,
    Play,
    Post,
    STEP_TYPES,
    Step,
    StepContext,
    StepType,
    capitalise,
    uploadPost,
} from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import { CastaliaIcon, DeleteIcon, EditIcon, PlusIcon } from '@src/svgs/all'
import styles from '@styles/components/GameCard.module.scss'
import { cloneDeep } from 'lodash'
import React, { FC, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import Button from './Button'
import Column from './Column'
import Input from './Input'
import { PLAY_BUTTON_TEXT } from './PlayCard'
import Row from './Row'
import Modal from './modals/Modal'
import PlainButton from './modals/PlainButton'

const StepTitle: FC<{ prefix: string; step: Step; stepContext?: StepContext }> = ({
    prefix,
    step,
    stepContext,
}) => (
    <h5 className={styles.stepTitle}>
        {prefix} {capitalise(step.type)}{' '}
        {(() => {
            switch (step.type) {
                case 'post':
                    return `(${step.post.timeout})`
                case 'rounds':
                    if (stepContext && `${step.id}_round` in stepContext.variables) {
                        return (
                            <span style={{ color: '#00daa2', fontWeight: 'bold' }}>
                                {stepContext.variables[`${step.id}_round`]} of {step.amount}
                            </span>
                        )
                    }

                    return <>({step.amount}x)</>
                case 'turns':
                    if (stepContext && `${step.id}_player` in stepContext.variables) {
                        return (
                            <span style={{ color: '#00daa2', fontWeight: 'bold' }}>
                                player {stepContext.variables[`${step.id}_player`]}
                            </span>
                        )
                    }
                    return `(for each player)`
                case 'game':
                    return step.gameId
                default: {
                    const exhaustivenessCheck: never = step
                    throw exhaustivenessCheck
                }
            }
        })()}
    </h5>
)

const StepComponent: FC<{
    prefix: string
    step: Step
    updateStep: (step: Step) => void
    prependStep: (step: Step) => void
    appendStep: (step: Step) => void
    removeStep: () => void
    editable?: boolean
    stepContext?: StepContext
}> = ({ prefix, step, updateStep, prependStep, appendStep, removeStep, editable, stepContext }) => (
    <Column className={styles.stepWrapper}>
        <Row className={`${styles.step} ${stepContext?.stepId === step.id && styles.current}`}>
            <CreateStepButton onPrepend={prependStep} onAppend={appendStep} editable={editable} />
            <Column style={{ flexGrow: 1 }}>
                <Column className={styles.stepBody}>
                    <Row className={styles.stepHeader}>
                        <StepTitle prefix={prefix} step={step} stepContext={stepContext} />
                        {editable && (
                            <Row className={styles.stepActions}>
                                <UpdateStepButton step={step} onUpdate={updateStep} />
                                <PlainButton
                                    className={styles.close}
                                    onClick={removeStep}
                                    size={14}
                                >
                                    <DeleteIcon />
                                </PlainButton>
                            </Row>
                        )}
                    </Row>
                    {(() => {
                        switch (step.type) {
                            case 'post':
                                return (
                                    <div>
                                        <div>{step.post.title}</div>
                                        <div>{step.post.text}</div>
                                    </div>
                                )
                            case 'game':
                            case 'rounds':
                            case 'turns':
                                return null
                            default: {
                                const exhaustivenessCheck: never = step
                                throw exhaustivenessCheck
                            }
                        }
                    })()}
                </Column>
            </Column>
        </Row>
        {(() => {
            switch (step.type) {
                case 'post':
                case 'game':
                    return null
                case 'rounds':
                case 'turns':
                    return (
                        <div className={styles.stepsWrapper}>
                            <Steps
                                prefix={prefix}
                                steps={step.steps}
                                setSteps={(steps) => updateStep({ ...step, steps })}
                                editable={editable}
                                stepContext={stepContext}
                            />
                        </div>
                    )
                default: {
                    const exhaustivenessCheck: never = step
                    throw exhaustivenessCheck
                }
            }
        })()}
    </Column>
)

const Steps: FC<{
    prefix: string
    steps: Step[]
    setSteps: (steps: Step[]) => void
    editable?: boolean
    stepContext?: StepContext
}> = ({ prefix, steps, setSteps, editable, stepContext }) => {
    return steps.length ? (
        <div className={styles.steps}>
            {steps.map((step, i) => (
                <StepComponent
                    key={step.id}
                    prefix={`${prefix}${i + 1}.`}
                    step={step}
                    updateStep={(newStep) =>
                        setSteps(steps.map((s) => (s.id === newStep.id ? newStep : s)))
                    }
                    prependStep={(newStep) =>
                        setSteps([...steps.slice(0, i), newStep, ...steps.slice(i)])
                    }
                    appendStep={(newStep) =>
                        setSteps([...steps.slice(0, i + 1), newStep, ...steps.slice(i + 1)])
                    }
                    removeStep={() => setSteps([...steps.slice(0, i), ...steps.slice(i + 1)])}
                    editable={editable}
                    stepContext={stepContext}
                />
            ))}
        </div>
    ) : (
        <div className={styles.emptySteps}>
            {editable ? (
                <CreateStepButton onAppend={(step) => setSteps([...steps, step])} editable />
            ) : (
                <p style={{ textAlign: 'center' }}>no steps</p>
            )}
        </div>
    )
}

export type GameState = {
    game: Game
    dirty: boolean
}

export type GameCardProps = GameCardContentProps

const GameCard: FC<GameCardProps> = (props) => {
    return (
        <div className={styles.gameCard}>
            <Row centerY style={{ marginBottom: 10 }}>
                <CastaliaIcon className={styles.icon} />
                <h3 style={{ marginLeft: 5, color: 'gray' }}>Game</h3>
            </Row>
            <GameCardContent {...props} />
        </div>
    )
}

export type PlayLink = {
    id: string
    title: string
    play: Play
}

export type GameCardContentProps = {
    initialGame: Game
    state: GameState
    setState: (state: GameState) => void
    postContext?: {
        saveState: (state: GameState) => void
        post: Post
        plays?: PlayLink[]
    }
    collapsed?: boolean
    stepContext?: StepContext
    editable?: boolean
}

export const GameCardContent: FC<GameCardContentProps> = ({
    initialGame,
    state,
    setState,
    postContext,
    stepContext,
    collapsed,
    editable,
}) => {
    const navigate = useNavigate()
    const { accountData } = useContext(AccountContext)

    return (
        <Row style={{ ...(collapsed && { maxHeight: 300 }) }}>
            <Column
                style={{
                    padding: 5,
                    flexGrow: 1,
                    ...(postContext?.plays && { flexBasis: '50%' }),
                }}
            >
                <Row>
                    <h4 style={{ flexGrow: 1 }}>Steps</h4>
                </Row>
                <>
                    <Column style={{ overflowY: 'auto' }}>
                        <Steps
                            prefix=''
                            steps={state.game.steps}
                            setSteps={(steps) =>
                                setState({ ...state, game: { ...state.game, steps }, dirty: true })
                            }
                            editable={editable}
                            stepContext={stepContext}
                        />
                    </Column>
                    {postContext && state.dirty && (
                        <Row centerX style={{ marginTop: 10 }}>
                            <Button
                                color='grey'
                                onClick={() =>
                                    setState({
                                        ...state,
                                        game: initialGame,
                                        dirty: false,
                                    })
                                }
                                text='Cancel'
                                style={{ marginRight: 10 }}
                            />
                            <Button
                                color='blue'
                                onClick={async () =>
                                    postContext.saveState({ ...state, dirty: false })
                                }
                                text='Save'
                            />
                        </Row>
                    )}
                </>
            </Column>
            {postContext?.plays && (
                <Column style={{ padding: 5, flexGrow: 1, flexBasis: '50%' }}>
                    <h4>Plays</h4>
                    <Column style={{ overflowY: 'auto' }}>
                        {postContext.plays.length ? (
                            postContext.plays.map((play) => (
                                <Row centerY spaceBetween style={{ marginBottom: 5 }}>
                                    <a href={`/p/${play.id}`}>
                                        {play.title} ({play.play.status},{' '}
                                        {play.play.playerIds.length} players)
                                    </a>
                                    <Button
                                        style={{ marginLeft: 5 }}
                                        onClick={async () => {
                                            navigate(`/p/${play.id}`)
                                        }}
                                        size='medium'
                                        color='grey'
                                        text={PLAY_BUTTON_TEXT[play.play.status]}
                                    />
                                </Row>
                            ))
                        ) : (
                            <span>This game hasn&apos;t been played yet</span>
                        )}
                    </Column>
                    <Row style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                        <Button
                            color='blue'
                            onClick={async () => {
                                const play: Play = {
                                    playerIds: [accountData.id],
                                    gameId: postContext.post.id,
                                    game: state.game,
                                    status: 'waiting',
                                    variables: {},
                                }
                                const post = {
                                    type: 'post',
                                    title: `Play of "${postContext.post.title}"`,
                                    mediaTypes: 'play',
                                    mentions: [],
                                    spaceIds: postContext.post.DirectSpaces.map(
                                        (space) => space.id
                                    ),
                                    play,
                                    source: {
                                        type: 'post',
                                        id: postContext.post.id,
                                        // linkDescription: ''
                                    },
                                }
                                const res = await uploadPost(post)
                                navigate(`/p/${res.data.post.id}`)
                            }}
                            text='Start new play'
                        />
                    </Row>
                </Column>
            )}
        </Row>
    )
}

const CreateStepButton: FC<{
    onPrepend?: (step: Step) => void
    onAppend: (step: Step) => void
    editable?: boolean
}> = ({ onPrepend, onAppend, editable }) => {
    const [open, setOpen] = useState(false)
    const [prepend, setPrepend] = useState(false)

    return (
        <>
            <Row centerX className={`${styles.addStepButton} ${editable && styles.editable}`}>
                <PlainButton
                    size={14}
                    onClick={(e) => {
                        setPrepend(e.altKey)
                        setOpen(true)
                    }}
                >
                    <PlusIcon />
                </PlainButton>
            </Row>
            {open && (
                <CreateStepModal
                    onClose={() => setOpen(false)}
                    onCreate={(step) => (onPrepend && prepend ? onPrepend(step) : onAppend(step))}
                />
            )}
        </>
    )
}

const INFO: Record<StepType, string> = {
    game: 'Play a sub-game',
    post: 'Create a post',
    rounds: 'Repeat the same sequence',
    turns: 'Repeat for each player',
}

const CreateStepModal: FC<{ onClose: () => void; onCreate: (step: Step) => void }> = ({
    onClose,
    onCreate,
}) => {
    const [type, setType] = useState<StepType>()

    return (
        <Modal close={onClose} style={{ padding: 25 }}>
            {type ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        let step: Step
                        console.log(e.currentTarget.elements)
                        const elements = e.currentTarget.elements as any
                        const baseStep = {
                            id: uuid().replaceAll('-', ''),
                        }
                        switch (type) {
                            case 'post':
                                step = {
                                    ...baseStep,
                                    type: 'post',
                                    post: {
                                        title: elements.title.value,
                                        text: elements.text.value,
                                        timeout: elements.timeout.value,
                                    },
                                }
                                break
                            case 'rounds':
                                console.log(elements)
                                step = {
                                    ...baseStep,
                                    type: 'rounds',
                                    amount: elements.amount.value,
                                    steps: [],
                                }
                                break
                            case 'turns': {
                                step = {
                                    ...baseStep,
                                    type: 'turns',
                                    steps: [],
                                }
                                break
                            }
                            case 'game': {
                                step = {
                                    ...baseStep,
                                    type: 'game',
                                    gameId: elements.gameId.value,
                                }
                                break
                            }
                            default: {
                                const exhaustivenessCheck: never = type
                                throw exhaustivenessCheck
                            }
                        }
                        onCreate(step)
                        onClose()
                    }}
                >
                    <h3 style={{ textAlign: 'left', justifySelf: 'flex-start' }}>
                        Step: {INFO[type]}
                    </h3>
                    {(() => {
                        switch (type) {
                            case 'post':
                                return (
                                    <>
                                        <Input
                                            type='text'
                                            title='Title'
                                            name='title'
                                            style={{ marginBottom: 10 }}
                                        />
                                        <Input
                                            type='text-area'
                                            title='Text'
                                            name='text'
                                            style={{ marginBottom: 10 }}
                                        />
                                        <Input
                                            type='text'
                                            title='Timeout'
                                            name='timeout'
                                            defaultValue='1m'
                                            placeholder='e.g. 2d 5h 30m 15s'
                                            style={{ marginBottom: 10 }}
                                        />
                                    </>
                                )
                            case 'rounds':
                                return (
                                    <Input
                                        type='number'
                                        title='Repetitions'
                                        name='amount'
                                        defaultValue={5}
                                        style={{ marginBottom: 10 }}
                                    />
                                )
                            case 'game':
                                return (
                                    <Input
                                        type='number'
                                        title='Game ID'
                                        name='gameId'
                                        style={{ marginBottom: 10 }}
                                    />
                                )
                            case 'turns':
                                return <></>
                            default: {
                                const exhaustivenessCheck: never = type
                                throw exhaustivenessCheck
                            }
                        }
                    })()}
                    <Button color='blue' submit text='Add Step' />
                </form>
            ) : (
                <>
                    {STEP_TYPES.map((stepType) => (
                        <Button
                            key={stepType}
                            style={{ marginBottom: 10 }}
                            onClick={() => setType(stepType)}
                            color='grey'
                            text={capitalise(stepType)}
                        />
                    ))}
                </>
            )}
        </Modal>
    )
}

const UpdateStepButton: FC<{
    step: Step
    onUpdate: (step: Step) => void
}> = ({ step, onUpdate }) => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Row centerX className={styles.addStepButton}>
                <PlainButton size={14} onClick={() => setOpen(true)}>
                    <EditIcon />
                </PlainButton>
            </Row>
            {open && (
                <UpdateStepModal step={step} onClose={() => setOpen(false)} onUpdate={onUpdate} />
            )}
        </>
    )
}

const UpdateStepModal: FC<{ step: Step; onClose: () => void; onUpdate: (step: Step) => void }> = ({
    step,
    onClose,
    onUpdate,
}) => {
    return (
        <Modal close={onClose} style={{ padding: 25 }}>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    const newStep: Step = cloneDeep(step)
                    const elements = e.currentTarget.elements as any
                    switch (newStep.type) {
                        case 'post':
                            newStep.post.title = elements.title.value
                            newStep.post.text = elements.text.value
                            newStep.post.timeout = elements.timeout.value
                            break
                        case 'game':
                            newStep.gameId = elements.gameId.value
                            break
                        case 'rounds':
                            newStep.amount = elements.amount.value
                            break
                        case 'turns': {
                            break
                        }
                        default: {
                            const exhaustivenessCheck: never = newStep
                            throw exhaustivenessCheck
                        }
                    }
                    onUpdate(newStep)
                    onClose()
                }}
            >
                <h3 style={{ textAlign: 'left', justifySelf: 'flex-start' }}>
                    Step: {INFO[step.type]}
                </h3>
                {(() => {
                    switch (step.type) {
                        case 'post':
                            return (
                                <>
                                    <Input
                                        type='text'
                                        title='Title'
                                        name='title'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.post.title}
                                    />
                                    <Input
                                        type='text-area'
                                        title='Text'
                                        name='text'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.post.text}
                                    />
                                    <Input
                                        type='text'
                                        title='Timeout'
                                        name='timeout'
                                        placeholder='e.g. 2d 5h 30m 15s'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.post.timeout}
                                    />
                                </>
                            )
                        case 'game':
                            return (
                                <Input
                                    type='number'
                                    title='Game ID'
                                    name='gameId'
                                    defaultValue={step.gameId}
                                    style={{ marginBottom: 10 }}
                                />
                            )
                        case 'rounds':
                            return (
                                <Input
                                    type='number'
                                    title='Repetitions'
                                    name='amount'
                                    style={{ marginBottom: 10 }}
                                    defaultValue={step.amount}
                                />
                            )
                        case 'turns':
                            return <></>
                        default: {
                            const exhaustivenessCheck: never = step
                            throw exhaustivenessCheck
                        }
                    }
                })()}
                <Button color='blue' submit text='Save' />
            </form>
        </Modal>
    )
}

export default GameCard
