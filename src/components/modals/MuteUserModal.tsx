import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useState, useEffect } from 'react'
import Cookies from 'universal-cookie'

function MuteUserModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { accountData } = useContext(AccountContext)
    const [usersLoading, setUsersLoading] = useState(true)
    const [updateLoading, setUpdateLoading] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<any[]>([])
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
    const cookies = new Cookies()
    const mobileView = document.documentElement.clientWidth < 900

    function getMutedUsers() {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/muted-users`, options)
            .then((res) => {
                setSelectedUsers(res.data)
                setUsersLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function findUsers(query) {
        if (query.length < 1) setSuggestedUsers([])
        else {
            const blacklist = [accountData.id, ...selectedUsers.map((user) => user.id)]
            axios
                .post(`${config.apiURL}/find-people`, { query, blacklist })
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

    function saveMutedUsers() {
        setUpdateLoading(true)
        const data = { userIds: selectedUsers.map((u) => u.id) }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/save-muted-users`, data, options)
            .then((res) => {
                console.log(res.data)
                setUpdateLoading(false)
                close()
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => getMutedUsers(), [])

    return (
        <Modal centerX close={close} style={{ width: '100%', maxWidth: mobileView ? 900 : 600 }}>
            <h1>Muted users</h1>
            <p style={{ textAlign: 'center' }}>
                All activity including posts, comments, and notifications from muted users will be
                hidden until you unmute them
            </p>
            {usersLoading ? (
                <LoadingWheel />
            ) : (
                <SearchSelector
                    type='user'
                    title='Search for their name or handle below'
                    placeholder='name or handle...'
                    onSearchQuery={(query) => findUsers(query)}
                    onOptionSelected={(user) => addUser(user)}
                    onBlur={() => setTimeout(() => setSuggestedUsers([]), 200)}
                    options={suggestedUsers}
                />
            )}
            {selectedUsers.length > 0 && (
                <Column centerX style={{ marginTop: 20 }}>
                    {selectedUsers.map((user) => (
                        <Row key={user.id} centerY style={{ marginTop: 10 }}>
                            <ImageTitle
                                type='user'
                                imagePath={user.flagImagePath}
                                title={`${user.name} (${user.handle})`}
                                style={{ marginRight: 5 }}
                            />
                            <CloseButton size={17} onClick={() => removeUser(user.id)} />
                        </Row>
                    ))}
                </Column>
            )}
            <Button
                text='Save muted users'
                color='blue'
                loading={updateLoading}
                disabled={usersLoading || updateLoading}
                onClick={saveMutedUsers}
                style={{ marginTop: 40 }}
            />
        </Modal>
    )
}

export default MuteUserModal
