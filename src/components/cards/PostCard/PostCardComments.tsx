import CommentCard from '@components/cards/CommentCard'
import Column from '@components/Column'
import CommentInput from '@components/CommentInput'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { resizeTextArea } from '@src/Helpers'
import axios from 'axios'
import OverlayScrollbars from 'overlayscrollbars'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

const PostCardComments = (props: {
    postId: number | undefined
    type: 'post' | 'bead'
    location: string
    totalComments: number
    incrementTotalComments: (value: number) => void
    style?: any
}): JSX.Element => {
    const { postId, type, location, totalComments, incrementTotalComments, style } = props
    const { accountData, loggedIn } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [commentError, setCommentError] = useState(false)
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()

    // todo: rethink component structure, add multi-layer nesting

    function getComments() {
        setLoading(true)
        axios
            .get(`${config.apiURL}/post-comments?postId=${postId}`)
            .then((res) => {
                setLoading(false)
                setComments(res.data)
            })
            .catch((error) => console.log(error))
    }

    function validateComment(text) {
        const invalid = text.length < 1 || text.length > 10000
        if (invalid) {
            setCommentError(true)
            return false
        }
        return true
    }

    function scrollToInput(inputElement) {
        if (['space-posts', 'user-posts'].includes(location)) {
            const instance = OverlayScrollbars(document.getElementById(`${location}-scrollbars`))
            if (instance) instance.scroll({ el: inputElement, margin: 200 }, 400)
        } else {
            const yOffset = window.screen.height / 2.3
            const top = inputElement.getBoundingClientRect().top + window.pageYOffset - yOffset
            window.scrollTo({ top, behavior: 'smooth' })
        }
    }

    function submitComment(text, parentCommentId?) {
        setNewComment('')
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        const data = {
            text,
            postId,
            parentCommentId: parentCommentId || null,
            spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
            accountHandle: accountData.handle,
            accountName: accountData.name,
        }
        axios
            .post(`${config.apiURL}/submit-comment`, data, options)
            .then((res) => {
                incrementTotalComments(1)
                if (parentCommentId) {
                    const newComments = [...comments]
                    const parentComment = newComments.find((c) => c.id === parentCommentId)
                    parentComment.Replies.push({
                        ...res.data,
                        Creator: accountData,
                        Replies: [],
                    })
                    setComments(newComments)
                } else
                    setComments([...comments, { ...res.data, Creator: accountData, Replies: [] }])
            })
            .catch((error) => console.log(error))
    }

    function removeComment(commentId, parentCommentId) {
        incrementTotalComments(-1)
        if (parentCommentId) {
            const newComments = [...comments]
            const parentComment = newComments.find((c) => c.id === parentCommentId)
            parentComment.Replies = parentComment.Replies.filter((c) => c.id !== commentId)
            setComments(newComments)
        } else {
            setComments([...comments.filter((c) => c.id !== commentId)])
        }
    }

    useEffect(() => {
        setComments([])
        if (totalComments) getComments()
    }, [postId])

    return (
        <Column style={style}>
            {loggedIn && (
                <CommentInput
                    value={newComment}
                    placeholder={`new ${type} comment...`}
                    error={commentError}
                    onChange={(e) => {
                        setNewComment(e.target.value)
                        setCommentError(false)
                        resizeTextArea(e.target)
                    }}
                    submit={() => validateComment(newComment) && submitComment(newComment)}
                    style={{ marginBottom: 15 }}
                />
            )}
            {loading && (
                <Row centerX style={{ margin: '20px 0' }}>
                    <LoadingWheel />
                </Row>
            )}
            {comments.length > 0 && (
                <Column>
                    {comments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            submit={submitComment}
                            scrollToInput={scrollToInput}
                            removeComment={removeComment}
                        />
                    ))}
                </Column>
            )}
        </Column>
    )
}

PostCardComments.defaultProps = {
    style: null,
}

export default PostCardComments
