/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { Game, STEP_TYPES, Step, StepType, capitalise } from '@src/Helpers'
import { CastaliaIcon, ChevronDownIcon, DeleteIcon, EditIcon, PlusIcon } from '@src/svgs/all'
import styles from '@styles/components/GameEditor.module.scss'
import axios from 'axios'
import { cloneDeep } from 'lodash'
import React, { FC, useState } from 'react'
import Cookies from 'universal-cookie'
import { v4 as uuid } from 'uuid'
import Button from './Button'
import Column from './Column'
import Input from './Input'
import Row from './Row'
import Modal from './modals/Modal'
import PlainButton from './modals/PlainButton'

const StepTitle: FC<{ prefix: string; step: Step }> = ({ prefix, step }) => (
    <h5 className={styles.stepTitle}>
        {prefix} {capitalise(step.type)}{' '}
        {(() => {
            switch (step.type) {
                case 'post':
                    return `(${step.post.timeout})`
                case 'rounds':
                    return `(${step.amount}x)`
                case 'turns':
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
    editing: boolean
}> = ({ prefix, step, updateStep, prependStep, appendStep, removeStep, editing }) => (
    <Column className={styles.stepWrapper}>
        <Row className={styles.step}>
            {editing && <CreateStepButton onPrepend={prependStep} onAppend={appendStep} />}
            <Column style={{ flexGrow: 1 }}>
                <Column className={styles.stepBody}>
                    <Row className={styles.stepHeader}>
                        <StepTitle prefix={prefix} step={step} />
                        {editing && (
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
                        <Steps
                            prefix={prefix}
                            steps={step.steps}
                            setSteps={(steps) => updateStep({ ...step, steps })}
                            editing={editing}
                        />
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
    editing: boolean
}> = ({ prefix, steps, setSteps, editing }) => {
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
                    editing={editing}
                />
            ))}
        </div>
    ) : (
        <div className={styles.emptySteps}>
            {editing ? (
                <CreateStepButton onAppend={(step) => setSteps([...steps, step])} />
            ) : (
                <p style={{ textAlign: 'center' }}>no steps</p>
            )}
        </div>
    )
}

export type GameStatus = {
    postId?: number
    game: Game
    editing: boolean
    collapsed: boolean
}

export const useGameStatus = (initialStatus: GameStatus) => useState<GameStatus>(initialStatus)

const GameCard: FC<{
    initialGame: Game
    updateInitialGame?: () => void
    status: GameStatus
    setStatus: (status: GameStatus) => void
}> = ({ initialGame, status, setStatus, updateInitialGame }) => (
    <div className={styles.gameEditor}>
        <Row centerY>
            <CastaliaIcon className={styles.icon} />
            <h3 style={{ flexGrow: 1, textAlign: 'center', marginBottom: 10 }}>Game</h3>
            {status.collapsed ? (
                <PlainButton size={14} onClick={() => setStatus({ ...status, collapsed: false })}>
                    <ChevronDownIcon />
                </PlainButton>
            ) : (
                updateInitialGame &&
                !status.editing && (
                    <PlainButton size={14} onClick={() => setStatus({ ...status, editing: true })}>
                        <EditIcon />
                    </PlainButton>
                )
            )}
        </Row>
        {!status.collapsed && (
            <>
                <Steps
                    prefix=''
                    steps={status.game.steps}
                    setSteps={(steps) => setStatus({ ...status, game: { ...status.game, steps } })}
                    editing={status.editing}
                />
                {updateInitialGame && status.editing && (
                    <Row centerX>
                        <Button
                            color='grey'
                            onClick={() =>
                                setStatus({
                                    ...status,
                                    game: initialGame,
                                    editing: false,
                                })
                            }
                            text='Cancel'
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            color='blue'
                            onClick={async () => {
                                await axios.post(
                                    `${config.apiURL}/update-post`,
                                    { id: status.postId, game: status.game },
                                    {
                                        headers: {
                                            Authorization: `Bearer ${new Cookies().get(
                                                'accessToken'
                                            )}`,
                                        },
                                    }
                                )
                                updateInitialGame()
                                setStatus({
                                    ...status,
                                    editing: false,
                                })
                            }}
                            text='Save'
                        />
                    </Row>
                )}
            </>
        )}
    </div>
)

const CreateStepButton: FC<{
    onPrepend?: (step: Step) => void
    onAppend: (step: Step) => void
}> = ({ onPrepend, onAppend }) => {
    const [open, setOpen] = useState(false)
    const [prepend, setPrepend] = useState(false)

    return (
        <>
            <Row centerX className={styles.addStepButton}>
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
                        const base = {
                            id: uuid(),
                        }
                        switch (type) {
                            case 'post':
                                step = {
                                    ...base,
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
                                    ...base,
                                    type: 'rounds',
                                    amount: elements.amount.value,
                                    steps: [],
                                }
                                break
                            case 'turns': {
                                step = {
                                    ...base,
                                    type: 'turns',
                                    steps: [],
                                }
                                break
                            }
                            case 'game': {
                                step = {
                                    ...base,
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
