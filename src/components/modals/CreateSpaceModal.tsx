import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import Toggle from '@components/Toggle'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import {
    allValid,
    defaultErrorState,
    findDraftLength,
    invalidateFormItem,
    updateFormItem,
} from '@src/Helpers'
import styles from '@styles/components/modals/CreateSpaceModal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function CreateSpaceModal(): JSX.Element {
    const { accountData, setCreateSpaceModalOpen } = useContext(AccountContext)
    const { isModerator, spaceData } = useContext(SpaceContext)
    const [formData, setFormData] = useState({
        handle: {
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 30) errors.push('Must be less than 30 characters')
                return errors
            },
            ...defaultErrorState,
        },
        name: {
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 50) errors.push('Must be less than 50 characters')
                return errors
            },
            ...defaultErrorState,
        },
        description: {
            value: '',
            validate: (v) => {
                const errors: string[] = []
                const totalCharacters = findDraftLength(v)
                if (!totalCharacters) errors.push('Required')
                if (totalCharacters > 5000) errors.push('Must be less than 5K characters')
                return errors
            },
            ...defaultErrorState,
        },
    })
    const { handle, name, description } = formData
    const [privateSpace, setPrivateSpace] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const location = useLocation()
    const history = useNavigate()
    const cookies = new Cookies()
    const authorized = isModerator || spaceData.id === 1 || !spaceData.id
    const allFlag = 'https://weco-prod-space-flag-images.s3.eu-west-1.amazonaws.com/1614556880362'

    function updateItem(item, value) {
        updateFormItem(formData, setFormData, item, value)
    }

    function createSpace(e) {
        e.preventDefault()
        if (allValid(formData, setFormData)) {
            setLoading(true)
            const data = {
                // todo: get account details server side?
                accountName: accountData.name,
                accountHandle: accountData.handle,
                parentId: spaceData.id || 1,
                handle: handle.value,
                name: name.value,
                description: description.value,
                private: privateSpace,
            }
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/create-space`, data, options)
                .then((res) => {
                    if (res.data.message === 'pending-acceptance')
                        setSuccessMessage('Space created and request sent to moderators')
                    else setSuccessMessage(`Space created and attached to '${spaceData.name}'`)
                    setSuccess(true)
                    setLoading(false)
                    setTimeout(() => {
                        history(`/s/${data.handle}/posts`)
                        setCreateSpaceModalOpen(false)
                    }, 1000)
                })
                .catch((error) => {
                    if (error.response) {
                        const { message } = error.response.data
                        switch (message) {
                            case 'handle-taken':
                                invalidateFormItem(formData, setFormData, 'handle', 'Handle taken')
                                break
                            case 'not-logged-in':
                                break
                            default:
                                console.log('Error message: ', message)
                                break
                        }
                    } else {
                        console.log(error)
                    }
                    setLoading(false)
                })
        }
    }

    return (
        <Modal close={() => setCreateSpaceModalOpen(false)} centerX confirmClose={!success}>
            {success ? (
                <SuccessMessage text={successMessage} />
            ) : (
                <Column centerX className={styles.wrapper}>
                    <Column centerX style={{ marginBottom: 30, fontSize: 24 }}>
                        <p>Create a new space in</p>
                        <ImageTitle
                            type='space'
                            imagePath={spaceData.id ? spaceData.flagImagePath : allFlag}
                            imageSize={40}
                            title={
                                spaceData.id
                                    ? `${spaceData.name} (s/${spaceData.handle})`
                                    : 'All (s/all)'
                            }
                            fontSize={24}
                        />
                    </Column>
                    {!authorized && (
                        <Column>
                            <p style={{ marginBottom: 10 }}>
                                You&apos;re not authorised to create a space here automatically.
                            </p>
                            <p style={{ marginBottom: 10 }}>
                                If you want, you can create it anyway and a request will be sent to{' '}
                                {spaceData.name}&apos;s moderators.
                            </p>
                            <p style={{ marginBottom: 10 }}>
                                Until it&apos;s accepted by them your space will appear in the root
                                space <Link to='/s/all/spaces'>s/all</Link>.
                            </p>
                        </Column>
                    )}
                    <p>
                        You will be the default moderator of the space and have access to its
                        settings.
                    </p>
                    <br />
                    <form onSubmit={createSpace}>
                        <Row centerX style={{ marginBottom: 20 }}>
                            <Toggle
                                leftText='Public'
                                rightColor='blue'
                                positionLeft={privateSpace}
                                onClick={() => setPrivateSpace(!privateSpace)}
                                onOffText
                            />
                        </Row>
                        <Input
                            type='text'
                            title='Space handle (must be unique)'
                            prefix='weco.io/s/'
                            placeholder='handle...'
                            value={handle.value}
                            state={handle.state}
                            errors={handle.errors}
                            onChange={(v) =>
                                updateItem('handle', v.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                            }
                            style={{ marginBottom: 20 }}
                        />
                        <Input
                            type='text'
                            title='Space name (max 30 characters)'
                            placeholder='name...'
                            value={name.value}
                            state={name.state}
                            errors={name.errors}
                            onChange={(v) => updateItem('name', v)}
                            style={{ marginBottom: 20 }}
                        />
                        <Column style={{ width: '100%', marginBottom: 40 }}>
                            <p style={{ fontSize: 14, marginBottom: 5 }}>Space description</p>
                            <DraftTextEditor
                                type='other'
                                stringifiedDraft={description.value}
                                maxChars={5000}
                                onChange={(v) => updateItem('description', v)}
                                state={description.state}
                                errors={description.errors}
                            />
                        </Column>
                        <Row centerX>
                            <Button
                                text={authorized ? 'Create space' : 'Create space and send request'}
                                color='blue'
                                style={{ marginRight: 10 }}
                                disabled={loading}
                                loading={loading}
                                submit
                            />
                        </Row>
                    </form>
                </Column>
            )}
        </Modal>
    )
}

export default CreateSpaceModal
