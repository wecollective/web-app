import Button from '@components/Button'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function DeleteAccountModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { logOut } = useContext(AccountContext)
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()
    const history = useNavigate()

    function deleteAccount() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .post(`${config.apiURL}/delete-account`, null, authHeader)
            .then(() => {
                setLoading(false)
                setShowSuccessMessage(true)
                setTimeout(() => {
                    logOut()
                    history(`/s/all`)
                }, 2000)
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal centerX close={close} style={{ maxWidth: 600, textAlign: 'center' }}>
            <h1>Delete Account</h1>
            <p>Are you sure you want to permanently delete your account?</p>
            <p>
                All your posts, comments, reactions, and personal data will be removed from the
                database.
            </p>
            <Row style={{ marginBottom: 20 }}>
                <Button
                    text='No'
                    color='blue'
                    disabled={loading}
                    onClick={close}
                    style={{ marginRight: 10 }}
                />
                <Button
                    text='Yes, delete my account'
                    color='red'
                    disabled={loading}
                    loading={loading}
                    onClick={deleteAccount}
                />
            </Row>
            {showSuccessMessage && <SuccessMessage text='Account deleted' />}
        </Modal>
    )
}

export default DeleteAccountModal
