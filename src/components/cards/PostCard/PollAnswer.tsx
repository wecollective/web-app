import CheckBox from '@components/CheckBox'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import Modal from '@components/modals/Modal'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import { CheckIcon } from '@src/svgs/all'
import styles from '@styles/components/cards/PostCard/PollAnswer.module.scss'
import React, { useState } from 'react'

function PollAnswer(props: {
    index: number
    type: string // 'single-choice' | 'multiple-choice' | 'weighted-choice'
    answer: any
    percentage: number
    color: string
    preview?: boolean
    removable: boolean
    style?: any
    remove: () => void
    toggleDone?: () => void
    onChange?: (value: boolean | number) => void
}): JSX.Element {
    const {
        index,
        type,
        answer,
        percentage,
        color,
        preview,
        removable,
        style,
        remove,
        toggleDone,
        onChange,
    } = props
    const { text, accountPoints, accountVote, state, Creator, Reactions } = answer
    const [statModalOpen, setStatModalOpen] = useState(false)
    const weighted = type === 'weighted-choice'
    const votes = Reactions.filter((r) => r.state === 'active')
    const mobileView = document.documentElement.clientWidth < 900

    return (
        <Column
            centerY
            className={`${styles.wrapper} ${state === 'done' && styles.done}`}
            style={style}
        >
            <Row spaceBetween>
                <Row centerY style={{ width: '100%', marginRight: 10 }}>
                    <Column
                        centerX
                        centerY
                        className={styles.index}
                        style={{ backgroundColor: color }}
                    >
                        <p>{index + 1}</p>
                    </Column>
                    <FlagImage
                        type='user'
                        imagePath={Creator.flagImagePath}
                        link={`/u/${Creator.handle}`}
                        style={{ marginRight: 10 }}
                    />
                    {!mobileView && <p>{text}</p>}
                    {state === 'done' && <CheckIcon className={styles.check} />}
                </Row>
                <Row centerY style={{ flexShrink: 0 }}>
                    {!preview && (
                        <Row className={styles.stats}>
                            <button
                                type='button'
                                className={styles.statButton}
                                onClick={() => setStatModalOpen(true)}
                                aria-label='Open stats'
                            />
                            {votes.length > 0 && (
                                <FlagImageHighlights
                                    type='user'
                                    imagePaths={votes.map((r) => r.Creator.flagImagePath)}
                                    imageSize={30}
                                    style={{ marginRight: 10 }}
                                />
                            )}
                            <p>{percentage}%</p>
                        </Row>
                    )}
                    <Row centerY className={styles.input}>
                        {weighted && !preview && (
                            <Input
                                type='text'
                                value={accountPoints}
                                disabled={preview}
                                onChange={(v) => onChange && onChange(+v.replace(/\D/g, ''))}
                                style={{ width: 60 }}
                            />
                        )}
                        {!weighted && !preview && (
                            <CheckBox
                                checked={accountVote}
                                disabled={preview}
                                onChange={(v) => onChange && onChange(v)}
                            />
                        )}
                        {removable && toggleDone && (
                            <button
                                type='button'
                                onClick={toggleDone}
                                className={styles.toggleDoneButton}
                            >
                                <CheckIcon />
                            </button>
                        )}
                        {removable && (
                            <CloseButton size={20} onClick={remove} style={{ marginLeft: 5 }} />
                        )}
                    </Row>
                </Row>
            </Row>
            {mobileView && <p style={{ marginTop: 10 }}>{text}</p>}
            {statModalOpen && (
                <Modal centerX close={() => setStatModalOpen(false)}>
                    <h1>Votes</h1>
                    {!votes.length && <p style={{ margin: 0 }}>No votes yet...</p>}
                    {votes.reverse().map((vote) => (
                        <Row centerY style={{ marginBottom: 10 }}>
                            {weighted && (
                                <p style={{ fontWeight: 800, marginRight: 10 }}>{vote.value} ↑</p>
                            )}
                            <ImageTitle
                                type='user'
                                imagePath={vote.Creator.flagImagePath}
                                title={vote.Creator.name}
                                fontSize={16}
                                link={`/u/${vote.Creator.handle}`}
                                style={{ marginRight: 5 }}
                            />
                            <p className='grey' title={dateCreated(vote.createdAt)}>
                                • {timeSinceCreated(vote.createdAt)}
                            </p>
                        </Row>
                    ))}
                </Modal>
            )}
        </Column>
    )
}

PollAnswer.defaultProps = {
    preview: false,
    toggleDone: null,
    onChange: null,
    style: null,
}

export default PollAnswer
