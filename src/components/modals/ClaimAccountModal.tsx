import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import SuccessMessage from '@components/SuccessMessage'
import Modal from '@components/modals/Modal'
import config from '@src/Config'
import { isValidEmail } from '@src/Helpers'
import axios from 'axios'
import React, { useState } from 'react'

function ClaimAccountModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const mobileView = document.documentElement.clientWidth < 900
    const disabled =
        loading ||
        !password ||
        !confirmPassword ||
        password !== confirmPassword ||
        !isValidEmail(email)

    function claimAccount() {
        setErrorMessage('')
        setLoading(true)
        axios
            .post(`${config.apiURL}/claim-account`, { email, password })
            .then(() => {
                setLoading(false)
                setSuccess(true)
            })
            .catch((error) => {
                console.log(error)
                if (error.response) {
                    const { message } = error.response.data
                    if (message) {
                        setLoading(false)
                        setErrorMessage(message)
                    }
                }
            })
    }

    return (
        <Modal close={close} style={{ width: '100%', maxWidth: mobileView ? 900 : 600 }} centerX>
            {success ? (
                <Column centerX style={{ width: '100%' }}>
                    <SuccessMessage text='Success' />
                    <p style={{ marginTop: 20 }}>Verfication email sent to: {email}</p>
                </Column>
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <h1>Claim your account</h1>
                    <p style={{ textAlign: 'center', marginBottom: 30 }}>
                        If you previously had an account on a forum that has been migrated to weco
                        you can reclaim it here using the email you signed up to the forum with
                    </p>
                    <Column style={{ width: '100%', maxWidth: 300 }}>
                        <Input
                            type='email'
                            title='Old forum email'
                            placeholder='email...'
                            value={email}
                            onChange={(value) => setEmail(value)}
                            style={{ marginBottom: 20 }}
                        />
                        <Input
                            type='password'
                            title='New password'
                            placeholder='password...'
                            value={password}
                            onChange={(value) => setPassword(value)}
                            style={{ marginBottom: 20 }}
                        />
                        <Input
                            type='password'
                            title='Confirm new password'
                            placeholder='password...'
                            value={confirmPassword}
                            onChange={(value) => setConfirmPassword(value)}
                            style={{ marginBottom: 40 }}
                        />
                    </Column>
                    <Button
                        text='Send verification email'
                        color='blue'
                        loading={loading}
                        disabled={disabled}
                        onClick={claimAccount}
                    />
                    {errorMessage && (
                        <p className='danger' style={{ marginTop: 20 }}>
                            {errorMessage}
                        </p>
                    )}
                </Column>
            )}
        </Modal>
    )
}

export default ClaimAccountModal
