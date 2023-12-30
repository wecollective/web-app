import Button from '@components/Button'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import config from '@src/Config'
import axios from 'axios'
import React, { useState } from 'react'
import Cookies from 'universal-cookie'

function DeletePostModal(props: {
    post: any
    onDelete: () => void
    close: () => void
}): JSX.Element {
    const { post, onDelete, close } = props
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()

    function deletePost() {
        setLoading(true)
        const data = { postId: post.id }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const route = ['post', 'comment', 'bead'].includes(post.type) ? post.type : 'block'
        axios
            .post(`${config.apiURL}/delete-${route}`, data, options)
            .then(() => {
                setLoading(false)
                close()
                onDelete()
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal close={close} centerX>
            <h1>Are you sure you want to delete your post?</h1>
            <Row>
                <Button
                    text='Yes, delete'
                    color='red'
                    loading={loading}
                    onClick={deletePost}
                    style={{ marginRight: 10 }}
                />
                <Button text='Cancel' color='blue' onClick={close} />
            </Row>
        </Modal>
    )
}

export default DeletePostModal
