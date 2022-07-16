import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Modal from '@components/Modal'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import LoadingWheel from '@src/components/LoadingWheel'
import config from '@src/Config'
import { pluralise } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

const PostCardLikeModal = (props: {
    close: () => void
    postData: any
    setPostData: (payload: any) => void
}): JSX.Element => {
    const { close, postData, setPostData } = props
    const {
        loggedIn,
        accountData,
        setLogInModalOpen,
        setAlertMessage,
        setAlertModalOpen,
    } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [likes, setLikes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [responseLoading, setResponseLoading] = useState(false)
    const cookies = new Cookies()
    const headerText = likes.length
        ? `${likes.length} like${pluralise(likes.length)}`
        : 'No likes yet...'

    function getLikes() {
        axios
            .get(`${config.apiURL}/post-likes?postId=${postData.id}`)
            .then((res) => {
                setLikes(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function addLike() {
        setResponseLoading(true)
        const accessToken = cookies.get('accessToken')
        if (accessToken) {
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                postId: postData.id,
                holonId: window.location.pathname.includes('/s/') ? spaceData.id : null,
            }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/add-like`, data, authHeader)
                .then(() => {
                    setPostData({
                        ...postData,
                        totalReactions: postData.totalReactions + 1,
                        totalLikes: postData.totalLikes + 1,
                        accountLike: true,
                        Reactions: [
                            ...postData.Reactions,
                            {
                                type: 'like',
                                Creator: {
                                    id: accountData.id,
                                    handle: accountData.handle,
                                    name: accountData.name,
                                    flagImagePath: accountData.flagImagePath,
                                },
                            },
                        ],
                    })
                    close()
                })
                .catch((error) => console.log(error))
        } else {
            close()
            setAlertMessage('Log in to like posts')
            setAlertModalOpen(true)
        }
    }

    function removeLike() {
        setResponseLoading(true)
        const accessToken = cookies.get('accessToken')
        if (accessToken) {
            const data = { postId: postData.id }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/remove-like`, data, authHeader)
                .then(() => {
                    setPostData({
                        ...postData,
                        totalReactions: postData.totalReactions - 1,
                        totalLikes: postData.totalLikes - 1,
                        accountLike: false,
                        Reactions: [
                            ...postData.Reactions.filter(
                                (r) => !(r.type === 'like' && r.Creator.id === accountData.id)
                            ),
                        ],
                    })
                    close()
                })
                .catch((error) => console.log(error))
        } else {
            close()
            setAlertMessage('Log in to unlike posts')
            setAlertModalOpen(true)
        }
    }

    useEffect(() => getLikes(), [])

    return (
        <Modal close={close} style={{ width: 400 }} centered>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    <h1>{headerText}</h1>
                    {likes.length > 0 && (
                        <Column centerX>
                            {likes.map((like) => (
                                <ImageTitle
                                    key={like.id}
                                    type='user'
                                    imagePath={like.Creator.flagImagePath}
                                    title={like.Creator.name}
                                    link={`/u/${like.Creator.handle}`}
                                    style={{ marginBottom: 10 }}
                                />
                            ))}
                        </Column>
                    )}
                    {loggedIn ? (
                        <Button
                            text={`${postData.accountLike ? 'Remove' : 'Add'} like`}
                            color={postData.accountLike ? 'red' : 'blue'}
                            style={{ marginTop: likes.length ? 20 : 0 }}
                            loading={responseLoading}
                            onClick={postData.accountLike ? removeLike : addLike}
                        />
                    ) : (
                        <Row centerY style={{ marginTop: likes.length ? 20 : 0 }}>
                            <Button
                                text='Log in'
                                color='blue'
                                style={{ marginRight: 5 }}
                                onClick={() => {
                                    setLogInModalOpen(true)
                                    close()
                                }}
                            />
                            <p>to like posts</p>
                        </Row>
                    )}
                </Column>
            )}
        </Modal>
    )
}

export default PostCardLikeModal
