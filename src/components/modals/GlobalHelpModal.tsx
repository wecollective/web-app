import Button from '@components/Button'
import Input from '@components/Input'
import SuccessMessage from '@components/SuccessMessage'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function GlobalHelpModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { loggedIn } = useContext(AccountContext)
    const cookies = new Cookies()
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [messageLoading, setMessageLoading] = useState(false)
    const [messageSent, setMessageSent] = useState(false)

    function sendMessage() {
        setMessageLoading(true)
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        const data = { message, email }
        axios
            .post(`${config.apiURL}/help-message`, data, authHeader)
            .then(() => {
                setMessageLoading(false)
                setMessageSent(true)
                setTimeout(() => close(), 2000)
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal centerX close={close}>
            <h1>Have a question or run into a bug?</h1>
            <p>Let us know and we&apos;ll get back to you ASAP</p>
            {!loggedIn && (
                <Input
                    type='text'
                    title='Your email:'
                    value={email}
                    onChange={(v) => setEmail(v)}
                    style={{ marginBottom: 20 }}
                />
            )}
            <Input
                type='text-area'
                title={loggedIn ? '' : 'Message:'}
                rows={6}
                value={message}
                onChange={(v) => setMessage(v)}
                style={{ marginBottom: 20 }}
            />
            <Button
                text='Send message'
                color='blue'
                disabled={(!loggedIn && !email) || !message || messageLoading}
                loading={messageLoading}
                onClick={sendMessage}
                style={{ marginBottom: 10 }}
            />
            {messageSent && <SuccessMessage text='Message sent! Thanks for reaching out.' />}
        </Modal>
    )
}

export default GlobalHelpModal
