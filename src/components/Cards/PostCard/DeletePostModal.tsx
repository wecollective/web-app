import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'
import axios from 'axios'
import config from '@src/Config'
import { SpaceContext } from '@contexts/SpaceContext'
import Modal from '@components/Modal'
import Column from '@components/Column'
import Row from '@components/Row'
import Button from '@components/Button'
import SuccessMessage from '@components/SuccessMessage'

const DeletePostModal = (props: { postId: number; close: () => void }): JSX.Element => {
    const { postId, close } = props
    const { spacePosts, setSpacePosts } = useContext(SpaceContext)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const cookies = new Cookies()

    function deletePost() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        if (accessToken) {
            const data = { postId }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/delete-post`, data, authHeader)
                .then(() => {
                    setLoading(false)
                    setSuccess(true)
                    setTimeout(() => {
                        setSpacePosts([...spacePosts.filter((p) => p.id !== postId)])
                        close()
                    }, 1000)
                })
                .catch((error) => console.log(error))
        } else close()
    }

    return (
        <Modal close={close} centered>
            {!success ? (
                <Column centerX>
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
                </Column>
            ) : (
                <SuccessMessage text='Post deleted!' />
            )}
        </Modal>
    )
}

export default DeletePostModal