import React, { useContext, useState } from 'react'
import styles from '@styles/components/cards/CommentCard.module.scss'
import { Link } from 'react-router-dom'
import { timeSinceCreated, dateCreated, resizeTextArea } from '@src/Helpers'
import { AccountContext } from '@contexts/AccountContext'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import FlagImage from '@components/FlagImage'
import ShowMoreLess from '@components/ShowMoreLess'
import Markdown from '@components/Markdown'
import CommentInput from '@components/CommentInput'
import DeleteCommentModal from '@components/modals/DeleteCommentModal'

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
                        <Markdown text={text} fontSize={14} lineHeight='22px' />
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
    submit: (text: string, parentCommentId?: number) => void
    removeComment: (commentId: number, parentCommentId: number | null) => void
}): JSX.Element => {
    const { comment, scrollToInput, submit, removeComment } = props
    const [replyInputOpen, setReplyInputOpen] = useState(false)
    const [newReply, setNewReply] = useState('')
    const [replyError, setReplyError] = useState(false)

    function validateComment(text) {
        const invalid = text.length < 1 || text.length > 10000
        if (invalid) {
            setReplyError(true)
            return false
        }
        return true
    }

    function toggleReplyInput() {
        Promise.all([setReplyInputOpen(!replyInputOpen)]).then(() => {
            if (!replyInputOpen) {
                const replyInput = document.getElementById(`reply-input-${comment.id}`)
                if (replyInput) scrollToInput(replyInput)
            } else setReplyError(false)
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
                    <CommentInput
                        id={`reply-input-${comment.id}`}
                        value={newReply}
                        placeholder='new reply...'
                        error={replyError}
                        onChange={(e) => {
                            setNewReply(e.target.value)
                            setReplyError(false)
                            resizeTextArea(e.target)
                        }}
                        submit={() => {
                            if (validateComment(newReply)) {
                                submit(newReply, comment.id)
                                setNewReply('')
                            }
                        }}
                        style={{ marginBottom: 10 }}
                    />
                )}
            </Column>
        </div>
    )
}

export default CommentCard
