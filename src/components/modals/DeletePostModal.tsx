import Button from '@components/Button'
import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function DeletePostModal(props: {
    postId: number
    location: 'post-page' | 'space-posts' | 'space-post-map' | 'user-posts' | 'preview'
    close: () => void
}): JSX.Element {
    const { postId, location, close } = props
    const { spacePosts, setSpacePosts } = useContext(SpaceContext)
    const { userPosts, setUserPosts } = useContext(UserContext)
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
                    if (location === 'space-posts')
                        setSpacePosts([...spacePosts.filter((p) => p.id !== postId)])
                    if (location === 'user-posts')
                        setUserPosts([...userPosts.filter((p) => p.id !== postId)])
                    setTimeout(() => close(), 1000)
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
