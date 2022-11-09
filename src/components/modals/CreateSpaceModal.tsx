import Button from '@components/Button'
import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import Toggle from '@components/Toggle'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { allValid, defaultErrorState, defaultSpaceData, findDraftLength } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import Cookies from 'universal-cookie'

const CreateSpaceModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const { accountData, setAccountData, setAlertModalOpen, setAlertMessage } = useContext(
        AccountContext
    )
    const {
        isModerator,
        spaceData,
        setSpaceData,
        spaceSpaces,
        setSpaceSpaces,
        spaceMapData,
        setSpaceMapData,
    } = useContext(SpaceContext)
    const [formData, setFormData] = useState({
        handle: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 30) errors.push('Must be less than 30 characters')
                return errors
            },
        },
        name: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 50) errors.push('Must be less than 50 characters')
                return errors
            },
        },
        description: {
            ...defaultErrorState,
            value: '',
            validate: (v) => {
                const errors: string[] = []
                const totalCharacters = findDraftLength(v)
                if (!totalCharacters) errors.push('Required')
                if (totalCharacters > 5000) errors.push('Must be less than 5K characters')
                return errors
            },
        },
    })
    const { handle, name, description } = formData
    const [privateSpace, setPrivateSpace] = useState(false)
    const [loading, setLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const cookies = new Cookies()
    const authorized = isModerator || spaceData.id === 1

    function createSpace(e) {
        e.preventDefault()
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Log in to create a new space')
            setAlertModalOpen(true)
        } else if (allValid(formData, setFormData)) {
            setLoading(true)
            const data = {
                accountName: accountData.name,
                accountHandle: accountData.handle,
                parentId: spaceData.id,
                authorizedToAttachParent: authorized,
                handle: handle.value,
                name: name.value,
                description: description.value,
                private: privateSpace,
            }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/create-space`, data, options)
                .then((res) => {
                    setLoading(false)
                    const newSpaceData = {
                        ...defaultSpaceData,
                        id: res.data.spaceId,
                        handle: handle.value,
                        name: name.value,
                        description: description.value,
                    }
                    setAccountData({
                        ...accountData,
                        FollowedSpaces: [...accountData.FollowedSpaces, newSpaceData],
                        ModeratedSpaces: [...accountData.ModeratedSpaces, newSpaceData],
                    })
                    if (res.data.message === 'pending-acceptance') {
                        setSuccessMessage('Space created and request sent to moderators')
                    } else {
                        setSpaceData({
                            ...spaceData,
                            DirectChildSpaces: [newSpaceData, ...spaceData.DirectChildSpaces],
                        })
                        setSpaceMapData({
                            ...spaceMapData,
                            children: [newSpaceData, ...spaceMapData.children],
                        })
                        setSpaceSpaces([newSpaceData, ...spaceSpaces])
                        setSuccessMessage(`Space created and attached to '${spaceData.name}'`)
                    }
                    setTimeout(() => close(), 3000)
                })
                .catch((error) => {
                    if (!error.response) console.log(error)
                    else {
                        const { message } = error.response.data
                        if (message === 'handle-taken')
                            setFormData({
                                ...formData,
                                handle: {
                                    ...formData.handle,
                                    state: 'invalid',
                                    errors: ['Handle already taken'],
                                },
                            })
                    }
                })
        }
    }

    return (
        <Modal close={close} centered confirmClose style={{ maxWidth: 600 }}>
            {successMessage.length > 0 ? (
                <SuccessMessage text={successMessage} />
            ) : (
                <Column>
                    <Column centerX style={{ marginBottom: 30, fontSize: 24 }}>
                        <p>Create a new space in</p>
                        <ImageTitle
                            type='space'
                            imagePath={spaceData.flagImagePath}
                            imageSize={40}
                            title={`${spaceData.name} (s/${spaceData.handle})`}
                            fontSize={24}
                        />
                    </Column>
                    {!authorized && (
                        <Column>
                            <p>You&apos;re not authorised to create a space here automatically.</p>
                            <br />
                            <p>
                                If you want, you can create it anyway and a request will be sent to{' '}
                                {spaceData.name}&apos;s moderators.
                            </p>
                            <br />
                            <p>
                                Until it&apos;s accepted by them your space will appear in the root
                                space <Link to='/s/all/spaces'>s/all</Link>.
                            </p>
                            <br />
                        </Column>
                    )}
                    <p>
                        You will be the default moderator of the space and have access to its
                        settings.
                    </p>
                    <br />
                    <form onSubmit={createSpace}>
                        <Row centerY style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 14, marginRight: 10 }}>Privacy:</p>
                            <Toggle
                                leftText='Public'
                                rightText='Private'
                                rightColor='blue'
                                positionLeft={!privateSpace}
                                onClick={() => setPrivateSpace(!privateSpace)}
                            />
                        </Row>
                        <Input
                            type='text'
                            title='Handle (the unique name used in your spaces URL)'
                            prefix='weco.io/s/'
                            placeholder='handle...'
                            value={handle.value}
                            state={handle.state}
                            errors={handle.errors}
                            onChange={(value) => {
                                setFormData({
                                    ...formData,
                                    handle: {
                                        ...formData.handle,
                                        value: value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                                        state: 'default',
                                    },
                                })
                            }}
                            style={{ marginBottom: 20 }}
                        />
                        <Input
                            type='text'
                            title='Visible name (max 30 characters)'
                            placeholder='name...'
                            value={name.value}
                            state={name.state}
                            errors={name.errors}
                            onChange={(value) => {
                                setFormData({
                                    ...formData,
                                    name: {
                                        ...formData.name,
                                        value,
                                        state: 'default',
                                    },
                                })
                            }}
                            style={{ marginBottom: 20 }}
                        />
                        <Column style={{ width: '100%', marginBottom: 40 }}>
                            <p style={{ fontSize: 14, marginBottom: 5 }}>Description</p>
                            <DraftTextEditor
                                type='post'
                                stringifiedDraft={description.value}
                                maxChars={5000}
                                onChange={(value) => {
                                    setFormData({
                                        ...formData,
                                        description: {
                                            ...formData.description,
                                            value,
                                            state: 'default',
                                        },
                                    })
                                }}
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
