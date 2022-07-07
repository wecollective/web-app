import React, { useContext, useState } from 'react'
import axios from 'axios'
import Cookies from 'universal-cookie'
import config from '@src/Config'
import styles from '@styles/components/Modal.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import Modal from '@components/Modal'
import MarkdownEditor from '@components/MarkdownEditor'
import Button from '@components/Button'
import LoadingWheel from '@components/LoadingWheel'
import SuccessMessage from '@components/SuccessMessage'

const UpdateUserBioModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const { accountData, setAccountData } = useContext(AccountContext)
    const { userData, setUserData } = useContext(UserContext)
    const [inputValue, setInputValue] = useState(accountData.bio || '')
    const [inputState, setInputState] = useState<'default' | 'valid' | 'invalid'>('default')
    const [inputErrors, setInputErrors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function updateUserBio(e) {
        e.preventDefault()
        const unChanged = inputValue === accountData.bio
        const invalid = inputValue.length < 2 || inputValue.length > 10000
        if (unChanged) {
            setInputState('invalid')
            setInputErrors(['Unchanged from previous bio'])
        } else if (invalid) {
            setInputState('invalid')
            setInputErrors(['Must be between 1 and 10K characters'])
        } else {
            setInputState('valid')
            setLoading(true)
            const data = { payload: inputValue }
            const accessToken = cookies.get('accessToken')
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios.post(`${config.apiURL}/update-account-bio`, data, authHeader).then((res) => {
                setLoading(false)
                switch (res.data) {
                    case 'invalid-auth-token':
                        setInputState('invalid')
                        setInputErrors(['Invalid auth token. Try logging in again.'])
                        break
                    case 'unauthorized':
                        setInputState('invalid')
                        setInputErrors([
                            `Unauthorized. You must be the owner of the account to complete this action.`,
                        ])
                        break
                    case 'success':
                        setAccountData({ ...accountData, bio: inputValue })
                        setUserData({ ...userData, bio: inputValue })
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
            <h1>Change your account bio</h1>
            <form onSubmit={updateUserBio} style={{ maxWidth: 500 }}>
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
                    {showSuccessMessage && <SuccessMessage text='New bio saved!' />}
                </div>
            </form>
        </Modal>
    )
}

export default UpdateUserBioModal
