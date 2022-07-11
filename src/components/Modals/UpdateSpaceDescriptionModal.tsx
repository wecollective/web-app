import Button from '@components/Button'
import LoadingWheel from '@components/LoadingWheel'
import MarkdownEditor from '@components/MarkdownEditor'
import Modal from '@components/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/components/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

const UpdateSpaceDescriptionModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const { spaceData, setSpaceData } = useContext(SpaceContext)
    const [inputValue, setInputValue] = useState(spaceData.description || '')
    const [inputState, setInputState] = useState<'default' | 'valid' | 'invalid'>('default')
    const [inputErrors, setInputErrors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function updateSpaceDescription(e) {
        e.preventDefault()
        const unChanged = inputValue === spaceData.description
        const invalid = inputValue.length < 1 || inputValue.length > 10000
        if (unChanged) {
            setInputState('invalid')
            setInputErrors(['Unchanged from previous description'])
        } else if (invalid) {
            setInputState('invalid')
            setInputErrors(['Must be between 1 and 10K characters'])
        } else {
            setInputState('valid')
            setLoading(true)
            const data = { spaceId: spaceData.id, payload: inputValue }
            const accessToken = cookies.get('accessToken')
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/update-space-description`, data, authHeader)
                .then((res) => {
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
                            setSpaceData({ ...spaceData, description: inputValue })
                            setShowSuccessMessage(true)
                            setTimeout(() => close(), 3000)
                            break
                        default:
                            break
                    }
                })
        }
    }

    return (
        <Modal centered close={close}>
            <h1>Change the description for {spaceData.name}</h1>
            <form onSubmit={updateSpaceDescription} style={{ maxWidth: 500 }}>
                <MarkdownEditor
                    initialValue={inputValue}
                    onChange={(value) => {
                        setInputState('default')
                        setInputValue(value)
                    }}
                    state={inputState}
                    errors={inputErrors}
                />
                <div className={styles.footer}>
                    {!showSuccessMessage && (
                        <Button
                            text='Save'
                            color='blue'
                            style={{ marginRight: 10 }}
                            disabled={loading || inputState === 'invalid'}
                            submit
                        />
                    )}
                    {loading && <LoadingWheel />}
                    {showSuccessMessage && <SuccessMessage text='New description saved!' />}
                </div>
            </form>
        </Modal>
    )
}

export default UpdateSpaceDescriptionModal
