import Button from '@components/Button'
import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import Modal from '@components/modals/Modal'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { defaultErrorState, findDraftLength, isValid } from '@src/Helpers'
import styles from '@styles/components/modals/EditPostModal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

const EditPostModal = (props: {
    postData: any
    setPostData: (data: any) => void
    close: () => void
}): JSX.Element => {
    const { postData, setPostData, close } = props
    const { accountData, setAlertMessage, setAlertModalOpen } = useContext(AccountContext)
    const [newText, setNewText] = useState({
        ...defaultErrorState,
        value: postData.text,
        validate: (v) => {
            const errors: string[] = []
            const totalCharacters = findDraftLength(v)
            if (totalCharacters < 1) errors.push('Required')
            if (totalCharacters > 5000) errors.push('Must be less than 5K characters')
            return errors
        },
    })
    const [mentions, setMentions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const cookies = new Cookies()

    function saveTextChanges() {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Log in again to edit your post')
            setAlertModalOpen(true)
        } else if (isValid(newText, setNewText)) {
            setLoading(true)
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = {
                postId: postData.id,
                type: postData.type,
                text: newText.value,
                mentions: mentions.map((m) => m.link),
                creatorName: accountData.name,
                creatorHandle: accountData.handle,
            }
            axios
                .post(`${config.apiURL}/update-post-text`, data, options)
                .then(() => {
                    setPostData({
                        ...postData,
                        text: newText.value,
                        updatedAt: new Date().toISOString(),
                    })
                    setSuccess(true)
                    setLoading(false)
                    setTimeout(() => {
                        close()
                        setSuccess(false)
                    }, 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Modal className={styles.wrapper} close={close} centered>
            {success ? (
                <SuccessMessage text='Changes saved' />
            ) : (
                <Column centerX style={{ width: '100%', maxWidth: 700 }}>
                    <h1>Edit post text</h1>
                    <DraftTextEditor
                        type='post'
                        stringifiedDraft={newText.value}
                        maxChars={5000}
                        onChange={(value, userMentions) => {
                            if (value !== newText.value)
                                setNewText((t) => {
                                    return { ...t, value, state: 'default' }
                                })
                            setMentions(userMentions)
                        }}
                        state={newText.state}
                        errors={newText.errors}
                        style={{ marginBottom: 20 }}
                    />
                    <Button
                        color='blue'
                        text='Save changes'
                        disabled={newText.value === postData.text || loading}
                        loading={loading}
                        onClick={saveTextChanges}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default EditPostModal
