/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/function-component-definition */
import { CastaliaIcon, PlusIcon } from '@src/svgs/all'
import styles from '@styles/components/GameEditor.module.scss'
import React, { FC, useState } from 'react'
import { v4 as uuid } from 'uuid'
import Button from './Button'
import CloseButton from './CloseButton'
import Column from './Column'
import DropDown from './DropDown'
import Input from './Input'
import Row from './Row'
import Modal from './modals/Modal'
import PlainButton from './modals/PlainButton'

type Step = {
    id: string
    name: string
} & (
    | {
          type: 'post'
          post: {
              title: string
              text: string
              duration: number
          }
      }
    | {
          type: 'repeat'
          amount: string
          steps: Step[]
      }
    | {
          type: 'turns'
          steps: Step[]
      }
)

type StepType = Step['type']

const STEP_TYPES = ['post', 'repeat', 'turns'] as const

type Game = {
    steps: Step[]
}

const EditStep: FC<{
    isFirst: boolean
    isLast: boolean
    step: Step
    updateStep: (step: Step) => void
    prependStep: (step: Step) => void
    appendStep: (step: Step) => void
    removeStep: () => void
}> = ({ isFirst, isLast, step, updateStep, prependStep, appendStep, removeStep }) => {
    return (
        <Column className={styles.stepWrapper}>
            {isFirst && <CreateStepButton onCreateStep={prependStep} displayOnHover />}
            <Row className={`${styles.step} ${styles[step.type]}`}>
                <Column style={{ flexGrow: 1 }}>
                    <h5>
                        {step.type}
                        {step.name && `: ${step.name}`}
                    </h5>
                    {(() => {
                        switch (step.type) {
                            case 'post':
                                return (
                                    <div>
                                        <div>{step.post.title}</div>
                                        <div>{step.post.text}</div>
                                        <div>Duration: {step.post.duration}</div>
                                    </div>
                                )
                            case 'repeat':
                                return (
                                    <div>
                                        <div>{step.amount} times</div>
                                        <EditSteps
                                            steps={step.steps}
                                            setSteps={(steps) => updateStep({ ...step, steps })}
                                        />
                                    </div>
                                )
                            case 'turns':
                                return (
                                    <div>
                                        <div>Repeat for each player</div>
                                        <EditSteps
                                            steps={step.steps}
                                            setSteps={(steps) => updateStep({ ...step, steps })}
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
                <CloseButton onClick={removeStep} size={14} />
            </Row>
            {!isLast && <CreateStepButton onCreateStep={appendStep} displayOnHover />}
        </Column>
    )
}

const EditSteps: FC<{ root?: boolean; steps: Step[]; setSteps: (steps: Step[]) => void }> = ({
    root,
    steps,
    setSteps,
}) => {
    return (
        <div className={root ? '' : styles.subSteps}>
            {steps.map((step, i) => (
                <EditStep
                    key={step.id}
                    step={step}
                    updateStep={(newStep) =>
                        setSteps(steps.map((s) => (s.id === newStep.id ? newStep : s)))
                    }
                    isFirst={i === 0}
                    isLast={i === steps.length - 1}
                    prependStep={(newStep) =>
                        setSteps([...steps.slice(0, i), newStep, ...steps.slice(i)])
                    }
                    appendStep={(newStep) =>
                        setSteps([...steps.slice(0, i + 1), newStep, ...steps.slice(i + 1)])
                    }
                    removeStep={() => setSteps([...steps.slice(0, i), ...steps.slice(i + 1)])}
                />
            ))}
            <CreateStepButton onCreateStep={(step) => setSteps([...steps, step])} />
        </div>
    )
}

const GameEditor: FC = () => {
    const [state, setState] = useState<Game>({ steps: [] })

    return (
        <div className={styles.gameEditor}>
            <CastaliaIcon className={styles.icon} />
            <EditSteps
                root
                steps={state.steps}
                setSteps={(steps) => setState({ ...state, steps })}
            />
        </div>
    )
}

const CreateStepButton: FC<{
    onCreateStep: (step: Step) => void
    displayOnHover?: boolean
}> = ({ onCreateStep, displayOnHover }) => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Row centerX className={displayOnHover && styles.addStepButton}>
                <PlainButton size={14} onClick={() => setOpen(true)}>
                    <PlusIcon />
                </PlainButton>
            </Row>
            {open && <CreateStepModal onClose={() => setOpen(false)} onCreateStep={onCreateStep} />}
        </>
    )
}

const INFO: Record<StepType, string> = {
    post: 'Create a post.',
    repeat: 'Repeat the same sequence.',
    turns: 'Repeat for each player.',
}

const CreateStepModal: FC<{ onClose: () => void; onCreateStep: (step: Step) => void }> = ({
    onClose,
    onCreateStep,
}) => {
    const [type, setType] = useState<StepType>('post')

    return (
        <Modal close={onClose} style={{ overflowY: 'visible' }}>
            <h3 style={{ marginBottom: 10 }}>New Game Step</h3>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    let step: Step
                    console.log(e.currentTarget.elements)
                    const elements = e.currentTarget.elements as any
                    const base = {
                        id: uuid(),
                        name: elements.name.value,
                    }
                    switch (type) {
                        case 'post':
                            step = {
                                ...base,
                                type: 'post',
                                post: {
                                    title: elements.title.value,
                                    text: elements.text.value,
                                    duration: elements.duration.value,
                                },
                            }
                            break
                        case 'repeat':
                            console.log(elements)
                            step = {
                                ...base,
                                type: 'repeat',
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
                        default: {
                            const exhaustivenessCheck: never = type
                            throw exhaustivenessCheck
                        }
                    }
                    onCreateStep(step)
                    onClose()
                }}
            >
                <Input
                    type='text'
                    title='Step name (optional)'
                    name='name'
                    style={{ marginBottom: 10 }}
                />
                <DropDown
                    title='Step Type'
                    options={STEP_TYPES}
                    selectedOption={type ?? ''}
                    setSelectedOption={(newType) => setType(newType as StepType)}
                    style={{ marginBottom: 10 }}
                />
                {type && (
                    <React.Fragment key={type}>
                        <div style={{ marginBottom: 10 }}>{INFO[type]}</div>
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
                                                title='Duration'
                                                name='duration'
                                                defaultValue='1m'
                                                placeholder='e.g. 2d 5h 30m 15s'
                                                style={{ marginBottom: 10 }}
                                            />
                                        </>
                                    )
                                case 'repeat':
                                    return (
                                        <Input
                                            type='number'
                                            title='Repetitions'
                                            name='amount'
                                            defaultValue={5}
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
                    </React.Fragment>
                )}
            </form>
        </Modal>
    )
}

export default GameEditor
