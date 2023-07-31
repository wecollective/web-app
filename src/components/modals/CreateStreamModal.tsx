import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import styles from '@styles/components/modals/CreateStreamModal.module.scss'
import { ImageIcon, SpacesIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function CreateStreamModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { accountData, setCreateSpaceModalOpen } = useContext(AccountContext)
    const { isModerator, spaceData } = useContext(SpaceContext)
    const [image, setImage] = useState<any>(null)
    const [name, setName] = useState('')
    const [handle, setHandle] = useState('')
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [spaces, setSpaces] = useState<any[]>([])
    const [userOptions, setUserOptions] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const spaceSearch = useRef('')
    const userSearch = useRef('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const location = useLocation()
    const history = useNavigate()
    const cookies = new Cookies()

    function addImage() {
        const input = document.getElementById('stream-image-file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            if (input.files[0].size > imageMBLimit * 1024 * 1024) {
                // display error
                input.value = ''
            } else {
                setImage(input.files[0])
            }
        }
    }

    function findSpaces(query) {
        spaceSearch.current = query
        if (query.length < 1) setSpaceOptions([])
        else {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const data = { query, spaceAccessRequired: true }
            axios
                .post(`${config.apiURL}/find-spaces`, data, options)
                .then((res) => {
                    if (spaceSearch.current === query) setSpaceOptions(res.data)
                })
                .catch((error) => console.log(error))
        }
    }

    function findUsers(query) {
        userSearch.current = query
        if (query.length < 1) setUserOptions([])
        else {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const data = { query, spaceAccessRequired: true }
            axios
                .post(`${config.apiURL}/find-people`, data, options)
                .then((res) => {
                    if (userSearch.current === query) setUserOptions(res.data)
                })
                .catch((error) => console.log(error))
        }
    }

    function createStreamDisabled() {
        const noSources = spaces.length === 0 && users.length === 0
        return !name || !handle || noSources
    }

    function createStream() {
        console.log('create stream')
    }

    return (
        <Modal centerX close={close} className={styles.wrapper}>
            {success ? (
                <SuccessMessage text={successMessage} />
            ) : (
                <Column centerX style={{ width: 350 }}>
                    <h1>Create a new stream</h1>
                    <Column centerX centerY className={styles.image}>
                        {image && <img src={URL.createObjectURL(image)} alt='' />}
                        <ImageIcon />
                        <label htmlFor='stream-image-file-input'>
                            <input
                                type='file'
                                id='stream-image-file-input'
                                accept='.png, .jpg, .jpeg, .gif'
                                onChange={addImage}
                                hidden
                            />
                        </label>
                    </Column>
                    <Input
                        type='text'
                        title='Name'
                        placeholder='name...'
                        value={name}
                        maxLength={30}
                        onChange={(v) => {
                            setName(v)
                            setHandle(v.toLowerCase().replace(/[^a-z0-9]/g, '-'))
                        }}
                        style={{ marginBottom: 20 }}
                    />
                    <Input
                        type='text'
                        title='Unique handle'
                        prefix='streams/'
                        placeholder='handle...'
                        value={handle}
                        maxLength={30}
                        // state={handle.state}
                        // errors={handle.errors}
                        onChange={(v) => setHandle(v.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                        style={{ marginBottom: 40 }}
                    />
                    <p style={{ marginBottom: 20 }}>Add sources to your stream:</p>
                    <Row centerY style={{ width: '100%', marginBottom: 10 }}>
                        <SpacesIcon
                            style={{ width: 25, height: 25, color: '#bbb', marginRight: 10 }}
                        />
                        <SearchSelector
                            type='space'
                            placeholder='Space name or handle...'
                            onSearchQuery={(query) => findSpaces(query)}
                            onOptionSelected={(space) => {
                                setSpaces([...spaces, space])
                                setSpaceOptions([])
                            }}
                            onBlur={() => setTimeout(() => setSpaceOptions([]), 200)}
                            options={spaceOptions}
                            style={{ width: '100%' }}
                        />
                    </Row>
                    {spaces.map((space) => (
                        <Row centerY style={{ marginBottom: 10 }}>
                            <ImageTitle
                                type='space'
                                imagePath={space.flagImagePath}
                                title={`s/${space.handle}`}
                                fontSize={16}
                                style={{ marginRight: 10 }}
                            />
                            <CloseButton
                                size={17}
                                onClick={() => setSpaces(spaces.filter((s) => s.id !== space.id))}
                            />
                        </Row>
                    ))}
                    <Row centerY style={{ width: '100%', margin: '20px 0 10px 0' }}>
                        <UsersIcon
                            style={{ width: 25, height: 25, color: '#bbb', marginRight: 10 }}
                        />
                        <SearchSelector
                            type='user'
                            placeholder='User name or handle...'
                            onSearchQuery={(query) => findUsers(query)}
                            onOptionSelected={(user) => {
                                setUsers([...users, user])
                                setUserOptions([])
                            }}
                            onBlur={() => setTimeout(() => setUserOptions([]), 200)}
                            options={userOptions}
                            style={{ width: '100%' }}
                        />
                    </Row>
                    {users.map((user) => (
                        <Row centerY style={{ marginBottom: 10 }}>
                            <ImageTitle
                                type='space'
                                imagePath={user.flagImagePath}
                                title={`u/${user.handle}`}
                                fontSize={16}
                                style={{ marginRight: 10 }}
                            />
                            <CloseButton
                                size={17}
                                onClick={() => setUsers(users.filter((u) => u.id !== user.id))}
                            />
                        </Row>
                    ))}
                    <Button
                        text='Create stream'
                        color='blue'
                        disabled={createStreamDisabled()}
                        loading={false}
                        onClick={createStream}
                        style={{ marginTop: 30 }}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default CreateStreamModal
