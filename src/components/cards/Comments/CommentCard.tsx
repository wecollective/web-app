import EditCommentModal from '@components/cards/Comments/EditCommentModal'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import FlagImage from '@components/FlagImage'
import DeleteCommentModal from '@components/modals/DeleteCommentModal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { AccountContext } from '@contexts/AccountContext'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/Comments/CommentCard.module.scss'
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'

const CommentCard = (props: {
    comment: any
    highlighted: boolean
    toggleReplyInput: () => void
    removeComment: (comment: any) => void
    editComment: (comment: any, newComment: any) => void
}): JSX.Element => {
    const { comment, highlighted, toggleReplyInput, removeComment, editComment } = props
    const { text, state, createdAt, updatedAt, Creator } = comment
    const { loggedIn, accountData } = useContext(AccountContext)
    const [editCommentModalOpen, setEditCommentModalOpen] = useState(false)
    const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false)
    const isOwnComment = Creator.id === accountData.id

    return (
        <Column
            id={`comment-${comment.id}`}
            className={`${styles.wrapper} ${highlighted && styles.highlighted}`}
        >
            <Row>
                <Link
                    to={`/u/${Creator.handle}`}
                    style={{ pointerEvents: Creator.handle ? 'auto' : 'none' }}
                >
                    <FlagImage type='user' size={30} imagePath={Creator.flagImagePath} />
                </Link>
                <Column className={styles.content}>
                    <Row style={{ marginBottom: 2 }}>
                        {state === 'account-deleted' ? (
                            <p className='grey' style={{ marginRight: 5 }}>
                                [Account deleted]
                            </p>
                        ) : (
                            <Link to={`/u/${Creator.handle}`} style={{ marginRight: 5 }}>
                                <p style={{ fontWeight: 600 }}>{Creator.name}</p>
                            </Link>
                        )}
                        <p className='grey' title={dateCreated(createdAt)}>
                            {`• ${timeSinceCreated(createdAt)}`}
                        </p>
                        {createdAt !== updatedAt && (
                            <p
                                className='grey'
                                title={`Edited at ${dateCreated(updatedAt)}`}
                                style={{ paddingLeft: 5 }}
                            >
                                *
                            </p>
                        )}
                    </Row>
                    {state !== 'account-deleted' && (
                        <ShowMoreLess height={250} gradientColor='grey'>
                            <DraftText
                                stringifiedDraft={state === 'deleted' ? '[comment deleted]' : text}
                                markdownStyles={`${styles.markdown} ${
                                    state === 'deleted' && styles.deleted
                                }`}
                            />
                        </ShowMoreLess>
                    )}
                </Column>
            </Row>
            {loggedIn && state === 'visible' && (
                <Row className={styles.buttons}>
                    <button type='button' onClick={toggleReplyInput}>
                        Reply
                    </button>
                    {isOwnComment && (
                        <>
                            <button type='button' onClick={() => setEditCommentModalOpen(true)}>
                                Edit
                            </button>
                            <button type='button' onClick={() => setDeleteCommentModalOpen(true)}>
                                Delete
                            </button>
                        </>
                    )}
                </Row>
            )}
            {editCommentModalOpen && (
                <EditCommentModal
                    comment={comment}
                    editComment={editComment}
                    close={() => setEditCommentModalOpen(false)}
                />
            )}
            {deleteCommentModalOpen && (
                <DeleteCommentModal
                    comment={comment}
                    removeComment={removeComment}
                    close={() => setDeleteCommentModalOpen(false)}
                />
            )}
        </Column>
    )
}

export default CommentCard
