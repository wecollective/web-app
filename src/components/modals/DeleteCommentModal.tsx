import Button from '@components/Button'
import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import config from '@src/Config'
import axios from 'axios'
import React, { useState } from 'react'
import Cookies from 'universal-cookie'

function DeleteCommentModal(props: {
    comment: any
    removeComment: (comment: any) => void
    close: () => void
}): JSX.Element {
    const { comment, removeComment, close } = props
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const cookies = new Cookies()

    function deleteComment() {
        setLoading(true)
        const data = { commentId: comment.id, postId: comment.itemId }
        const authHeader = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/delete-comment`, data, authHeader)
            .then(() => {
                setLoading(false)
                setSuccess(true)
                setTimeout(() => {
                    removeComment(comment)
                    close()
                }, 1000)
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal close={close} centerX>
            {success ? (
                <SuccessMessage text='Comment deleted!' />
            ) : (
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
            )}
        </Modal>
    )
}

export default DeleteCommentModal
