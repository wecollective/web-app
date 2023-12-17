import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import CommentCard from '@components/cards/Comments/CommentCard'
import CommentInput from '@components/draft-js/CommentInput'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import styles from '@styles/components/cards/Comments/CommentCard.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Comments(props: {
    postId: number
    location: string
    totalComments: number
    incrementTotalComments: (value: number) => void
    setPostDraggable?: (payload: boolean) => void
    style?: any
}): JSX.Element {
    const { postId, location, totalComments, incrementTotalComments, setPostDraggable, style } =
        props
    const { accountData, loggedIn } = useContext(AccountContext)
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const cookies = new Cookies()
    const urlParams = Object.fromEntries(new URLSearchParams(useLocation().search))
    const filteredComments = comments.filter((c) => {
        // remove deleted comments with no replies
        return c.state === 'active' || c.Comments.length
    })

    function getComments(offset) {
        console.log('get comments', postId)
        // setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/post-comments?postId=${postId}&offset=${offset}`, options)
            .then((res) => {
                console.log('post-comments: ', res.data)
                setComments(offset ? [...comments, ...res.data] : res.data)
                setLoading(false)
                // // if commentId in params, scroll to comment
                // if (urlParams.commentId) {
                //     setTimeout(() => {
                //         const comment = document.getElementById(`comment-${urlParams.commentId}`)
                //         if (comment) scrollToElement(comment)
                //     }, 500)
                // }
            })
            .catch((error) => console.log(error))
    }

    function findCommentById(children: any[], id: number) {
        for (let i = 0; i < children.length; i += 1) {
            if (children[i].id === id) return children[i]
            const match = findCommentById(children[i].Comments, id)
            if (match) return match
        }
        return null
    }

    function addComment(comment) {
        const { parent, root } = comment.link
        if (!root) setComments([comment, ...comments])
        else {
            const newComments = [...comments]
            const parentComment = findCommentById(newComments, parent.id)
            if (parentComment) parentComment.Comments.unshift(comment)
            setComments(newComments)
        }
        incrementTotalComments(1)
    }

    // todo: update
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

    // todo: update
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

    useEffect(() => {
        setComments([])
        if (totalComments) getComments(0)
        else setLoading(false)
    }, [postId])

    return (
        <Column style={style}>
            {loggedIn && (
                <CommentInput
                    type='comment'
                    placeholder='Comment...'
                    parent={{ type: 'post', id: postId }}
                    onSave={(newComment) => addComment(newComment)}
                    maxChars={5000}
                    style={{ marginBottom: 15 }}
                />
            )}
            {loading ? (
                <Row centerX style={{ margin: '10px 0' }}>
                    <LoadingWheel size={30} />
                </Row>
            ) : (
                <Column>
                    {filteredComments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            depth={0}
                            comment={comment}
                            postId={postId}
                            highlighted={false} // highlightedCommentId === comment.id
                            addComment={addComment}
                            removeComment={removeComment}
                            editComment={editComment}
                            setPostDraggable={setPostDraggable}
                            location={location}
                        />
                    ))}
                    {comments.length === 10 && (
                        <button
                            className={styles.loadMore}
                            type='button'
                            onClick={() => getComments(comments.length)}
                        >
                            Load more ↓
                        </button>
                    )}
                </Column>
            )}
        </Column>
    )
}

Comments.defaultProps = {
    style: null,
    setPostDraggable: null,
}

export default Comments
