import Button from '@components/Button'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function RemovePostModal(props: {
    postId: number
    location:
        | 'post-page'
        | 'space-posts'
        | 'space-post-map'
        | 'space-governance'
        | 'user-posts'
        | 'link-modal'
        | 'preview'
    close: () => void
}): JSX.Element {
    const { postId, location, close } = props
    const {
        spaceData,
        spacePosts,
        setSpacePosts,
        postMapData,
        setPostMapData,
        governancePolls,
        setGovernancePolls,
    } = useContext(SpaceContext)
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()

    function removePost() {
        setLoading(true)
        const data = { postId, spaceId: spaceData.id, spaceHandle: spaceData.handle }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/remove-post`, data, options)
            .then(() => {
                if (location === 'space-posts')
                    setSpacePosts(spacePosts.filter((p) => p.id !== postId))
                if (location === 'space-post-map')
                    setPostMapData({
                        posts: postMapData.posts.filter((p) => p.id !== postId),
                        totalMatchingPosts: postMapData.totalMatchingPosts - 1,
                    })
                if (location === 'space-governance')
                    setGovernancePolls(governancePolls.filter((p) => p.id !== postId))
                setLoading(false)
                close()
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal close={close} centerX>
            <h1>Remove post from s/{spaceData.handle}?</h1>
            <Row>
                <Button
                    text='Yes, remove'
                    color='red'
                    loading={loading}
                    onClick={removePost}
                    style={{ marginRight: 10 }}
                />
                <Button text='Cancel' color='blue' onClick={close} />
            </Row>
        </Modal>
    )
}

export default RemovePostModal
