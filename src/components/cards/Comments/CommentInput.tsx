import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { defaultErrorState, findDraftLength, isValid } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

const CommentInput = (props: {
    id?: string
    postId?: number
    commentId?: number
    replyId?: number
    style?: any
    addComment: (newComment: string) => void
    close?: () => void
}): JSX.Element => {
    const { id, postId, commentId, replyId, style, addComment, close } = props
    const { spaceData } = useContext(SpaceContext)
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
    const [loading, setLoading] = useState(false)
    const [editorKey, setEditoryKey] = useState(0)
    const [mentions, setMentions] = useState<any[]>([])
    const cookies = new Cookies()

    function onChange(value, userMentions) {
        if (value !== newComment.value) setNewComment({ ...newComment, value, state: 'default' })
        setMentions(userMentions)
    }

    function submitComment() {
        if (isValid(newComment, setNewComment)) {
            setLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const data = {
                text: newComment.value,
                postId,
                commentId: commentId || null,
                replyId: replyId || null,
                spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
                mentions: mentions.map((m) => m.link),
            }
            axios
                .post(`${config.apiURL}/create-comment`, data, options)
                .then((res) => {
                    addComment(res.data)
                    if (close) close()
                    else {
                        setNewComment({ ...newComment, value: '', state: 'default' })
                        setEditoryKey(editorKey + 1)
                    }
                    setLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <DraftTextEditor
            key={editorKey}
            id={id}
            type='comment'
            stringifiedDraft={newComment.value}
            maxChars={5000}
            onChange={onChange}
            onSubmit={submitComment}
            submitLoading={loading}
            state={newComment.state}
            errors={newComment.errors}
            style={style}
        />
    )
}

CommentInput.defaultProps = {
    id: null,
    postId: null,
    commentId: null,
    replyId: null,
    style: null,
    close: null,
}

export default CommentInput
