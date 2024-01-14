import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
// import LoadingWheel from '@components/LoadingWheel'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import SearchSelector from '@components/SearchSelector'
import CommentInput from '@components/draft-js/CommentInput'
import Modal from '@components/modals/Modal'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import styles from '@styles/pages/UserPage/Messages.module.scss'
import { ImageIcon, PlusIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Messages(): JSX.Element {
    const { accountData, loggedIn } = useContext(AccountContext)
    const { userData, userNotFound } = useContext(UserContext)
    const [chats, setChats] = useState<any[]>([])
    const [chatsLoading, setChatsLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [nextMessagesLoading, setNextMessagesLoading] = useState(false)
    const [newChatModalOpen, setNewChatModalOpen] = useState(false)
    const [createChatLoading, setCreateChatLoading] = useState(false)
    const [userOptions, setUserOptions] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [imageFile, setImageFile] = useState<any>(null)
    const [imageURL, setImageURL] = useState<any>('')
    const [name, setName] = useState('')
    const userSearch = useRef('')
    const history = useNavigate()
    const cookies = new Cookies()
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]

    // creating a new chat:
    // create private space (no parent) (type: chat)
    // create SpaceUser entires: access, moderator, follower
    // for other users mark access: pending (until they have accepted it)

    // getting chats:
    // find all spaces of type 'chat' that user has access to (exclude children as retrieved & displayed within root)

    // getting posts:
    // find all posts within space (include comments)

    // todo:
    // + add space type field: 'default' or 'chat'
    // + add unseenMessages column on Users table
    // + need to keep track of unseen messages per chat and user (add to SpaceUserStat table?)
    // + need to tag all comments with root posts spaces (to make vivisible in chats and enable visibility/search in normal spaces)

    function getChats() {
        setChatsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/chats`, options)
            .then((res) => {
                console.log('chats res: ', res.data)
                setChats(res.data)
                setChatsLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getMessages(chatId: number, offset: number) {
        if (offset) setNextMessagesLoading(true)
        else setMessagesLoading(true)
        const data = { chatId, offset }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/messages`, data, options)
            .then((res) => {
                console.log('messages res: ', res.data)
                setMessages(offset ? [...messages, ...res.data] : res.data)
                if (offset) setNextMessagesLoading(false)
                else setMessagesLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function findUsers(query) {
        userSearch.current = query
        if (query.length < 1) setUserOptions([])
        else {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const data = { query, blacklist: [accountData.id] }
            axios
                .post(`${config.apiURL}/find-people`, data, options)
                .then((res) => {
                    if (userSearch.current === query) setUserOptions(res.data)
                })
                .catch((error) => console.log(error))
        }
    }

    function addChatImage() {
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

    function createChat() {
        setCreateChatLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/create-chat`, options)
            .then((res) => {
                console.log('chats res: ', res.data)
                setCreateChatLoading(false)
            })
            .catch((error) => console.log(error))
    }

    // if logged in and is own account get chats, otherwise redirect to posts page
    useEffect(() => {
        if (userData.id) {
            if (userHandle === accountData.handle) {
                window.scrollTo({ top: 320, behavior: 'smooth' })
                getChats()
            } else {
                history(`/u/${userHandle}/posts`)
            }
        }
    }, [userData.id, loggedIn])

    // when chats loaded, get chat messages
    useEffect(() => {
        if (!chatsLoading) getMessages(chats[0].id, 0)
    }, [chatsLoading])

    if (userNotFound) return <UserNotFound />
    return (
        <Row className={styles.wrapper}>
            <Column className={styles.sidebar}>
                <Button
                    text='New Chat'
                    icon={<PlusIcon />}
                    color='blue'
                    onClick={() => setNewChatModalOpen(true)}
                    style={{ width: 120 }}
                />
                chats list...
            </Column>
            <Column className={styles.chat}>
                <p>Chat info...</p>
                <Column className={styles.messages}>messages go here...</Column>
                <CommentInput
                    type='poll-answer'
                    placeholder='New answer...'
                    parent={{ type: 'space', id: 0 }}
                    onSave={(data) => console.log('new comment: ', data)}
                    style={{ marginTop: 10 }}
                />
            </Column>
            {newChatModalOpen && (
                <Modal
                    centerX
                    close={() => setNewChatModalOpen(false)}
                    style={{ overflow: 'visible' }}
                >
                    <h1>Create a new chat</h1>
                    <Column centerX centerY className={styles.image}>
                        {imageURL && <img src={imageURL} alt='' />}
                        <ImageIcon />
                        <label htmlFor='stream-image-file-input'>
                            <input
                                type='file'
                                id='stream-image-file-input'
                                accept='.png, .jpg, .jpeg, .gif'
                                onChange={addChatImage}
                                hidden
                            />
                        </label>
                    </Column>
                    <Input
                        type='text'
                        placeholder='Name...'
                        value={name}
                        maxLength={30}
                        onChange={(v) => setName(v)}
                        style={{ marginBottom: 30 }}
                    />
                    <p style={{ marginBottom: 10 }}>Add people to the chat:</p>
                    <Row centerY style={{ marginBottom: 10 }}>
                        <UsersIcon
                            style={{ width: 25, height: 25, color: '#bbb', marginRight: 10 }}
                        />
                        <SearchSelector
                            type='user'
                            placeholder='People...'
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
                        text='Create chat'
                        color='blue'
                        disabled={createChatLoading}
                        loading={createChatLoading}
                        onClick={createChat}
                        style={{ marginTop: 30 }}
                    />
                </Modal>
            )}
        </Row>
    )
}

export default Messages
