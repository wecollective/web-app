import CommentCard from '@components/cards/CommentCard'
import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { defaultErrorState, findDraftLength, isValid } from '@src/Helpers'
import axios from 'axios'
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
    const [commentsLoading, setCommentsLoading] = useState(false)
    const [newComment, setNewComment] = useState({
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
    const [submitCommentLoading, setSubmitCommentLoading] = useState(false)
    const [editorKey, setEditoryKey] = useState(0)
    const [mentions, setMentions] = useState<any[]>([])
    const cookies = new Cookies()

    // todo: rethink component structure, add multi-layer nesting

    function getComments() {
        setCommentsLoading(true)
        axios
            .get(`${config.apiURL}/post-comments?postId=${postId}`)
            .then((res) => {
                setCommentsLoading(false)
                setComments(res.data)
            })
            .catch((error) => console.log(error))
    }

    function scrollToInput(inputElement) {
        const yOffset = window.screen.height / 2.3
        const top = inputElement.getBoundingClientRect().top + window.pageYOffset - yOffset
        window.scrollTo({ top, behavior: 'smooth' })
    }

    // todo: split into submitComment function in this file and submitReply function in CommentCard component
    function submitComment(
        comment,
        setComment,
        setKey,
        setLoading,
        userMentions,
        parentCommentId?: number,
        callback?
    ) {
        const accessToken = cookies.get('accessToken')
        if (isValid(comment, setComment) && accessToken) {
            setLoading(true)
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = {
                text: comment.value,
                postId,
                parentCommentId: parentCommentId || null,
                spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
                accountHandle: accountData.handle,
                accountName: accountData.name,
                mentions: userMentions.map((m) => m.link),
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
                        setComments([
                            ...comments,
                            { ...res.data, Creator: accountData, Replies: [] },
                        ])
                    setComment((c) => {
                        return { ...c, value: '' }
                    })
                    if (callback) callback()
                    setLoading(false)
                    setKey((k) => k + 1)
                })
                .catch((error) => console.log(error))
        }
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
                <DraftTextEditor
                    key={editorKey}
                    type='comment'
                    stringifiedDraft={newComment.value}
                    maxChars={5000}
                    onChange={(value, userMentions) => {
                        if (value !== newComment.value)
                            setNewComment((c) => {
                                return { ...c, value, state: 'default' }
                            })
                        setMentions(userMentions)
                    }}
                    onSubmit={() =>
                        submitComment(
                            newComment,
                            setNewComment,
                            setEditoryKey,
                            setSubmitCommentLoading,
                            mentions
                        )
                    }
                    submitLoading={submitCommentLoading}
                    state={newComment.state}
                    errors={newComment.errors}
                />
            )}
            {commentsLoading && (
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
