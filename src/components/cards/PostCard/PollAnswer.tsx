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
    remove: () => void
    onChange?: (value: boolean | number) => void
}): JSX.Element {
    const { index, type, answer, percentage, color, preview, removable, remove, onChange } = props
    const [statModalOpen, setStatModalOpen] = useState(false)
    const weighted = type === 'weighted-choice'
    const votes = answer.Reactions.filter((r) => r.state === 'active')
    const mobileView = document.documentElement.clientWidth < 900

    return (
        <Column centerY className={styles.wrapper}>
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
                        imagePath={answer.Creator.flagImagePath}
                        link={`/u/${answer.Creator.handle}`}
                        style={{ marginRight: 10 }}
                    />
                    {!mobileView && <p>{answer.text}</p>}
                </Row>
                <Row centerY style={{ flexShrink: 0 }}>
                    {!preview && (
                        <button
                            className={styles.statsButton}
                            type='button'
                            onClick={() => setStatModalOpen(true)}
                        >
                            {votes.length > 0 && (
                                <FlagImageHighlights
                                    type='user'
                                    imagePaths={votes.map((r) => r.Creator.flagImagePath)}
                                    imageSize={30}
                                    style={{ marginRight: 10 }}
                                />
                            )}
                            <p>{percentage}%</p>
                        </button>
                    )}
                    <Row centerY className={styles.input}>
                        {weighted && !preview && (
                            <Input
                                type='text'
                                value={answer.accountPoints}
                                disabled={preview}
                                onChange={(v) => onChange && onChange(+v.replace(/\D/g, ''))}
                                style={{ width: 60 }}
                            />
                        )}
                        {!weighted && !preview && (
                            <CheckBox
                                checked={answer.accountVote}
                                disabled={preview}
                                onChange={(v) => onChange && onChange(v)}
                            />
                        )}
                        {removable && (
                            <CloseButton size={20} onClick={remove} style={{ marginLeft: 5 }} />
                        )}
                    </Row>
                </Row>
            </Row>
            {mobileView && <p style={{ marginTop: 10 }}>{answer.text}</p>}
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
    onChange: null,
}

export default PollAnswer
