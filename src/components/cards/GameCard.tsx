/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { Game, Post, Step, StepContext, StepType } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import { CastaliaIcon, DeleteIcon, EditIcon, PlusIcon } from '@src/svgs/all'
import styles from '@styles/components/GameCard.module.scss'
import axios from 'axios'
import { capitalize, cloneDeep } from 'lodash'
import { customAlphabet } from 'nanoid'
import React, { FC, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'
import { useDebounceValue } from 'usehooks-ts'
import Button from '../Button'
import Column from '../Column'
import DropDown from '../DropDown'
import Input from '../Input'
import Row from '../Row'
import Modal from '../modals/Modal'
import PlainButton from '../modals/PlainButton'
import PostCard from './PostCard/PostCard'

const getId = customAlphabet('abcdefghijklmnopqrstuvwxyz', 11)

const cookies = new Cookies()

const StepTitle: FC<{ prefix: string; step: Step; stepContext?: StepContext }> = ({
    prefix,
    step,
    stepContext,
}) => (
    <h5 className={styles.stepTitle}>
        {prefix} {step.name ?? step.type}{' '}
        {(() => {
            switch (step.type) {
                case 'move':
                    return null
                case 'sequence':
                    if (!step.repeat) {
                        return null
                    }

                    switch (step.repeat.type) {
                        case 'turns':
                            if (stepContext && step.name in stepContext.variables) {
                                return (
                                    <span style={{ color: '#00daa2', fontWeight: 'bold' }}>
                                        player {stepContext.variables[step.name]}
                                    </span>
                                )
                            }
                            return <>(repeat for {stepContext?.playerIds.length ?? 0} players)</>
                        case 'rounds':
                            if (stepContext && step.name in stepContext.variables) {
                                return (
                                    <span style={{ color: '#00daa2', fontWeight: 'bold' }}>
                                        step {stepContext.variables[step.name]} of{' '}
                                        {step.repeat.amount}
                                    </span>
                                )
                            }

                            return <>(repeat {step.repeat.amount} times)</>
                        default: {
                            const exhaustivenessCheck: never = step.repeat
                            throw exhaustivenessCheck
                        }
                    }

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
    prependSteps?: (steps: Step[]) => void
    appendSteps?: (steps: Step[]) => void
    removeStep?: () => void
    stepContext?: StepContext
}> = ({
    prefix,
    step,
    updateStep,
    prependSteps: prependStep,
    appendSteps: appendStep,
    removeStep,
    stepContext,
}) => (
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
                                        <div style={{ fontSize: 12 }}>{step.text}</div>
                                        <div style={{ fontSize: 12 }}>{step.timeout}</div>
                                    </div>
                                )
                            case 'sequence':
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
                    return null
                case 'sequence':
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
                    return null
                    // const exhaustivenessCheck: never = step
                    // throw exhaustivenessCheck
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
                    prependSteps={
                        setSteps &&
                        ((newSteps) =>
                            setSteps([...steps.slice(0, i), ...newSteps, ...steps.slice(i)]))
                    }
                    appendSteps={
                        setSteps &&
                        ((newSteps) =>
                            setSteps([
                                ...steps.slice(0, i + 1),
                                ...newSteps,
                                ...steps.slice(i + 1),
                            ]))
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
                <CreateStepButton onAppend={(newSteps) => setSteps([...steps, ...newSteps])} />
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
    <Column style={{ flexGrow: 1, flexShrink: 1, height: '100%' }}>
        <h4 style={{ marginBottom: 10 }}>Moves</h4>
        <Column style={{ flexShrink: 1, overflowY: 'auto' }}>
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

const CreateStepButton: FC<{
    onPrepend?: (steps: Step[]) => void
    onAppend?: (steps: Step[]) => void
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
    move: 'A single move',
    sequence: 'A sequence of moves',
}

const REPEAT_TYPES = ['', 'rounds', 'turns'] as const

type RepeatType = (typeof REPEAT_TYPES)[number]

const REPEAT_OPTIONS: Record<RepeatType, string> = {
    '': 'Do not repeat',
    rounds: 'A specific amount',
    turns: 'Once per player',
} as const

const CreateStepModal: FC<{ onClose: () => void; onCreate: (steps: Step[]) => void }> = ({
    onClose,
    onCreate,
}) => {
    const [action, setAction] = useState<StepType | 'game'>()
    const [repeatType, setRepeatType] = useState<RepeatType>('')

    const id = useMemo(() => getId(), [])

    return (
        <Modal close={onClose} style={{ padding: 25, overflow: 'visible' }}>
            {action === 'game' ? (
                <FindGame onCreate={onCreate} onClose={onClose} />
            ) : action ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        let step: Step
                        console.log(e.currentTarget.elements)
                        const elements = e.currentTarget.elements as any
                        const baseStep = {
                            id,
                            name: elements.name.value,
                        }
                        switch (action) {
                            case 'move':
                                step = {
                                    ...baseStep,
                                    type: 'move',
                                    // title: elements.title.value,
                                    text: elements.text.value,
                                    timeout: elements.timeout.value,
                                }

                                break
                            case 'sequence':
                                step = {
                                    ...baseStep,
                                    type: 'sequence',
                                    steps: [],
                                }
                                switch (repeatType) {
                                    case 'rounds':
                                        step.repeat = {
                                            type: 'rounds',
                                            amount: elements.amount.value,
                                        }
                                        break
                                    case 'turns':
                                        step.repeat = {
                                            type: 'turns',
                                        }
                                        break
                                    case '':
                                        break
                                    default: {
                                        const exhaustivenessCheck: never = repeatType
                                        throw exhaustivenessCheck
                                    }
                                }
                                break

                            default: {
                                const exhaustivenessCheck: never = action
                                throw exhaustivenessCheck
                            }
                        }
                        onCreate([step])
                        onClose()
                    }}
                >
                    <h3 style={{ textAlign: 'left', justifySelf: 'flex-start', marginBottom: 10 }}>
                        Step: {INFO[action]}
                    </h3>
                    <input type='hidden' name='id' value={id} />
                    <Input
                        type='text'
                        title='Name'
                        name='name'
                        defaultValue={id}
                        style={{ marginBottom: 10 }}
                    />
                    {(() => {
                        switch (action) {
                            case 'move':
                                return (
                                    <>
                                        {/* <Input
                                            type='text'
                                            title='Title'
                                            name='title'
                                            style={{ marginBottom: 10 }}
                                        /> */}
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
                            case 'sequence':
                                return (
                                    <>
                                        <DropDown
                                            title='Repetitions'
                                            style={{ marginBottom: 10 }}
                                            options={Object.values(REPEAT_OPTIONS)}
                                            selectedOption={REPEAT_OPTIONS[repeatType]}
                                            setSelectedOption={(newRepeatType) =>
                                                setRepeatType(
                                                    Object.entries(REPEAT_OPTIONS).find(
                                                        ([, value]) => value === newRepeatType
                                                    )![0] as RepeatType
                                                )
                                            }
                                        />
                                        {repeatType === 'rounds' && (
                                            <Input
                                                type='number'
                                                title='Times'
                                                name='amount'
                                                defaultValue={5}
                                                style={{ marginBottom: 10 }}
                                            />
                                        )}
                                    </>
                                )
                            default: {
                                const exhaustivenessCheck: never = action
                                throw exhaustivenessCheck
                            }
                        }
                    })()}
                    <Button color='blue' submit text={`Add ${capitalize(action)}`} />
                </form>
            ) : (
                <>
                    <Button
                        style={{ marginBottom: 10 }}
                        onClick={() => setAction('move')}
                        color='grey'
                        text='Move'
                    />
                    <Button
                        style={{ marginBottom: 10 }}
                        onClick={() => setAction('sequence')}
                        color='grey'
                        text='Sequence'
                    />
                    <Button
                        style={{ marginBottom: 10 }}
                        onClick={() => setAction('game')}
                        color='grey'
                        text='Game'
                    />
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
    const [repeatType, setRepeatType] = useState<RepeatType>(
        (step.type === 'sequence' && step.repeat?.type) || ''
    )

    return (
        <Modal close={onClose} style={{ padding: 25 }}>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    const newStep: Step = cloneDeep(step)
                    const elements = e.currentTarget.elements as any
                    newStep.name = elements.name.value
                    switch (newStep.type) {
                        case 'move':
                            // newStep.title = elements.title.value
                            newStep.text = elements.text.value
                            newStep.timeout = elements.timeout.value
                            break
                        case 'sequence': {
                            switch (repeatType) {
                                case 'rounds':
                                    newStep.repeat = {
                                        type: 'rounds',
                                        amount: elements.amount.value,
                                    }
                                    break
                                case 'turns':
                                    newStep.repeat = {
                                        type: 'turns',
                                    }
                                    break
                                case '':
                                    delete newStep.repeat
                                    break
                                default: {
                                    const exhaustivenessCheck: never = repeatType
                                    throw exhaustivenessCheck
                                }
                            }
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
                <Input
                    type='text'
                    title='Name'
                    name='name'
                    defaultValue={step.name}
                    style={{ marginBottom: 10 }}
                />
                {(() => {
                    switch (step.type) {
                        case 'move':
                            return (
                                <>
                                    {/* <Input
                                        type='text'
                                        title='Title'
                                        name='title'
                                        style={{ marginBottom: 10 }}
                                        defaultValue={step.title}
                                    /> */}
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
                        case 'sequence':
                            return (
                                <>
                                    <DropDown
                                        title='Repetitions'
                                        style={{ marginBottom: 10 }}
                                        options={Object.values(REPEAT_OPTIONS)}
                                        selectedOption={REPEAT_OPTIONS[repeatType]}
                                        setSelectedOption={(newRepeatType) =>
                                            setRepeatType(
                                                Object.entries(REPEAT_OPTIONS).find(
                                                    ([, value]) => value === newRepeatType
                                                )![0] as RepeatType
                                            )
                                        }
                                    />
                                    {repeatType === 'rounds' && (
                                        <Input
                                            type='number'
                                            title='Times'
                                            name='amount'
                                            defaultValue={5}
                                            style={{ marginBottom: 10 }}
                                        />
                                    )}
                                </>
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
                    <Column style={{ flexGrow: 1, overflowY: 'auto' }}>
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
                    <h4>Play</h4>
                    <Row centerY spaceBetween style={{ marginBottom: 5 }}>
                        {play.status}, {play.playerIds.length} players{' '}
                        <Button
                            style={{ marginLeft: 5 }}
                            onClick={async () => {
                                navigate(`/p/${post.id}`)
                            }}
                            size='medium'
                            color='blue'
                            text='Play'
                        />
                    </Row>
                    {post.Originals && (
                        <>
                            <h5>Original</h5>
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
            </Row>
        </GameCardWrapper>
    )
}

const mapSteps = (steps: Step[], cb: (step: Step) => void) =>
    steps.map((step) =>
        cb(step.type === 'move' ? step : { ...step, steps: mapSteps(step.steps, cb) })
    )

const replaceAll = (text: string | undefined, replacements: Record<string, string>) =>
    text === undefined
        ? undefined
        : Object.entries(replacements).reduce(
              (replacedText, [key, value]) => replacedText.replaceAll(key, value),
              text
          )

const remixSteps = (gameId: number, steps: Step[]) => {
    const ids: Record<string, string> = {}
    mapSteps(steps, (step) => {
        ids[step.id] = getId()
    })
    return mapSteps(steps, (step) => ({
        ...step,
        id: ids[step.id],
        name: replaceAll(step.name, ids),
        originalStep: {
            gameId,
            stepId: step.id,
        },
        ...(step.type === 'move' && {
            title: replaceAll(step.title, ids),
            text: replaceAll(step.text, ids),
        }),
    }))
}

export const Remixes = ({ post }: { post: Post }) => {
    const navigate = useNavigate()
    const { accountData, setCreatePostModalSettings } = useContext(AccountContext)

    const remixes = post.Remixes ?? []
    const game = post.game!

    return (
        <Column style={{ overflowY: 'auto', marginBottom: 10 }}>
            <h5>Remixes</h5>
            {remixes.length ? (
                remixes.map(({ Post: remix }) => (
                    <Row centerY spaceBetween style={{ marginBottom: 5 }}>
                        <a href={`/p/${remix.id}`}>
                            {remix.title} ({remix.game.play.status},{' '}
                            {remix.game.play.playerIds.length} players)
                        </a>
                        <Button
                            style={{ marginLeft: 5 }}
                            onClick={async () => {
                                navigate(`/p/${remix.id}`)
                            }}
                            size='medium'
                            color='grey'
                            text='Play'
                        />
                    </Row>
                ))
            ) : (
                <p className='grey'>This game has not been remixed so far.</p>
            )}
            <Row style={{ marginTop: 10, justifyContent: 'flex-end' }}>
                <Button
                    color='grey'
                    onClick={async () => {
                        const newGame: Game = {
                            steps: remixSteps(post.id, game.steps),
                            play: {
                                status: 'waiting',
                                playerIds: [accountData.id],
                                variables: {},
                            },
                        }
                        setCreatePostModalSettings({
                            type: 'post',
                            game: newGame,
                            title: `Remix of "${post.title}"`,
                        })
                    }}
                    text='Remix'
                />
            </Row>
        </Column>
    )
}

const FindGame = ({
    onCreate,
    onClose,
}: {
    onCreate: (steps: Step[]) => void
    onClose: () => void
}) => {
    const [gamePost, setGamePost] = useState<Post | undefined>()
    const [searchResults, setSearchResults] = useState<Post[]>([])
    const [search, setSearch] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const [debouncedSearch] = useDebounceValue(search, 500)

    useEffect(() => {
        if (debouncedSearch) {
            setLoading(true)
            ;(async () => {
                const res = await axios.get(
                    `${config.apiURL}/search?type=post&search=${encodeURIComponent(
                        debouncedSearch
                    )}&mediaType=game`,
                    { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
                )
                setSearchResults(res.data)
                setLoading(false)
            })()
        } else {
            setSearchResults([])
        }
    }, [debouncedSearch])

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                onCreate(remixSteps(gamePost!.id, gamePost!.game!.steps))
                onClose()
            }}
        >
            <h3 style={{ textAlign: 'left', justifySelf: 'flex-start', marginBottom: 10 }}>
                Import existing game
            </h3>
            <Column>
                {gamePost ? (
                    <div>
                        <Row centerY>
                            <div style={{ flexGrow: 1 }}>Selected game:</div>
                            <Button
                                onClick={() => setGamePost(undefined)}
                                style={{ marginBottom: 10 }}
                                color='grey'
                                text='Remove'
                            />
                        </Row>
                        <PostCard
                            style={{ marginBottom: 10 }}
                            location='preview'
                            post={gamePost}
                            setPost={() => {
                                throw new Error('TODO')
                            }}
                            onDelete={() => {
                                throw new Error('TODO')
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <Input
                            type='text'
                            placeholder='Search existing game'
                            name='gameSearch'
                            style={{ marginBottom: 10 }}
                            onChange={(value) => setSearch(value)}
                            value={search}
                        />
                        {debouncedSearch &&
                            (loading ? (
                                <>Loading...</>
                            ) : searchResults.length ? (
                                <>
                                    Results:
                                    {searchResults.map((post) => (
                                        <div>
                                            <button
                                                type='button'
                                                style={{
                                                    color: 'inherit',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                }}
                                                onClick={() => setGamePost(post)}
                                            >
                                                {post.title}
                                            </button>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>No results</>
                            ))}
                    </>
                )}
            </Column>
            <Button color='blue' submit disabled={!gamePost} text='Import' />
        </form>
    )
}
