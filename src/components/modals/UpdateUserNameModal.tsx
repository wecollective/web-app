import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function UpdateUserNameModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { accountData, setAccountData } = useContext(AccountContext)
    const { userData, setUserData } = useContext(UserContext)
    const [inputValue, setInputValue] = useState(accountData.name || '')
    const [inputState, setInputState] = useState<'default' | 'valid' | 'invalid'>('default')
    const [inputErrors, setInputErrors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function updateUserName() {
        const unChanged = inputValue === accountData.name
        const invalid = inputValue.length < 1 || inputValue.length > 30
        if (unChanged) {
            setInputState('invalid')
            setInputErrors([`Already saved as '${inputValue}'`])
        } else if (invalid) {
            setInputState('invalid')
            setInputErrors(['Must be between 1 and 30 characters'])
        } else {
            setInputState('valid')
            setLoading(true)
            const data = { payload: inputValue }
            const accessToken = cookies.get('accessToken')
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios.post(`${config.apiURL}/update-account-name`, data, authHeader).then((res) => {
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
                        setAccountData({ ...accountData, name: inputValue })
                        setUserData({ ...userData, name: inputValue })
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
        <Modal centerX close={close}>
            <Column centerX style={{ maxWidth: 500 }}>
                <h1>Change your account name</h1>
                <p>
                    This will be the main visible name for your account seen by other users on the
                    site
                </p>
                <Input
                    type='text'
                    title='New name:'
                    placeholder='name...'
                    state={inputState}
                    errors={inputErrors}
                    value={inputValue}
                    onChange={(newValue) => {
                        setInputState('default')
                        setInputValue(newValue)
                    }}
                />
                <div className={styles.footer}>
                    {!showSuccessMessage && (
                        <Button
                            text='Save'
                            color='blue'
                            style={{ marginRight: 10 }}
                            disabled={loading || inputState === 'invalid'}
                            onClick={updateUserName}
                        />
                    )}
                    {loading && <LoadingWheel />}
                    {showSuccessMessage && <SuccessMessage text='New name saved!' />}
                </div>
            </Column>
        </Modal>
    )
}

export default UpdateUserNameModal
