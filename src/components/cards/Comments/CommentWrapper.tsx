import CommentCard from '@components/cards/Comments/CommentCard'
import Column from '@components/Column'
import Row from '@components/Row'
import styles from '@styles/components/cards/Comments/CommentWrapper.module.scss'
import React from 'react'

function CommentWrapper(props: {
    comment: any
    postId: number
    depth: number
    highlightedCommentId: any
    location: string
    addComment: (newComment: string) => void
    removeComment: (comment: any) => void
    editComment: (comment: any, newText: string) => void
    updateCommentReactions: (commentId: number, reactionType: string, increment: boolean) => void
    setPostDraggable?: (payload: boolean) => void
}): JSX.Element {
    const {
        comment,
        postId,
        depth,
        highlightedCommentId,
        location,
        addComment,
        removeComment,
        editComment,
        updateCommentReactions,
        setPostDraggable,
    } = props

    return (
        <Row>
            {Array.from({ length: depth }, () => (
                <div className={styles.lines} />
            ))}
            <Column style={{ width: '100%' }}>
                <CommentCard
                    comment={comment}
                    highlighted={highlightedCommentId === comment.id}
                    removeComment={removeComment}
                    editComment={editComment}
                    updateCommentReactions={updateCommentReactions}
                    setPostDraggable={setPostDraggable}
                    location={location}
                />
                {comment.Comments.map((reply) => (
                    <CommentWrapper
                        key={reply.id}
                        comment={reply}
                        postId={postId}
                        depth={depth + 1}
                        highlightedCommentId={highlightedCommentId}
                        addComment={addComment}
                        removeComment={removeComment}
                        editComment={editComment}
                        updateCommentReactions={updateCommentReactions}
                        setPostDraggable={setPostDraggable}
                        location={location}
                    />
                ))}
            </Column>
        </Row>
    )
}

CommentWrapper.defaultProps = {
    setPostDraggable: null,
}

export default CommentWrapper
