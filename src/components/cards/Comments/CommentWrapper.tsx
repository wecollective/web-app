import CommentCard from '@components/cards/Comments/CommentCard'
import CommentInput from '@components/cards/Comments/CommentInput'
import Column from '@components/Column'
import { scrollToElement } from '@src/Helpers'
import React, { useState } from 'react'

const CommentWrapper = (props: {
    postId: number
    comment: any
    highlightedCommentId: any
    addComment: (newComment: string) => void
    removeComment: (comment: any) => void
}): JSX.Element => {
    const { postId, comment, highlightedCommentId, addComment, removeComment } = props
    const [replyId, setReplyId] = useState(0)
    const [replyInputOpen, setReplyInputOpen] = useState(false)

    function toggleReplyInput(id?) {
        setReplyId(id || 0)
        Promise.all([setReplyInputOpen(!replyInputOpen)]).then(() => {
            const replyInput = document.getElementById(`reply-input-${comment.id}`)
            if (replyInput) scrollToElement(replyInput)
        })
    }

    return (
        <Column>
            <CommentCard
                comment={comment}
                highlighted={highlightedCommentId === comment.id}
                toggleReplyInput={() => toggleReplyInput()}
                removeComment={removeComment}
            />
            <Column style={{ marginLeft: 36 }}>
                {comment.Replies.map((reply) => (
                    <CommentCard
                        key={reply.id}
                        comment={reply}
                        highlighted={highlightedCommentId === reply.id}
                        toggleReplyInput={() => toggleReplyInput(reply.id)}
                        removeComment={removeComment}
                    />
                ))}
                {replyInputOpen && (
                    <CommentInput
                        id={`reply-input-${comment.id}`}
                        postId={postId}
                        commentId={comment.id}
                        replyId={replyId}
                        addComment={addComment}
                        close={() => setReplyInputOpen(false)}
                    />
                )}
            </Column>
        </Column>
    )
}

export default CommentWrapper
