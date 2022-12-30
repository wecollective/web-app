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

const RemoveSpaceModeratorModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const { accountData } = useContext(AccountContext)
    const { spaceData, setSpaceData } = useContext(SpaceContext)
    const [moderatorsLoaded, setModeratorsLoaded] = useState(false)
    const [moderators, setModerators] = useState<any[]>([])
    const [inputState, setInputState] = useState<'default' | 'valid' | 'invalid'>('default')
    const [inputErrors, setInputErrors] = useState<string[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [selectedModerator, setSelectedModerator] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function findModerators(query) {
        if (query.length < 1) setOptions([])
        else {
            const filteredModerators = moderators.filter(
                (mod) =>
                    mod.handle.includes(query.toLowerCase()) ||
                    mod.name.toLowerCase().includes(query.toLowerCase())
            )
            setOptions(filteredModerators)
        }
    }

    function selectModerator(moderator) {
        setOptions([])
        setSelectedModerator(moderator)
    }

    function removeSpaceModerator() {
        setLoading(true)
        const data = {
            accountHandle: accountData.handle,
            accountName: accountData.name,
            spaceId: spaceData.id,
            spaceHandle: spaceData.handle,
            spaceName: spaceData.name,
            userHandle: selectedModerator.handle,
        }
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios.post(`${config.apiURL}/remove-space-moderator`, data, authHeader).then((res) => {
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
                    setSpaceData({
                        ...spaceData,
                        Moderators: spaceData.Moderators.filter(
                            (m) => m.handle !== selectedModerator.handle
                        ),
                    })
                    setShowSuccessMessage(true)
                    setTimeout(() => close(), 3000)
                    break
                default:
                    break
            }
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
            <h1>Remove a moderator from &apos;{spaceData.name}&apos;</h1>
            <Column centerX>
                {moderatorsLoaded ? (
                    <SearchSelector
                        type='user'
                        title='Search for their name or handle below'
                        placeholder='name or handle...'
                        state={inputState}
                        errors={inputErrors}
                        onSearchQuery={(query) => findModerators(query)}
                        onOptionSelected={(user) => selectModerator(user)}
                        options={options}
                    />
                ) : (
                    <LoadingWheel />
                )}
                {selectedModerator && (
                    <div className={styles.selectedOptionWrapper}>
                        <p>Selected user:</p>
                        <div className={styles.selectedOption}>
                            <ImageTitle
                                type='user'
                                imagePath={selectedModerator.flagImagePath}
                                title={`${selectedModerator.name} (${selectedModerator.handle})`}
                            />
                            <CloseButton size={17} onClick={() => setSelectedModerator(null)} />
                        </div>
                    </div>
                )}
                <div className={styles.footer}>
                    <Button
                        text='Remove'
                        color='blue'
                        style={{ marginRight: 10 }}
                        disabled={loading || showSuccessMessage || !selectedModerator}
                        onClick={removeSpaceModerator}
                    />
                    {loading && <LoadingWheel />}
                    {showSuccessMessage && <SuccessMessage text='Moderator removed' />}
                </div>
            </Column>
        </Modal>
    )
}

export default RemoveSpaceModeratorModal
