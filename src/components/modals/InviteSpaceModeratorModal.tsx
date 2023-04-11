import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
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
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function InviteSpaceModeratorModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { accountData } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [moderatorsLoaded, setModeratorsLoaded] = useState(false)
    const [moderators, setModerators] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function findUsers(query) {
        if (query.length < 1) setOptions([])
        else {
            const data = { query, blacklist: moderators.map((m) => m.id) }
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

    function inviteSpaceModerator() {
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
        axios
            .post(`${config.apiURL}/invite-space-moderator`, data, authHeader)
            .then(() => {
                setLoading(false)
                setShowSuccessMessage(true)
                setTimeout(() => close(), 3000)
            })
            .catch((error) => {
                // todo: handle errors
                console.log(error)
            })
    }

    // todo: potentially retrieve on settings page load as used in multiple modals
    useEffect(() => {
        axios
            .get(`${config.apiURL}/space-mods?spaceId=${spaceData.id}`)
            .then((res) => {
                setModerators(res.data)
                setModeratorsLoaded(true)
            })
            .catch((error) => console.log(error))
    }, [])

    return (
        <Modal centered close={close}>
            <h1>Invite someone to moderate &apos;{spaceData.name}&apos;</h1>
            <Column centerX>
                {moderatorsLoaded ? (
                    <SearchSelector
                        type='user'
                        title='Search for their name or handle below'
                        placeholder='name or handle...'
                        onSearchQuery={(query) => findUsers(query)}
                        onOptionSelected={(user) => selectUser(user)}
                        onBlur={() => setTimeout(() => setOptions([]), 200)}
                        options={options}
                    />
                ) : (
                    <LoadingWheel />
                )}
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
                        onClick={inviteSpaceModerator}
                    />
                    {loading && <LoadingWheel />}
                    {showSuccessMessage && <SuccessMessage text='Invite sent!' />}
                </div>
            </Column>
        </Modal>
    )
}

export default InviteSpaceModeratorModal
