import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { pluralise } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function LikeModal(props: {
    itemType: string // all post types + link
    itemData: any
    updateItem: () => void
    close: () => void
}): JSX.Element {
    const { itemType, itemData, updateItem, close } = props
    const { id, liked } = itemData
    const { loggedIn, accountData, setLogInModalOpen } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [likes, setLikes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [responseLoading, setResponseLoading] = useState(false)
    const cookies = new Cookies()
    const mobileView = document.documentElement.clientWidth < 900
    const headerText = likes.length
        ? `${likes.length} like${pluralise(likes.length)}`
        : 'No likes yet...'

    function getLikes() {
        const type = itemType === 'link' ? 'link' : 'post'
        axios
            .get(`${config.apiURL}/likes?type=${type}&id=${id}`)
            .then((res) => {
                setLikes(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function toggleLike() {
        setResponseLoading(true)
        const data = { type: itemType, id } as any
        if (itemType === 'link') {
            data.sourceType = itemData.itemAType
            data.sourceId = itemData.itemAId
        }
        if (!liked) {
            // todo: get user data server side
            data.accountHandle = accountData.handle
            data.accountName = accountData.name
            data.spaceId = window.location.pathname.includes('/s/') ? spaceData.id : null
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/${liked ? 'remove' : 'add'}-like`, data, options)
            .then(() => {
                updateItem()
                close()
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => getLikes(), [])

    return (
        <Modal close={close} style={{ minWidth: mobileView ? null : 400 }} centerX>
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
                                    link={`/u/${like.Creator.handle}/posts`}
                                    style={{ marginBottom: 10 }}
                                />
                            ))}
                        </Column>
                    )}
                    {loggedIn ? (
                        <Button
                            text={`${liked ? 'Remove' : 'Add'} like`}
                            color={liked ? 'red' : 'blue'}
                            style={{ marginTop: likes.length ? 20 : 0 }}
                            loading={responseLoading}
                            onClick={toggleLike}
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
                            <p>to like {itemType}s</p>
                        </Row>
                    )}
                </Column>
            )}
        </Modal>
    )
}

export default LikeModal
