import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import LoadingWheel from '@components/animations/LoadingWheel'
import MessageCard from '@components/cards/Comments/MessageCard'
import CommentInput from '@components/draft-js/CommentInput'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import styles from '@styles/pages/UserPage/Messages.module.scss'
import { ImageIcon, PlusIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Messages(): JSX.Element {
    const { accountData, loggedIn, setToyboxCollapsed } = useContext(AccountContext)
    const { userData, userNotFound } = useContext(UserContext)
    const [chats, setChats] = useState<any[]>([])
    const [selectedChat, setSelectedChat] = useState<any>(null)
    const [chatsLoading, setChatsLoading] = useState(true)
    const [scrollTopReached, setScrollTopReached] = useState(false)
    const [messages, setMessages] = useState<any[]>([])
    const [totalMessages, setTotalMessages] = useState(0)
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
    const [x, page, userHandle, subPage] = location.pathname.split('/')
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const { chatId } = urlParams

    // todo:
    // + add unseenMessages column on Users table
    // + need to keep track of unseen messages per chat and user (add to SpaceUserStat table?)

    function scrollHandler(e) {
        const { scrollHeight, scrollTop, clientHeight } = e.target
        const topReached = scrollHeight + scrollTop < clientHeight + 5
        if (topReached) console.log('topReached')
        setScrollTopReached(topReached)
    }

    function getChats(offset) {
        setChatsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/chats`, options)
            .then((res) => {
                console.log('chats res: ', res.data)
                setChats(res.data)
                setChatsLoading(false)
                if (chatId) {
                    history(`?chatId=${chatId}`)
                    setSelectedChat(res.data.find((chat) => chat.id === +chatId))
                } else {
                    history(`?chatId=${res.data[0].id}`)
                    setSelectedChat(res.data.find((chat) => chat.id === res.data[0].id))
                }
            })
            .catch((error) => console.log(error))
    }

    function getMessages(offset: number) {
        if (offset) setNextMessagesLoading(true)
        else setMessagesLoading(true)
        const data = { chatId, offset }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/messages`, data, options)
            .then((res) => {
                setTotalMessages(res.data.total)
                setMessages(offset ? [...messages, ...res.data.messages] : res.data.messages)
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
        const data = { name, userIds: users.map((u) => u.id) }
        const formData = new FormData()
        if (imageFile) formData.append('image', imageFile)
        formData.append('post-data', JSON.stringify(data))
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/create-chat`, formData, options)
            .then((res) => {
                setChats([...chats, res.data])
                setCreateChatLoading(false)
                setNewChatModalOpen(false)
                // reset values
                setName('')
                setImageFile(null)
                setImageURL('')
            })
            .catch((error) => console.log(error))
    }

    // add scroll handler
    useEffect(() => {
        const scrollWrapper = document.getElementById('scroll-wrapper')
        scrollWrapper?.addEventListener('scroll', scrollHandler)
        return () => scrollWrapper?.removeEventListener('scroll', scrollHandler)
    }, [])

    // if logged in and is own account get chats, otherwise redirect to posts page
    useEffect(() => {
        if (userData.id) {
            if (userHandle !== accountData.handle) history(`/u/${userHandle}/posts`)
            else {
                window.scrollTo({ top: 320, behavior: 'smooth' })
                setToyboxCollapsed(true)
                getChats(0)
            }
        }
    }, [userData.id, loggedIn])

    // if chatId included in url params, get messages and set selected chat
    useEffect(() => {
        if (chatId) {
            getMessages(0)
            if (selectedChat) setSelectedChat(chats.find((chat) => chat.id === +chatId))
        }
    }, [chatId])

    // get next messages when scroll top reached
    useEffect(() => {
        if (scrollTopReached && totalMessages > messages.length) getMessages(messages.length)
    }, [scrollTopReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Row className={styles.wrapper}>
            <Column className={styles.sidebar}>
                <Row spaceBetween>
                    <Button
                        text='New Chat'
                        icon={<PlusIcon />}
                        color='blue'
                        onClick={() => setNewChatModalOpen(true)}
                        style={{ width: 120 }}
                    />
                    {chatsLoading && <LoadingWheel size={30} />}
                </Row>
                {chats.map((chat) => (
                    <Link
                        to={`?chatId=${chat.id}`}
                        key={chat.id}
                        className={`${styles.chat} ${+chatId === chat.id && styles.selected}`}
                    >
                        <img src={chat.flagImagePath || chat.otherUser.flagImagePath} alt='' />
                        <Column>
                            <h1>{chat.name || chat.otherUser.name}</h1>
                        </Column>
                    </Link>
                ))}
            </Column>
            <Column className={`${styles.messages} hide-scrollbars`}>
                {selectedChat && (
                    <Row centerY className={styles.header}>
                        <img
                            src={selectedChat.flagImagePath || selectedChat.otherUser.flagImagePath}
                            alt=''
                        />
                        <h1>{selectedChat.name || selectedChat.otherUser.name}</h1>
                    </Row>
                )}
                <Column id='scroll-wrapper' className={`${styles.scrollWrapper} hide-scrollbars`}>
                    {messages.map((message) => (
                        <MessageCard
                            key={message.id}
                            message={message}
                            removeMessage={() => null}
                        />
                    ))}
                </Column>
                <Row className={styles.input}>
                    <CommentInput
                        type='chat-message'
                        placeholder='New message...'
                        parent={{ type: 'space', id: +chatId }}
                        onSave={(data) => setMessages([data, ...messages])}
                    />
                </Row>
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
                        placeholder='Name... (optional)'
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
                        disabled={createChatLoading || !users.length}
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
