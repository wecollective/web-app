import Button from '@components/Button'
import Column from '@components/Column'
import Modal from '@components/Modal'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import config from '@src/Config'
import axios from 'axios'
import React, { useState } from 'react'
import Cookies from 'universal-cookie'

const DeleteCommentModal = (props: {
    commentId: number
    parentCommentId: number | null
    close: () => void
    removeComment: (commentId: number, parentCommentId: number | null) => void
}): JSX.Element => {
    const { commentId, parentCommentId, close, removeComment } = props
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const cookies = new Cookies()

    function deleteComment() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        if (!accessToken) close()
        else {
            const data = { commentId }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/delete-comment`, data, authHeader)
                .then(() => {
                    setLoading(false)
                    setSuccess(true)
                    removeComment(commentId, parentCommentId)
                    setTimeout(() => close(), 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Modal close={close} centered>
            {!success ? (
                <Column centerX>
                    <h1>Are you sure you want to delete your comment?</h1>
                    <Row>
                        <Button
                            text='Yes, delete'
                            color='red'
                            loading={loading}
                            onClick={deleteComment}
                            style={{ marginRight: 10 }}
                        />
                        <Button text='Cancel' color='blue' onClick={close} />
                    </Row>
                </Column>
            ) : (
                <SuccessMessage text='Comment deleted!' />
            )}
        </Modal>
    )
}

export default DeleteCommentModal
