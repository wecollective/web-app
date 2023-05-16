import CommentInput from '@components/cards/Comments/CommentInput'
import CommentWrapper from '@components/cards/Comments/CommentWrapper'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { scrollToElement } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Comments(props: {
    postId: number
    type?: string
    location?: string
    totalComments: number
    incrementTotalComments: (value: number) => void
    style?: any
}): JSX.Element {
    const { postId, type, location, totalComments, incrementTotalComments, style } = props
    const { accountData, loggedIn } = useContext(AccountContext)
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()
    const urlParams = Object.fromEntries(new URLSearchParams(useLocation().search))
    const filteredComments = comments.filter((c) => {
        // remove deleted comments with no replies
        return c.state === 'visible' || c.Replies.length
    })

    function getComments() {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/post-comments?postId=${postId}`, options)
            .then((res) => {
                setComments(res.data)
                setLoading(false)
                // if commentId in urlParams, scroll to comment
                if (urlParams.commentId) {
                    const comment = document.getElementById(`comment-${urlParams.commentId}`)
                    if (comment) setTimeout(() => scrollToElement(comment), 500)
                }
            })
            .catch((error) => console.log(error))
    }

    function addComment(comment) {
        const { parentCommentId } = comment
        const newComment = { ...comment, Creator: accountData, Replies: [] }
        if (!parentCommentId) setComments([...comments, newComment])
        else {
            const newComments = [...comments]
            const parentComment = newComments.find((c) => c.id === parentCommentId)
            parentComment.Replies.push(newComment)
            setComments(newComments)
        }
        incrementTotalComments(1)
    }

    function removeComment(comment) {
        const { id, parentCommentId } = comment
        incrementTotalComments(-1)
        if (!parentCommentId) {
            // if comment to remove has replies, update data instead of removing
            const newComments = [...comments]
            const commentToRemove = newComments.find((c) => c.id === id)
            if (commentToRemove.Replies) {
                commentToRemove.text = null
                commentToRemove.state = 'deleted'
                setComments(newComments)
            } else setComments([...comments.filter((c) => c.id !== id)])
        } else {
            const newComments = [...comments]
            const parentComment = newComments.find((c) => c.id === parentCommentId)
            parentComment.Replies = parentComment.Replies.filter((c) => c.id !== id)
            setComments(newComments)
        }
    }

    function editComment(comment, newText) {
        const { id, parentCommentId } = comment
        const newComments = [...comments]
        let editedComment
        if (parentCommentId) {
            const parentComment = newComments.find((c) => c.id === parentCommentId)
            editedComment = parentComment.Replies.find((c) => c.id === id)
        } else {
            editedComment = comments.find((c) => c.id === id)
        }
        editedComment.text = newText
        editedComment.updatedAt = new Date().toISOString()
        setComments(newComments)
    }

    function updateCommentReactions(comment, reactionType, increment) {
        console.log(comment, reactionType, increment)
        const { id, parentCommentId } = comment
        const newComments = [...comments]
        let selectedComment
        if (parentCommentId) {
            const parentComment = newComments.find((c) => c.id === parentCommentId)
            selectedComment = parentComment.Replies.find((c) => c.id === id)
        } else {
            selectedComment = comments.find((c) => c.id === id)
        }
        if (increment) selectedComment[`total${reactionType}s`] += 1
        else selectedComment[`total${reactionType}s`] -= 1
        selectedComment[`account${reactionType}`] = increment
        setComments(newComments)
    }

    useEffect(() => {
        setComments([])
        if (totalComments) getComments()
    }, [postId])

    return (
        <Column style={style}>
            {loggedIn && (
                <CommentInput
                    id={`comment-input-${postId}`}
                    postId={postId}
                    addComment={addComment}
                />
            )}
            {loading ? (
                <Row centerX style={{ margin: '10px 0' }}>
                    <LoadingWheel size={30} />
                </Row>
            ) : (
                filteredComments.map((comment) => (
                    <CommentWrapper
                        key={comment.id}
                        postId={postId}
                        comment={comment}
                        highlightedCommentId={+urlParams.commentId}
                        addComment={addComment}
                        removeComment={removeComment}
                        editComment={editComment}
                        updateCommentReactions={updateCommentReactions}
                    />
                ))
            )}
        </Column>
    )
}

Comments.defaultProps = {
    type: null,
    location: null,
    style: null,
}

export default Comments
