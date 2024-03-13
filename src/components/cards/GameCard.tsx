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
import React, { FC, PropsWithChildren, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import Button from '../Button'
import Column from '../Column'
import Input from '../Input'
import Row from '../Row'
import Modal from '../modals/Modal'
import PlainButton from '../modals/PlainButton'

const StepTitle: FC<{ prefix: string; step: Step; stepContext?: StepContext }> = ({
    prefix,
    step,
    stepContext,
}) => (
    <h5 className={styles.stepTitle}>
        {prefix} {capitalise(step.type)}{' '}
        {(() => {
            switch (step.type) {
                case 'move':
                    return `(${step.timeout})`
                case 'rounds':
                    if (stepContext && step.name in stepContext.variables) {
                        return (
                            <span style={{ color: '#00daa2', fontWeight: 'bold' }}>
                                step {step.name}={stepContext.variables[step.name]} of {step.amount}
                            </span>
                        )
                    }

                    return (
                        <>
                            (for each step {step.name} of {step.amount})
                        </>
                    )
                case 'turns':
                    if (stepContext && step.name in stepContext.variables) {
                        return (
                            <span style={{ color: '#00daa2', fontWeight: 'bold' }}>
                                player {step.name}={stepContext.variables[step.name]} of{' '}
                                {stepContext.playerIds.length}
                            </span>
                        )
                    }
                    return (
                        <>
                            (for each player {step.name} of {stepContext?.playerIds.length ?? '?'})
                        </>
                    )
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
    updateStep?: (step: Step) => void
    prependStep?: (step: Step) => void
    appendStep?: (step: Step) => void
    removeStep?: () => void
    stepContext?: StepContext
}> = ({ prefix, step, updateStep, prependStep, appendStep, removeStep, stepContext }) => (
    <Column className={styles.stepWrapper}>
        <Row className={`${styles.step} ${stepContext?.stepId === step.id && styles.current}`}>
            <CreateStepButton onPrepend={prependStep} onAppend={appendStep} />
            <Column style={{ flexGrow: 1 }}>
                <Column className={styles.stepBody}>
                    <Row className={styles.stepHeader}>
                        <StepTitle prefix={prefix} step={step} stepContext={stepContext} />
                        {updateStep && removeStep && (
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
                            case 'move':
                                return (
                                    <div>
                                        <div>{step.title}</div>
                                        <div>{step.text}</div>
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
                case 'move':
                case 'game':
                    return null
                case 'rounds':
                case 'turns':
                    return (
                        <div className={styles.stepsWrapper}>
                            <Steps
                                prefix={prefix}
                                steps={step.steps}
                                setSteps={updateStep && ((steps) => updateStep({ ...step, steps }))}
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
    setSteps?: (steps: Step[]) => void
    stepContext?: StepContext
}> = ({ prefix, steps, setSteps, stepContext }) => {
    return steps.length ? (
        <div className={styles.steps}>
            {steps.map((step, i) => (
                <StepComponent
                    key={step.id}
                    prefix={`${prefix}${i + 1}.`}
                    step={step}
                    updateStep={
                        setSteps &&
                        ((newStep) =>
                            setSteps(steps.map((s) => (s.id === newStep.id ? newStep : s))))
                    }
                    prependStep={
                        setSteps &&
                        ((newStep) => setSteps([...steps.slice(0, i), newStep, ...steps.slice(i)]))
                    }
                    appendStep={
                        setSteps &&
                        ((newStep) =>
                            setSteps([...steps.slice(0, i + 1), newStep, ...steps.slice(i + 1)]))
                    }
                    removeStep={
                        setSteps && (() => setSteps([...steps.slice(0, i), ...steps.slice(i + 1)]))
                    }
                    stepContext={stepContext}
                />
            ))}
        </div>
    ) : (
        <div className={styles.emptySteps}>
            {setSteps ? (
                <CreateStepButton onAppend={(step) => setSteps([...steps, step])} />
            ) : (
                <p style={{ textAlign: 'center' }}>no steps</p>
            )}
        </div>
    )
}

export const SaveableSteps: FC<{
    initialGame: Game
    state: GameState
    setState?: (state: GameState) => void
    saveState: (state: GameState) => void
    stepContext?: StepContext
}> = ({ initialGame, state, setState, saveState, stepContext }) => (
    <Column style={{ flexGrow: 1 }}>
        <Row>
            <h4 style={{ flexGrow: 1 }}>Steps</h4>
        </Row>
        <Column style={{ overflowY: 'auto' }}>
            <Steps
                prefix=''
                steps={state.game.steps}
                setSteps={
                    setState &&
                    ((steps) =>
                        setState({
                            ...state,
                            game: { ...state.game, steps },
                            dirty: true,
                        }))
                }
                stepContext={stepContext}
            />
        </Column>
        {state.dirty && (
            <Row centerX style={{ marginTop: 10 }}>
                <Button
                    color='grey'
                    onClick={
                        setState &&
                        (() =>
                            setState({
                                ...state,
                                game: initialGame,
                                dirty: false,
                            }))
                    }
                    text='Cancel'
                    style={{ marginRight: 10 }}
                />
                <Button
                    color='blue'
                    onClick={async () => saveState!({ ...state, dirty: false })}
                    text='Save'
                />
            </Row>
        )}
    </Column>
)

export type GameState = {
    game: Game
    dirty: boolean
}

const GameCardWrapper: FC<PropsWithChildren> = ({ children }) => (
    <div className={styles.gameCard}>{children}</div>
)

const GameCardHeader: FC = () => (
    <Row centerY style={{ marginBottom: 10 }}>
        <CastaliaIcon className={styles.icon} />
        <h3 style={{ marginLeft: 5, color: 'gray' }}>Game</h3>
    </Row>
)

export const PLAY_BUTTON_TEXT: Record<Play['status'], string> = {
    waiting: 'Join',
    started: 'Join',
    paused: 'Join',
    ended: 'View',
    stopped: 'View',
}

const CreateStepButton: FC<{
    onPrepend?: (step: Step) => void
    onAppend?: (step: Step) => void
}> = ({ onPrepend, onAppend }) => {
    const [open, setOpen] = useState(false)
    const [prepend, setPrepend] = useState(false)

    return (
        <>
            <Row centerX className={`${styles.addStepButton} ${onAppend && styles.editable}`}>
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
            {onAppend && open && (
                <CreateStepModal
                    onClose={() => setOpen(false)}
                    onCreate={
                        onAppend &&
                        ((step) => (onPrepend && prepend ? onPrepend(step) : onAppend(step)))
                    }
                />
            )}
        </>
    )
}

const INFO: Record<StepType, string> = {
    game: 'Play a sub-game',
    move: 'Trigger a move',
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
                            case 'move':
                                step = {
                                    ...baseStep,
                                    type: 'move',
                                    title: elements.title.value,
                                    text: elements.text.value,
                                    timeout: elements.timeout.value,
                                }
                                break
                            case 'rounds':
                                console.log(elements)
                                step = {
                                    ...baseStep,
                                    type: 'rounds',
                                    name: elements.name.value,
                                    amount: elements.amount.value,
                                    steps: [],
                                }
                                break
                            case 'turns': {
                                step = {
                                    ...baseStep,
                                    type: 'turns',
                                    name: elements.name.value,
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
                            case 'move':
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
                                    <>
                                        <Input
                                            type='number'
                                            title='Repetitions'
                                            name='amount'
                                            defaultValue={5}
                                            style={{ marginBottom: 10 }}
                                        />
                                        <Input
                                            type='text'
                                            title='Name'
                                            name='name'
                                            defaultValue='R'
                                            style={{ marginBottom: 10 }}
                                        />
                                    </>
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
                                return (
                                    <Input
                                        type='text'
                                        title='Name'
                                        name='name'
                                        defaultValue='P'
                                        style={{ marginBottom: 10 }}
                                    />
                                )
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
                        case 'move':
                            newStep.title = elements.title.value
                            newStep.text = elements.text.value
                            newStep.timeout = elements.timeout.value
                            break
                        case 'game':
                            newStep.gameId = elements.gameId.value
                            break
                        case 'rounds':
                            newStep.amount = elements.amount.value
                            newStep.name = elements.name.value
                            break
                        case 'turns': {
                            newStep.name = elements.name.value
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
                        case 'move':
                            return (
                                <>
                                    <Input
                                        type='text'
                                        title='Title'
                                        name='title'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.title}
                                    />
                                    <Input
                                        type='text-area'
                                        title='Text'
                                        name='text'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.text}
                                    />
                                    <Input
                                        type='text'
                                        title='Timeout'
                                        name='timeout'
                                        placeholder='e.g. 2d 5h 30m 15s'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.timeout}
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
                                <>
                                    <Input
                                        type='number'
                                        title='Repetitions'
                                        name='amount'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.amount}
                                    />
                                    <Input
                                        type='text'
                                        title='Name'
                                        name='name'
                                        defaultValue={step.name}
                                        style={{ marginBottom: 10 }}
                                    />
                                </>
                            )
                        case 'turns':
                            return (
                                <Input
                                    type='number'
                                    title='Name'
                                    name='name'
                                    defaultValue={step.name}
                                    style={{ marginBottom: 10 }}
                                />
                            )

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

export const CreateGameCard: FC<{
    state: GameState
    setState?: (state: GameState) => void
}> = ({ state, setState }) => {
    return (
        <GameCardWrapper>
            <GameCardHeader />
            <Row style={{ flexGrow: 1 }}>
                <Column
                    style={{
                        padding: 5,
                        flexGrow: 1,
                    }}
                >
                    <Row>
                        <h4 style={{ flexGrow: 1 }}>Steps</h4>
                    </Row>
                    <Column style={{ overflowY: 'auto' }}>
                        <Steps
                            prefix=''
                            steps={state.game.steps}
                            setSteps={
                                setState &&
                                ((steps) =>
                                    setState({
                                        ...state,
                                        game: { ...state.game, steps },
                                        dirty: true,
                                    }))
                            }
                        />
                    </Column>
                </Column>
            </Row>
        </GameCardWrapper>
    )
}

export const GameCard: FC<{
    initialGame: Game
    state: GameState
    setState: (state: GameState) => void
    saveState: (state: GameState) => void
    post: Post
    collapsed: boolean
}> = ({ initialGame, state, setState, saveState, post, collapsed }) => {
    const navigate = useNavigate()
    const { play } = state.game

    return (
        <GameCardWrapper>
            <GameCardHeader />
            <Row style={{ flexGrow: 1, ...(collapsed && { maxHeight: 300 }) }}>
                <Column
                    style={{
                        padding: 5,
                        flexGrow: 1,
                        flexBasis: '50%',
                    }}
                >
                    <SaveableSteps
                        initialGame={initialGame}
                        saveState={saveState}
                        setState={setState}
                        state={state}
                    />
                </Column>
                <Column style={{ padding: 5, flexGrow: 1, flexBasis: '50%' }}>
                    <Row centerY spaceBetween style={{ marginBottom: 5 }}>
                        {play.status}, {play.playerIds.length} players{' '}
                        <Button
                            style={{ marginLeft: 5 }}
                            onClick={async () => {
                                navigate(`/p/${post.id}`)
                            }}
                            size='medium'
                            color='blue'
                            text={PLAY_BUTTON_TEXT[play.status]}
                        />
                    </Row>
                    {post.Original && (
                        <>
                            <h4>Original</h4>
                            <Row centerY spaceBetween style={{ marginBottom: 5 }}>
                                {post.Original.Parent.game.play.status},{' '}
                                {post.Original.Parent.game.play.playerIds.length} players
                                <Button
                                    style={{ marginLeft: 5 }}
                                    onClick={async () => {
                                        navigate(`/p/${post.Original!.Parent.id}`)
                                    }}
                                    size='medium'
                                    color='grey'
                                    text={PLAY_BUTTON_TEXT[post.Original.Parent.game.play.status]}
                                />
                            </Row>
                        </>
                    )}

                    <Spawns post={post} />
                </Column>
            </Row>
        </GameCardWrapper>
    )
}

export const Spawns = ({ post }: { post: Post }) => {
    const navigate = useNavigate()
    const { accountData } = useContext(AccountContext)
    const spawns = post.Spawns ?? []
    const game = post.game!

    return (
        <Column style={{ overflowY: 'auto' }}>
            <h4>Spawns</h4>
            {spawns.length ? (
                spawns.map(({ Post: spawn }) => (
                    <Row centerY spaceBetween style={{ marginBottom: 5 }}>
                        <a href={`/p/${spawn.id}`}>
                            {spawn.title} ({spawn.game.play.status},{' '}
                            {spawn.game.play.playerIds.length} players)
                        </a>
                        <Button
                            style={{ marginLeft: 5 }}
                            onClick={async () => {
                                navigate(`/p/${spawn.id}`)
                            }}
                            size='medium'
                            color='grey'
                            text={PLAY_BUTTON_TEXT[spawn.game.play.status]}
                        />
                    </Row>
                ))
            ) : (
                <p className='grey'>This game has not been spawned so far.</p>
            )}
            <Row style={{ marginTop: 10 }}>
                <Button
                    color='blue'
                    onClick={async () => {
                        const newGame: Game = {
                            ...game,
                            play: {
                                playerIds: [accountData.id],
                                status: 'waiting',
                                variables: {},
                            },
                        }
                        const newPost = {
                            type: 'post',
                            title: post.title,
                            text: post.text,
                            mediaTypes: 'game,play',
                            mentions: [],
                            spaceIds: post.DirectSpaces.map((space) => space.id),
                            game: newGame,
                            source: {
                                type: 'post',
                                id: post.id,
                                relationship: 'spawn',
                            },
                        }
                        const res = await uploadPost(newPost)
                        navigate(`/p/${res.data.post.id}`)
                    }}
                    text='Spawn new Game'
                />
            </Row>
        </Column>
    )
}
