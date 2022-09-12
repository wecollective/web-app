import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import FlagImage from '@components/FlagImage'
import DeleteCommentModal from '@components/modals/DeleteCommentModal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { AccountContext } from '@contexts/AccountContext'
import { dateCreated, defaultErrorState, findDraftLength, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/CommentCard.module.scss'
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import DraftText from '../draft-js/DraftText'

const Comment = (props: {
    comment: any
    parentCommentId?: number | null
    toggleReplyInput: () => void
    removeComment: (commentId: number, parentCommentId: number | null) => void
}): JSX.Element => {
    const { comment, parentCommentId, toggleReplyInput, removeComment } = props
    const { id, text, createdAt, Creator } = comment
    const { loggedIn, accountData } = useContext(AccountContext)
    const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false)
    const isOwnComment = Creator.id === accountData.id

    return (
        <Column className={styles.comment}>
            <Row>
                <Link to={`/u/${Creator.handle}`}>
                    <FlagImage type='user' size={30} imagePath={Creator.flagImagePath} />
                </Link>
                <Column className={styles.text}>
                    <Row style={{ marginBottom: 2 }}>
                        <Link to={`/u/${Creator.handle}`} style={{ marginRight: 5 }}>
                            <p style={{ fontWeight: 600 }}>{Creator.name}</p>
                        </Link>
                        <p className='grey' title={dateCreated(createdAt)}>
                            {`• ${timeSinceCreated(createdAt)}`}
                        </p>
                    </Row>
                    <ShowMoreLess height={150} gradientColor='grey'>
                        <DraftText stringifiedDraft={text} />
                    </ShowMoreLess>
                </Column>
            </Row>
            {loggedIn && (
                <Row className={styles.buttons}>
                    <button type='button' onClick={toggleReplyInput}>
                        Reply
                    </button>
                    {isOwnComment && (
                        <button type='button' onClick={() => setDeleteCommentModalOpen(true)}>
                            Delete
                        </button>
                    )}
                </Row>
            )}
            {deleteCommentModalOpen && (
                <DeleteCommentModal
                    commentId={id}
                    parentCommentId={parentCommentId || null}
                    removeComment={removeComment}
                    close={() => setDeleteCommentModalOpen(false)}
                />
            )}
        </Column>
    )
}

Comment.defaultProps = {
    parentCommentId: null,
}

const CommentCard = (props: {
    comment: any
    scrollToInput: (input: any) => void
    submit: (
        comment: any,
        setComment: any,
        setKey: any,
        setLoading: any,
        mentions: any,
        parentCommentId?: number,
        callback?: any
    ) => void
    removeComment: (commentId: number, parentCommentId: number | null) => void
}): JSX.Element => {
    const { comment, scrollToInput, submit, removeComment } = props
    const [replyInputOpen, setReplyInputOpen] = useState(false)
    const [newReply, setNewReply] = useState({
        ...defaultErrorState,
        value: '',
        validate: (v) => {
            const errors: string[] = []
            const totalCharacters = findDraftLength(v)
            if (totalCharacters < 1) errors.push('Required')
            if (totalCharacters > 5000) errors.push('Must be less than 5K characters')
            return errors
        },
    })
    const [submitReplyLoading, setSubmitReplyLoading] = useState(false)
    const [editorKey, setEditoryKey] = useState(0)
    const [mentions, setMentions] = useState<any[]>([])

    function toggleReplyInput() {
        Promise.all([setReplyInputOpen(!replyInputOpen)]).then(() => {
            if (!replyInputOpen) {
                const replyInput = document.getElementById(`reply-input-${comment.id}`)
                if (replyInput) scrollToInput(replyInput)
            }
        })
    }

    return (
        <div className={styles.wrapper}>
            <Comment
                comment={comment}
                toggleReplyInput={toggleReplyInput}
                removeComment={removeComment}
            />
            <Column style={{ marginLeft: 36 }}>
                {comment.Replies.map((reply) => (
                    <Comment
                        key={reply.id}
                        comment={reply}
                        parentCommentId={comment.id}
                        toggleReplyInput={toggleReplyInput}
                        removeComment={removeComment}
                    />
                ))}
                {replyInputOpen && (
                    <DraftTextEditor
                        key={editorKey}
                        id={`reply-input-${comment.id}`}
                        type='comment'
                        stringifiedDraft={newReply.value}
                        maxChars={5000}
                        onChange={(value, userMentions) => {
                            if (value !== newReply.value)
                                setNewReply((c) => {
                                    return { ...c, value, state: 'default' }
                                })
                            setMentions(userMentions)
                        }}
                        onSubmit={() =>
                            submit(
                                newReply,
                                setNewReply,
                                setEditoryKey,
                                setSubmitReplyLoading,
                                mentions,
                                comment.id,
                                () => setReplyInputOpen(false)
                            )
                        }
                        submitLoading={submitReplyLoading}
                        state={newReply.state}
                        errors={newReply.errors}
                    />
                )}
            </Column>
        </div>
    )
}

export default CommentCard
