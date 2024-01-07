import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import Modal from '@components/modals/Modal'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import styles from '@styles/components/modals/CreateStreamModal.module.scss'
import { ImageIcon, SpacesIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useRef, useState } from 'react'
import Cookies from 'universal-cookie'

function CreateStreamModal(props: {
    editing: boolean
    currentData: any
    onSave: (newStream: any) => void
    close: () => void
}): JSX.Element {
    const { editing, currentData, onSave, close } = props
    const [imageFile, setImageFile] = useState<any>(null)
    const [imageURL, setImageURL] = useState<any>(editing ? currentData.stream.image : '')
    const [name, setName] = useState(editing ? currentData.stream.name : '')
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [spaces, setSpaces] = useState<any[]>(editing ? currentData.spaces : [])
    const [userOptions, setUserOptions] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>(editing ? currentData.users : [])
    const spaceSearch = useRef('')
    const userSearch = useRef('')
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()

    function addImage() {
        const input = document.getElementById('stream-image-file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            if (input.files[0].size > imageMBLimit * 1024 * 1024) {
                // todo: display error
                input.value = ''
            } else {
                setImageFile(input.files[0])
                setImageURL(URL.createObjectURL(input.files[0]))
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

    function saveStreamDisabled() {
        return loading || !name || (spaces.length === 0 && users.length === 0)
    }

    function saveStream() {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = {
            streamId: editing ? currentData.stream.id : null,
            spaceIds: spaces.map((s) => s.id),
            userIds: users.map((u) => u.id),
            name,
        }
        const formData = new FormData()
        if (imageFile) formData.append('image', imageFile)
        formData.append('post-data', JSON.stringify(data))
        axios
            .post(`${config.apiURL}/${editing ? 'edit' : 'create'}-stream`, formData, options)
            .then((res) => {
                onSave(res.data)
                close()
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal centerX close={close} className={styles.wrapper}>
            <Column centerX style={{ width: 350 }}>
                {editing ? <h1>Edit your stream</h1> : <h1>Create a new stream</h1>}
                <Column centerX centerY className={styles.image}>
                    {imageURL && <img src={imageURL} alt='' />}
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
                    onChange={(v) => setName(v)}
                    style={{ marginBottom: 30 }}
                />
                <p style={{ marginBottom: 20 }}>Add sources to your stream:</p>
                <Row centerY style={{ width: '100%', marginBottom: 10 }}>
                    <SpacesIcon style={{ width: 25, height: 25, color: '#bbb', marginRight: 10 }} />
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
                    <Row key={space.id} centerY style={{ marginBottom: 10 }}>
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
                    <UsersIcon style={{ width: 25, height: 25, color: '#bbb', marginRight: 10 }} />
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
                    <Row key={user.id} centerY style={{ marginBottom: 10 }}>
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
                    text={`${editing ? 'Save' : 'Create'} stream`}
                    color='blue'
                    disabled={saveStreamDisabled()}
                    loading={loading}
                    onClick={saveStream}
                    style={{ marginTop: 30 }}
                />
            </Column>
        </Modal>
    )
}

export default CreateStreamModal
