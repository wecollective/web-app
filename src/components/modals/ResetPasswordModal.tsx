import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { allValid, defaultErrorState } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const ResetPasswordModal = (): JSX.Element => {
    const { setResetPasswordModalOpen, resetPasswordToken, setLogInModalOpen } = useContext(
        AccountContext
    )
    const [formData, setFormData] = useState<any>({
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
    const { password, confirmPassword } = formData
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    function resetPassword() {
        // add new password to validate function
        const newFormData = {
            ...formData,
            confirmPassword: {
                ...confirmPassword,
                validate: (v) => {
                    if (!v) return ['Required']
                    if (v !== password.value) return ['Must match new password']
                    return []
                },
            },
        }
        setFormData(newFormData)
        if (allValid(newFormData, setFormData)) {
            setLoading(true)
            const data = { password: password.value, token: resetPasswordToken }
            axios
                .post(`${config.apiURL}/reset-password`, data)
                .then(() => {
                    setSuccess(true)
                    setLoading(false)
                })
                .catch((error) => {
                    if (error.response.status === 404)
                        setErrorMessage('Sorry, your password reset token has expired')
                    else console.log(error)
                    setLoading(false)
                })
        }
    }

    return (
        <Modal centered close={() => setResetPasswordModalOpen(false)}>
            {success ? (
                <Column centerX>
                    <SuccessMessage text='Success! Password updated' />
                    <Button
                        text='Log in'
                        color='blue'
                        onClick={() => {
                            setResetPasswordModalOpen(false)
                            setLogInModalOpen(true)
                        }}
                        style={{ marginTop: 20 }}
                    />
                </Column>
            ) : (
                <Column centerX>
                    <h1>Reset your password</h1>
                    <Input
                        type='password'
                        title='New password'
                        placeholder='password...'
                        state={password.state}
                        errors={password.errors}
                        value={password.value}
                        onChange={(newValue) => {
                            setFormData({
                                ...formData,
                                password: {
                                    ...password,
                                    state: 'default',
                                    value: newValue,
                                },
                            })
                        }}
                        style={{ marginBottom: 10 }}
                        autoFill
                    />
                    <Input
                        type='password'
                        title='Confirm password'
                        placeholder='password...'
                        state={confirmPassword.state}
                        errors={confirmPassword.errors}
                        value={confirmPassword.value}
                        onChange={(newValue) => {
                            setFormData({
                                ...formData,
                                confirmPassword: {
                                    ...confirmPassword,
                                    state: 'default',
                                    value: newValue,
                                },
                            })
                        }}
                        style={{ marginBottom: 30 }}
                        autoFill
                    />
                    {errorMessage.length > 0 && (
                        <p className='danger' style={{ marginBottom: 30 }}>
                            {errorMessage}
                        </p>
                    )}
                    <Button
                        text='Reset password'
                        color='blue'
                        loading={loading}
                        disabled={loading || errorMessage.length > 0}
                        onClick={resetPassword}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default ResetPasswordModal
