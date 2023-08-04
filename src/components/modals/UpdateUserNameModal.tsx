import Button from '@components/Button'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
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
    const [newName, setNewName] = useState(accountData.name || '')
    const [loading, setLoading] = useState(false)
    const mobileView = document.documentElement.clientWidth < 900
    const cookies = new Cookies()
    const maxChars = 30

    function disabled() {
        const unchanged = newName === accountData.name
        return loading || unchanged || newName.length < 1 || newName.length > maxChars
    }

    function updateUserName() {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/update-account-name`, { name: newName }, options)
            .then(() => {
                setLoading(false)
                setAccountData({ ...accountData, name: newName })
                setUserData({ ...userData, name: newName })
                close()
            })
            .catch((error) => console.log('error: ', error))
    }

    return (
        <Modal centerX close={close} style={{ width: mobileView ? '100%' : 500 }}>
            <h1>Edit your account name</h1>
            <Input
                type='text'
                placeholder='name...'
                value={newName}
                onChange={(value) => setNewName(value)}
            />
            <div className={styles.footer}>
                <Button
                    text='Save'
                    color='blue'
                    style={{ marginRight: 10 }}
                    loading={loading}
                    disabled={disabled()}
                    onClick={updateUserName}
                />
            </div>
        </Modal>
    )
}

export default UpdateUserNameModal
