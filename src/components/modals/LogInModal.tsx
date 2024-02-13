import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { allValid, defaultErrorState, invalidateFormItem, updateFormItem } from '@src/Helpers'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function LogInModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { getAccountData, setRegisterModalOpen, setForgotPasswordModalOpen } =
        useContext(AccountContext)
    const [formData, setFormData] = useState({
        emailOrHandle: {
            value: '',
            validate: (v) => (!v ? ['Required'] : []),
            ...defaultErrorState,
        },
        password: {
            value: '',
            validate: (v) => (!v ? ['Required'] : []),
            ...defaultErrorState,
        },
    })
    const { emailOrHandle, password } = formData
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [showResendVerificationEmail, setShowResendVerificationEmail] = useState(false)
    const [verificationEmailUserId, setVerificationEmailUserId] = useState(null)
    const [verificationEmailLoading, setVerificationEmailLoading] = useState(false)
    const location = useLocation()
    const history = useNavigate()

    function updateItem(item, value) {
        setErrorMessage('')
        updateFormItem(formData, setFormData, item, value)
    }

    function invalidateItem(item, error) {
        invalidateFormItem(formData, setFormData, item, error)
    }

    async function logIn(e) {
        e.preventDefault()
        setShowResendVerificationEmail(false)
        if (allValid(formData, setFormData)) {
            setLoading(true)
            const data = { emailOrHandle: emailOrHandle.value, password: password.value }
            axios
                .post(`${config.apiURL}/log-in`, data)
                .then((res) => {
                    setLoading(false)
                    setSuccessMessage('Logged in')
                    setSuccess(true)
                    // add access token to cookies (max-age: 7 days in seconds)
                    document.cookie = `accessToken=${res.data}; path=/ ; max-age=604800`
                    // get account data and navigate to 'all' if on home page
                    getAccountData()
                    setTimeout(() => {
                        if (location.pathname === '/') history('/s/all')
                        close()
                    }, 1000)
                })
                .catch((error) => {
                    setLoading(false)
                    switch (error.response.data.message) {
                        case 'User not found':
                            invalidateItem('emailOrHandle', 'User not found')
                            break
                        case 'Incorrect password':
                            invalidateItem('password', 'Incorrect password')
                            break
                        case 'Spam account':
                            setErrorMessage(
                                'Sorry, your account has been marked as spam. Email admin@weco.io if you think this is a mistake.'
                            )
                            break
                        case 'Email not yet verified':
                            setErrorMessage('Email not yet verified')
                            setShowResendVerificationEmail(true)
                            setVerificationEmailUserId(error.response.data.userId)
                            break
                        default:
                            console.log(error)
                            break
                    }
                })
        }
    }

    function resendVerificationEmail() {
        setVerificationEmailLoading(true)
        axios
            .post(`${config.apiURL}/resend-verification-email`, { userId: verificationEmailUserId })
            .then(() => {
                setVerificationEmailLoading(false)
                setSuccessMessage(`We've sent you a new verification email.`)
                setSuccess(true)
            })
            .catch((error) => {
                if (error.response.status === 404) setErrorMessage('Account not found')
                setVerificationEmailLoading(false)
            })
    }

    return (
        <Modal centerX centerY close={close}>
            {success ? (
                <SuccessMessage text={successMessage} />
            ) : (
                <form onSubmit={logIn} style={{ maxWidth: 300 }}>
                    <h1>Log in</h1>
                    <Column style={{ width: 250 }}>
                        <Input
                            type='text'
                            title='Handle or email'
                            placeholder='handle or email...'
                            state={emailOrHandle.state}
                            errors={emailOrHandle.errors}
                            value={emailOrHandle.value}
                            onChange={(v) => updateItem('emailOrHandle', v)}
                            style={{ marginBottom: 10 }}
                            autoFill
                        />
                        <Input
                            type='password'
                            title='Password'
                            placeholder='password...'
                            state={password.state}
                            errors={password.errors}
                            value={password.value}
                            onChange={(v) => updateItem('password', v)}
                            style={{ marginBottom: 30 }}
                            autoFill
                        />
                    </Column>
                    {errorMessage.length > 0 && (
                        <p className='danger' style={{ marginBottom: 20 }}>
                            {errorMessage}
                        </p>
                    )}
                    {showResendVerificationEmail && (
                        <Button
                            text='Resend verification email'
                            color='purple'
                            loading={verificationEmailLoading}
                            onClick={resendVerificationEmail}
                            style={{ marginBottom: 20 }}
                        />
                    )}
                    <Button
                        text='Log in'
                        color='blue'
                        disabled={
                            loading ||
                            emailOrHandle.state === 'invalid' ||
                            password.state === 'invalid' ||
                            errorMessage.length > 0
                        }
                        loading={loading}
                        style={{ marginBottom: 20 }}
                        submit
                    />
                    <Button
                        text='New account'
                        color='aqua'
                        onClick={() => {
                            setRegisterModalOpen(true)
                            close()
                        }}
                    />
                    <Column centerX style={{ marginTop: 20 }}>
                        <button
                            type='button'
                            className={styles.textButton}
                            onClick={() => {
                                setForgotPasswordModalOpen(true)
                                close()
                            }}
                        >
                            Forgot your password?
                        </button>
                    </Column>
                </form>
            )}
        </Modal>
    )
}

export default LogInModal
