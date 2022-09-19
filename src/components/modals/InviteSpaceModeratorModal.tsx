import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

const InviteSpaceModeratorModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const { accountData } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [inputState, setInputState] = useState<'default' | 'valid' | 'invalid'>('default')
    const [inputErrors, setInputErrors] = useState<string[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function findUsers(query) {
        if (query.length < 1) setOptions([])
        else {
            const data = { query, blacklist: spaceData.Moderators.map((user) => user.id) }
            axios
                .post(`${config.apiURL}/find-people`, data)
                .then((res) => setOptions(res.data))
                .catch((error) => console.log('error: ', error))
        }
    }

    function selectUser(user) {
        setOptions([])
        setSelectedUser(user)
    }

    function inviteSpaceModerator(e) {
        e.preventDefault()
        setLoading(true)
        const data = {
            accountHandle: accountData.handle,
            accountName: accountData.name,
            spaceId: spaceData.id,
            spaceHandle: spaceData.handle,
            spaceName: spaceData.name,
            userHandle: selectedUser.handle,
        }
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios.post(`${config.apiURL}/invite-space-moderator`, data, authHeader).then((res) => {
            setLoading(false)
            switch (res.data) {
                case 'invalid-auth-token':
                    setInputState('invalid')
                    setInputErrors(['Invalid auth token. Try logging in again.'])
                    break
                case 'unauthorized':
                    setInputState('invalid')
                    setInputErrors([
                        `Unauthorized. You must be a moderator of ${spaceData.name} to complete this action.`,
                    ])
                    break
                case 'success':
                    setShowSuccessMessage(true)
                    setTimeout(() => close(), 3000)
                    break
                default:
                    break
            }
        })
    }

    return (
        <Modal centered close={close}>
            <h1>Invite someone to moderate &apos;{spaceData.name}&apos;</h1>
            <form onSubmit={inviteSpaceModerator}>
                <SearchSelector
                    type='user'
                    title='Search for their name or handle below'
                    placeholder='name or handle...'
                    state={inputState}
                    errors={inputErrors}
                    onSearchQuery={(query) => findUsers(query)}
                    onOptionSelected={(user) => selectUser(user)}
                    options={options}
                />
                {selectedUser && (
                    <div className={styles.selectedOptionWrapper}>
                        <p>Selected user:</p>
                        <div className={styles.selectedOption}>
                            <ImageTitle
                                type='user'
                                imagePath={selectedUser.flagImagePath}
                                title={`${selectedUser.name} (${selectedUser.handle})`}
                            />
                            <CloseButton size={17} onClick={() => setSelectedUser(null)} />
                        </div>
                    </div>
                )}
                <div className={styles.footer}>
                    <Button
                        text='Send invite'
                        color='blue'
                        style={{ marginRight: 10 }}
                        disabled={loading || showSuccessMessage || !selectedUser}
                        submit
                    />
                    {loading && <LoadingWheel />}
                    {showSuccessMessage && <SuccessMessage text='Invite sent!' />}
                </div>
            </form>
        </Modal>
    )
}

export default InviteSpaceModeratorModal
