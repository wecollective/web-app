import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function InviteSpaceUsersModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { accountData, setAlertMessage, setAlertModalOpen } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [usersWithAccessLoaded, setUsersWithAccessLoaded] = useState(false)
    const [usersWithAccess, setUsersWithAccess] = useState<number[]>([])
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [complete, setComplete] = useState(false)
    const cookies = new Cookies()

    function findUsers(query) {
        if (query.length < 1) setSuggestedUsers([])
        else {
            const data = {
                query,
                blacklist: [...usersWithAccess, ...selectedUsers.map((user) => user.id)],
            }
            axios
                .post(`${config.apiURL}/find-people`, data)
                .then((res) => setSuggestedUsers(res.data))
                .catch((error) => console.log('error: ', error))
        }
    }

    function addUser(user) {
        setSuggestedUsers([])
        setSelectedUsers([...selectedUsers, user])
    }

    function removeUser(userId) {
        setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
    }

    function sendInvites() {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again to invite users.')
            setAlertModalOpen(true)
        } else {
            setLoading(true)
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                spaceId: spaceData.id,
                spaceHandle: spaceData.handle,
                spaceName: spaceData.name,
                userIds: selectedUsers.map((u) => u.id),
            }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/invite-space-users`, data, options)
                .then(() => {
                    setLoading(false)
                    setComplete(true)
                    setTimeout(() => close(), 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => {
        axios
            .get(`${config.apiURL}/users-with-access?spaceId=${spaceData.id}`)
            .then((res) => {
                setUsersWithAccess(res.data)
                setUsersWithAccessLoaded(true)
            })
            .catch((error) => console.log(error))
    }, [])

    return (
        <Modal centerX close={close}>
            {complete ? (
                <SuccessMessage text='Invites sent!' />
            ) : (
                <Column centerX>
                    <Column centerX style={{ marginBottom: 30, fontSize: 24 }}>
                        <p>Invite people to</p>
                        <ImageTitle
                            type='space'
                            imagePath={spaceData.flagImagePath}
                            imageSize={40}
                            title={`${spaceData.name} (s/${spaceData.handle})`}
                            fontSize={24}
                        />
                    </Column>
                    <Column centerX>
                        {usersWithAccessLoaded ? (
                            <SearchSelector
                                type='user'
                                title='Search for their name or handle below'
                                placeholder='name or handle...'
                                onSearchQuery={(query) => findUsers(query)}
                                onOptionSelected={(user) => addUser(user)}
                                onBlur={() => setTimeout(() => setSuggestedUsers([]), 200)}
                                options={suggestedUsers}
                            />
                        ) : (
                            <LoadingWheel />
                        )}
                        {selectedUsers.length > 0 && (
                            <Column centerX style={{ marginTop: 20 }}>
                                <p>Selected people:</p>
                                {selectedUsers.map((user) => (
                                    <Row centerY style={{ marginTop: 10 }}>
                                        <ImageTitle
                                            type='user'
                                            imagePath={user.flagImagePath}
                                            title={`${user.name} (${user.handle})`}
                                            style={{ marginRight: 5 }}
                                        />
                                        <CloseButton
                                            size={17}
                                            onClick={() => removeUser(user.id)}
                                        />
                                    </Row>
                                ))}
                            </Column>
                        )}
                        <Row centerX style={{ marginTop: 40 }}>
                            <Button
                                text='Send invites'
                                color='blue'
                                disabled={loading || !selectedUsers.length}
                                loading={loading}
                                onClick={sendInvites}
                            />
                        </Row>
                    </Column>
                </Column>
            )}
        </Modal>
    )
}

export default InviteSpaceUsersModal
