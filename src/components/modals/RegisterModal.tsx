import Button from '@components/Button'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import {
    allValid,
    defaultErrorState,
    invalidateFormItem,
    isValidEmail,
    simplifyText,
    updateFormItem,
} from '@src/Helpers'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

function RegisterModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { setLogInModalOpen } = useContext(AccountContext)
    const { executeRecaptcha } = useGoogleReCaptcha()
    const [formData, setFormData] = useState({
        handle: {
            value: '',
            validate: (v) => (!v || v.length > 30 ? ['Must be between 1 and 30 characters'] : []),
            ...defaultErrorState,
        },
        name: {
            value: '',
            validate: (v) => (!v || v.length > 30 ? ['Must be between 1 and 30 characters'] : []),
            ...defaultErrorState,
        },
        email: {
            value: '',
            validate: (v) => (!isValidEmail(v) ? ['Must be a valid email'] : []),
            ...defaultErrorState,
        },
        password: {
            value: '',
            validate: (v) => (!v ? ['Required'] : []),
            ...defaultErrorState,
        },
        confirmPassword: {
            value: '',
            ...defaultErrorState,
        },
    })
    const { handle, name, email, password, confirmPassword } = formData
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const errors = [
        name.state,
        handle.state,
        email.state,
        password.state,
        confirmPassword.state,
    ].includes('invalid')

    function updateItem(item, value) {
        setErrorMessage('')
        updateFormItem(formData, setFormData, item, value)
    }

    async function register(e) {
        e.preventDefault()
        // add password to confirmPassword validate function
        const newFormData = {
            ...formData,
            confirmPassword: {
                ...confirmPassword,
                validate: (v) => {
                    if (!v) return ['Required']
                    if (v !== password.value) return ['Must match password']
                    return []
                },
            },
        }
        setFormData(newFormData)
        if (allValid(newFormData, setFormData)) {
            setLoading(true)
            const reCaptchaToken = await executeRecaptcha!('login')
            const data = {
                reCaptchaToken,
                handle: handle.value,
                name: name.value,
                email: email.value,
                password: password.value,
            }
            axios
                .post(`${config.apiURL}/register`, data)
                .then(() => {
                    setLoading(false)
                    setSuccess(true)
                })
                .catch((error) => {
                    setLoading(false)
                    switch (error.response.data.message) {
                        case 'Handle taken':
                            invalidateFormItem(formData, setFormData, 'handle', 'Handle taken')
                            break
                        case 'Email taken':
                            invalidateFormItem(formData, setFormData, 'email', 'Email taken')
                            break
                        case 'Recaptcha failed':
                            setErrorMessage('reCAPTCHA test failed')
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
        if (recaptchaBadge) {
            recaptchaBadge.style.visibility = 'visible'
            recaptchaBadge.style.zIndex = '500'
        }
        return () => {
            if (recaptchaBadge) recaptchaBadge.style.visibility = 'hidden'
        }
    })

    return (
        <Modal close={close} centerX confirmClose={!success}>
            {success ? (
                <SuccessMessage text="Success! We've sent you an email. Follow the instructions there to complete the registration process." />
            ) : (
                <form onSubmit={register} style={{ maxWidth: 400 }}>
                    <h1>Create a new account</h1>
                    <Input
                        type='text'
                        title='Handle (the unique name used in your profiles URL)'
                        prefix='weco.io/u/'
                        placeholder='handle...'
                        state={handle.state}
                        errors={handle.errors}
                        value={handle.value}
                        onChange={(v) => updateItem('handle', simplifyText(v))}
                        style={{ marginBottom: 10 }}
                    />
                    <Input
                        type='text'
                        title='Visible name (max 30 characters)'
                        placeholder='name...'
                        state={name.state}
                        errors={name.errors}
                        value={name.value}
                        onChange={(v) => updateItem('name', v)}
                        style={{ marginBottom: 10 }}
                    />
                    <Input
                        type='email'
                        title='Email'
                        placeholder='email...'
                        state={email.state}
                        errors={email.errors}
                        value={email.value}
                        onChange={(v) => updateItem('email', v)}
                        style={{ marginBottom: 10 }}
                    />
                    <Input
                        type='password'
                        title='Password'
                        placeholder='password...'
                        state={password.state}
                        errors={password.errors}
                        value={password.value}
                        onChange={(v) => updateItem('password', v)}
                        style={{ marginBottom: 10 }}
                    />
                    <Input
                        type='password'
                        title='Confirm password'
                        placeholder='password...'
                        state={confirmPassword.state}
                        errors={confirmPassword.errors}
                        value={confirmPassword.value}
                        onChange={(v) => updateItem('confirmPassword', v)}
                        style={{ marginBottom: 10 }}
                    />
                    {errorMessage.length > 0 && (
                        <p className='danger' style={{ marginBottom: 20 }}>
                            {errorMessage}
                        </p>
                    )}
                    <Button
                        text='Create account'
                        color='aqua'
                        disabled={loading || errors}
                        loading={loading}
                        style={{ margin: '20px 0 20px 0' }}
                        submit
                    />
                    <p>
                        Already registered?{' '}
                        <button
                            type='button'
                            className={styles.textButton}
                            onClick={() => {
                                setLogInModalOpen(true)
                                close()
                            }}
                        >
                            Log in
                        </button>
                    </p>
                </form>
            )}
        </Modal>
    )
}

export default RegisterModal
