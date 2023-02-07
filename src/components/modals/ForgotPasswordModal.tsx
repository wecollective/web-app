import Button from '@components/Button'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { defaultErrorState, isValid } from '@src/Helpers'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const ForgotPasswordModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const { setLogInModalOpen } = useContext(AccountContext)
    const { executeRecaptcha } = useGoogleReCaptcha()
    // todo: add email regex
    const [email, setEmail] = useState({
        value: '',
        validate: (v) => (!v ? ['Required'] : []),
        ...defaultErrorState,
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    async function sendResetLink(e) {
        e.preventDefault()
        if (isValid(email, setEmail)) {
            setLoading(true)
            const reCaptchaToken = await executeRecaptcha('resetPasswordRequest')
            const data = { reCaptchaToken, email: email.value }
            axios
                .post(`${config.apiURL}/reset-password-request`, data)
                .then(() => {
                    setLoading(false)
                    setSuccess(true)
                })
                .catch((error) => {
                    setLoading(false)
                    switch (error.response.data.message) {
                        case 'User not found':
                            setEmail({ ...email, state: 'invalid', errors: ['User not found'] })
                            break
                        default:
                            console.log(error)
                            break
                    }
                })
        }
    }

    useEffect(() => {
        // make recaptcha flag visible
        const recaptchaBadge = document.getElementsByClassName('grecaptcha-badge')[0] as HTMLElement
        recaptchaBadge.style.visibility = 'visible'
        recaptchaBadge.style.zIndex = '500'
        return () => {
            recaptchaBadge.style.visibility = 'hidden'
        }
    })

    return (
        <Modal close={close} centered>
            {success ? (
                <SuccessMessage text="Success! We've sent you an email with a link to reset your password." />
            ) : (
                <form onSubmit={sendResetLink} style={{ maxWidth: 400, textAlign: 'center' }}>
                    <h1>Forgot your password?</h1>
                    <p>
                        Enter your email and we&apos;ll message you with a link to create a new one
                    </p>
                    <Input
                        type='email'
                        placeholder='email...'
                        state={email.state}
                        errors={email.errors}
                        value={email.value}
                        onChange={(v) => setEmail({ ...email, state: 'default', value: v })}
                        style={{ margin: '10px 0' }}
                    />
                    <Button
                        text='Send reset link'
                        color='blue'
                        loading={loading}
                        disabled={loading || email.state === 'invalid'}
                        style={{ margin: '20px 0 20px 0' }}
                        submit
                    />
                    <button
                        type='button'
                        className={styles.textButton}
                        onClick={() => {
                            close()
                            setLogInModalOpen(true)
                        }}
                    >
                        Return to log in
                    </button>
                </form>
            )}
        </Modal>
    )
}

export default ForgotPasswordModal
