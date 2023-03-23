import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { defaultErrorState, isValid, isValidEmail } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function UpdateUserEmailModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { accountData, setAccountData, setAlertModalOpen, setAlertMessage } =
        useContext(AccountContext)
    const [email, setEmail] = useState({
        ...defaultErrorState,
        value: accountData.email,
        validate: (v) => {
            const errors: string[] = []
            if (v === accountData.email) errors.push(`Already saved as '${v}'`)
            if (!isValidEmail(v)) errors.push('Must be a valid email')
            return errors
        },
    })
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const cookies = new Cookies()

    function updateEmail() {
        const accessToken = cookies.get('accessToken')
        if (accessToken) {
            if (isValid(email, setEmail)) {
                setLoading(true)
                const data = { payload: email.value }
                const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
                axios
                    .post(`${config.apiURL}/update-account-email`, data, authHeader)
                    .then(() => {
                        setAccountData({ ...accountData, email: email.value })
                        setSaved(true)
                        setTimeout(() => close(), 1000)
                        setLoading(false)
                    })
                    .catch((error) => console.log(error))
            }
        } else {
            setAlertMessage('Log in to update your email')
            setAlertModalOpen(true)
        }
    }

    return (
        <Modal centered close={close} style={{ maxWidth: 500 }}>
            {saved ? (
                <SuccessMessage text='New email saved!' />
            ) : (
                <Column centerX>
                    <h1>Change your account email</h1>
                    <Input
                        type='text'
                        title='New email:'
                        placeholder='email...'
                        value={email.value}
                        state={email.state}
                        errors={email.errors}
                        onChange={(value) => {
                            setEmail({ ...email, value, state: 'default' })
                        }}
                        style={{ marginBottom: 20 }}
                    />
                    <Button
                        text='Save'
                        color='blue'
                        disabled={loading || email.state === 'invalid'}
                        loading={loading}
                        onClick={updateEmail}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default UpdateUserEmailModal
