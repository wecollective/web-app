import Button from '@components/Button'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import styles from '@styles/components/GlobalHelpButton.module.scss'
import { HelpIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

const GlobalHelpButton = (): JSX.Element => {
    const { loggedIn } = useContext(AccountContext)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [helpMessage, setHelpMessage] = useState('')
    const [helpMessageLoading, setHelpMessageLoading] = useState(false)
    const [helpMessageSent, setHelpMessageSent] = useState(false)
    const cookies = new Cookies()

    function sendHelpMessage() {
        setHelpMessageLoading(true)
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        const data = { helpMessage, email }
        axios
            .post(`${config.apiURL}/help-message`, data, authHeader)
            .then(() => {
                setHelpMessageLoading(false)
                setHelpMessageSent(true)
                setTimeout(() => {
                    setHelpModalOpen(false)
                    setHelpMessageSent(false)
                    setHelpMessage('')
                }, 2000)
            })
            .catch((error) => console.log(error))
    }

    return (
        <div className={styles.wrapper}>
            <button
                className={styles.helpButton}
                type='button'
                onClick={() => setHelpModalOpen(true)}
            >
                <HelpIcon />
            </button>
            {helpModalOpen && (
                <Modal centered close={() => setHelpModalOpen(false)}>
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
                        value={helpMessage}
                        onChange={(v) => setHelpMessage(v)}
                        style={{ marginBottom: 20 }}
                    />
                    <Button
                        text='Send message'
                        color='blue'
                        disabled={(!loggedIn && !email) || !helpMessage || helpMessageLoading}
                        loading={helpMessageLoading}
                        onClick={sendHelpMessage}
                        style={{ marginBottom: 10 }}
                    />
                    {helpMessageSent && (
                        <SuccessMessage text='Message sent! Thanks for reaching out.' />
                    )}
                </Modal>
            )}
        </div>
    )
}

export default GlobalHelpButton
