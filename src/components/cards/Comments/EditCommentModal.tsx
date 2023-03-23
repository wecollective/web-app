import Button from '@components/Button'
import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import config from '@src/Config'
import { defaultErrorState, findDraftLength, isValid } from '@src/Helpers'
import styles from '@styles/components/cards/Comments/EditCommentModal.module.scss'
import axios from 'axios'
import React, { useState } from 'react'
import Cookies from 'universal-cookie'

function EditCommentModal(props: {
    comment: any
    editComment: (comment: any, newText: string) => void
    close: () => void
}): JSX.Element {
    const { comment, editComment, close } = props
    const [newText, setNewText] = useState({
        ...defaultErrorState,
        value: comment.text,
        validate: (v) => {
            const errors: string[] = []
            const totalCharacters = findDraftLength(v)
            if (totalCharacters < 1) errors.push('Required')
            if (totalCharacters > 5000) errors.push('Must be less than 5K characters')
            return errors
        },
    })
    const [mentions, setMentions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const cookies = new Cookies()

    function onChange(value, userMentions) {
        if (value !== newText.value) setNewText({ ...newText, value, state: 'default' })
        setMentions(userMentions)
    }

    function saveChanges() {
        if (isValid(newText, setNewText)) {
            setLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const data = {
                postId: comment.postId,
                commentId: comment.id,
                text: newText.value,
                mentions: mentions.map((m) => m.link),
            }
            axios
                .post(`${config.apiURL}/update-comment`, data, options)
                .then(() => {
                    setSuccess(true)
                    setLoading(false)
                    setTimeout(() => {
                        editComment(comment, newText.value)
                        close()
                    }, 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Modal className={styles.wrapper} close={close} centered>
            {success ? (
                <SuccessMessage text='Changes saved' />
            ) : (
                <Column centerX style={{ width: '100%', maxWidth: 700 }}>
                    <h1>Edit comment</h1>
                    <DraftTextEditor
                        type='post'
                        stringifiedDraft={newText.value}
                        maxChars={5000}
                        onChange={onChange}
                        state={newText.state}
                        errors={newText.errors}
                        style={{ marginBottom: 20 }}
                    />
                    <Button
                        color='blue'
                        text='Save changes'
                        disabled={newText.value === comment.text || loading}
                        loading={loading}
                        onClick={saveChanges}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default EditCommentModal
