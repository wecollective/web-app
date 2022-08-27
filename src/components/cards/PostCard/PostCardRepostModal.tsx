import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import LoadingWheel from '@src/components/LoadingWheel'
import Modal from '@src/components/modals/Modal'
import config from '@src/Config'
import { pluralise } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/PostCardRepostModal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

const PostCardRepostModal = (props: {
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
    const [reposts, setReposts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [responseLoading, setResponseLoading] = useState(false)
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([])
    const cookies = new Cookies()
    const headerText = reposts.length
        ? `${reposts.length} repost${pluralise(reposts.length)}`
        : 'No reposts yet...'

    function getReposts() {
        axios
            .get(`${config.apiURL}/post-reposts?postId=${postData.id}`)
            .then((res) => {
                setReposts(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function findSpaces(query) {
        if (!query) setSpaceOptions([])
        else {
            const blacklist = [
                ...postData.DirectSpaces.map((s) => s.id),
                ...postData.IndirectSpaces.map((s) => s.id),
                ...selectedSpaces.map((s) => s.id),
            ]
            const data = { query, blacklist }
            axios
                .post(`${config.apiURL}/find-spaces`, data)
                .then((res) => setSpaceOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function addSpace(space) {
        setSpaceOptions([])
        setSelectedSpaces((s) => [...s, space])
    }

    function removeSpace(spaceId) {
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    function submitRepost() {
        setResponseLoading(true)
        const accessToken = cookies.get('accessToken')
        if (accessToken) {
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                postId: postData.id,
                spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
                selectedSpaceIds: selectedSpaces.map((space) => space.id),
            }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/repost-post`, data, authHeader)
                .then((res) => {
                    setPostData({
                        ...postData,
                        totalReactions: postData.totalReactions + selectedSpaces.length,
                        totalReposts: postData.totalReposts + selectedSpaces.length,
                        accountRepost: true,
                        DirectSpaces: [
                            ...postData.DirectSpaces,
                            ...selectedSpaces.map((space) => {
                                return { id: space.id }
                            }),
                        ],
                        IndirectSpaces: [
                            ...postData.IndirectSpaces,
                            ...res.data.indirectRelationships
                                .filter((id) => id !== null)
                                .map((id) => {
                                    return { id }
                                }),
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

    useEffect(() => getReposts(), [])

    return (
        <Modal close={close} style={{ width: 400 }} centered>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    <h1>{headerText}</h1>
                    {reposts.length > 0 && (
                        <Column centerX style={{ marginBottom: 20 }}>
                            {reposts.map((repost) => (
                                <div className={styles.repost} key={repost.id}>
                                    <ImageTitle
                                        type='user'
                                        imagePath={repost.Creator.flagImagePath}
                                        title={repost.Creator.name}
                                        link={`/u/${repost.Creator.handle}`}
                                    />
                                    <p>to</p>
                                    <ImageTitle
                                        type='space'
                                        imagePath={repost.Space.flagImagePath}
                                        title={repost.Space.name}
                                        link={`/s/${repost.Space.handle}`}
                                    />
                                </div>
                            ))}
                        </Column>
                    )}
                    {loggedIn ? (
                        <Column centerX>
                            <SearchSelector
                                type='space'
                                title='Repost somewhere else (max 5 spaces):'
                                placeholder={`${
                                    selectedSpaces.length > 4
                                        ? 'max 5 spaces'
                                        : 'space name or handle...'
                                }`}
                                disabled={selectedSpaces.length > 4}
                                style={{ marginBottom: 20 }}
                                onSearchQuery={(query) => findSpaces(query)}
                                onOptionSelected={(space) => addSpace(space)}
                                options={spaceOptions}
                            />
                            {selectedSpaces.length > 0 && (
                                <Row style={{ marginBottom: 20 }} wrap centerX>
                                    {selectedSpaces.map((space) => (
                                        <Row
                                            centerY
                                            style={{ margin: '0 10px 10px 0' }}
                                            key={space.id}
                                        >
                                            <ImageTitle
                                                type='user'
                                                imagePath={space.flagImagePath}
                                                title={`${space.name} (${space.handle})`}
                                                imageSize={27}
                                                style={{ marginRight: 3 }}
                                            />
                                            <CloseButton
                                                size={17}
                                                onClick={() => removeSpace(space.id)}
                                            />
                                        </Row>
                                    ))}
                                </Row>
                            )}
                            <Button
                                text='Repost'
                                color='blue'
                                disabled={!selectedSpaces.length}
                                loading={responseLoading}
                                style={{ marginRight: 5 }}
                                onClick={submitRepost}
                            />
                        </Column>
                    ) : (
                        <Row centerY style={{ marginTop: reposts.length ? 10 : 0 }}>
                            <Button
                                text='Log in'
                                color='blue'
                                style={{ marginRight: 5 }}
                                onClick={() => {
                                    setLogInModalOpen(true)
                                    close()
                                }}
                            />
                            <p>to repost posts</p>
                        </Row>
                    )}
                </Column>
            )}
        </Modal>
    )
}

export default PostCardRepostModal
