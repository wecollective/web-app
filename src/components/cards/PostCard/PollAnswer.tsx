import CheckBox from '@components/CheckBox'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import UserButton from '@components/UserButton'
import AudioCard from '@components/cards/PostCard/AudioCard'
import Audios from '@components/cards/PostCard/Audios'
import Images from '@components/cards/PostCard/Images'
import UrlCard from '@components/cards/PostCard/UrlCard'
import Urls from '@components/cards/PostCard/Urls'
import DraftText from '@components/draft-js/DraftText'
import Modal from '@components/modals/Modal'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/PollAnswer.module.scss'
import { CheckIcon } from '@svgs/all'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

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
    const { id, mediaTypes, text, accountPoints, accountVote, Creator, Reactions } = answer
    const [statModalOpen, setStatModalOpen] = useState(false)
    const state = answer.Link ? answer.Link.state : 'active'
    const weighted = type === 'weighted-choice'
    const votes = preview ? [] : Reactions.filter((r) => r.state === 'active')
    const mobileView = document.documentElement.clientWidth < 900

    return (
        <Column centerY className={`${styles.wrapper} ${state === 'done' && styles.done}`}>
            <Row spaceBetween>
                <Row centerY>
                    {preview ? (
                        <Column className={styles.index} style={{ backgroundColor: color }}>
                            <p>{index + 1}</p>
                        </Column>
                    ) : (
                        <Link
                            to={`/p/${id}`}
                            className={styles.index}
                            style={{ backgroundColor: color }}
                        >
                            <p>{index + 1}</p>
                        </Link>
                    )}
                    <UserButton
                        user={Creator}
                        imageSize={32}
                        fontSize={15}
                        style={{ marginRight: 5 }}
                    />
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
                                    images={votes.map((r) => r.Creator.flagImagePath).splice(0, 3)}
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
            <Column className={styles.blocks}>
                {text && <DraftText text={text} style={{ marginTop: -5 }} />}
                {preview ? (
                    <>
                        {answer.images.length > 0 && (
                            <Row>
                                {answer.images.map((image) => (
                                    <Column key={image.id} className={styles.image}>
                                        <img src={image.Image.url} alt='upload' />
                                    </Column>
                                ))}
                            </Row>
                        )}
                        {answer.audios.map((audio) => (
                            <Column key={audio.id} className={styles.audio}>
                                <AudioCard
                                    id={audio.id}
                                    url={audio.Audio.url}
                                    staticBars={400}
                                    location='new-post'
                                    style={{ height: 100 }}
                                />
                            </Column>
                        ))}
                        {answer.urls.map((url) => (
                            <UrlCard key={url.id} type='post' urlData={url} />
                        ))}
                    </>
                ) : (
                    <>
                        {mediaTypes.includes('url') && <Urls postId={id} />}
                        {mediaTypes.includes('image') && <Images postId={id} />}
                        {mediaTypes.includes('audio') && <Audios postId={id} />}
                    </>
                )}
            </Column>
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
