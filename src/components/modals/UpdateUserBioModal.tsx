import Button from '@components/Button'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { findDraftLength } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function UpdateUserBioModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { accountData, setAccountData } = useContext(AccountContext)
    const { userData, setUserData } = useContext(UserContext)
    const [newBio, setNewBio] = useState(accountData.bio || '')
    const [mentions, setMentions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const mobileView = document.documentElement.clientWidth < 900
    const maxChars = 10000
    const cookies = new Cookies()

    function disabled() {
        return loading || newBio === accountData.bio || findDraftLength(newBio) > maxChars
    }

    function updateUserBio() {
        // todo: handle mentions
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const bio = findDraftLength(newBio) === 0 ? null : newBio
        axios
            .post(`${config.apiURL}/update-account-bio`, { bio }, options)
            .then(() => {
                setLoading(false)
                setAccountData({ ...accountData, bio })
                setUserData({ ...userData, bio })
                close()
            })
            .catch((error) => console.log('error: ', error))
    }

    return (
        <Modal close={close} centerX confirmClose style={{ width: mobileView ? '100%' : 800 }}>
            <h1>Edit your account bio</h1>
            <DraftTextEditor
                type='other'
                text={newBio}
                maxChars={maxChars}
                onChange={(value, userMentions) => {
                    setNewBio(value)
                    setMentions(userMentions)
                }}
                style={{ width: '100%' }}
            />
            <Button
                text='Save'
                color='blue'
                loading={loading}
                disabled={disabled()}
                onClick={updateUserBio}
                style={{ marginTop: 30 }}
            />
        </Modal>
    )
}

export default UpdateUserBioModal
