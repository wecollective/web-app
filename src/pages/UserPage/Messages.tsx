import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import LoadingWheel from '@components/animations/LoadingWheel'
import TypingDots from '@components/animations/TypingDots'
import MessageCard from '@components/cards/Comments/MessageCard'
import AudioCard from '@components/cards/PostCard/AudioCard'
import CommentInput from '@components/draft-js/CommentInput'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import { baseUserData, getDraftPlainText, imageMBLimit, trimText } from '@src/Helpers'
import styles from '@styles/pages/UserPage/Messages.module.scss'
import { ImageIcon, PlusIcon, ReplyIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Messages(): JSX.Element {
    const { accountData, loggedIn, socket, setToyboxCollapsed } = useContext(AccountContext)
    const { userData, userNotFound } = useContext(UserContext)
    const [chats, setChats] = useState<any[]>([])
    const [chatsLoading, setChatsLoading] = useState(true)
    const [selectedChat, setSelectedChat] = useState<any>(null)
    const [scrollTopReached, setScrollTopReached] = useState(false)
    const [peopleInRoom, setPeopleInRoom] = useState<any[]>([])
    const [peopleTyping, setPeopleTyping] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [totalMessages, setTotalMessages] = useState(0)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [nextMessagesLoading, setNextMessagesLoading] = useState(false)
    const [replyParent, setReplyParent] = useState<any>(null)
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
        setScrollTopReached(topReached)
    }

    function getChats(offset) {
        // todo: set up pagination
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
                // console.log('messages res:', res.data.messages)
                setTotalMessages(res.data.total)
                setMessages(offset ? [...messages, ...res.data.messages] : res.data.messages)
                if (offset) setNextMessagesLoading(false)
                else setMessagesLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getMessage(messageId: number) {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/post-data?postId=${messageId}`, options)
            .then((res) => {
                setMessages((oldMessages) => [res.data, ...oldMessages])
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

    function addSocketSignals() {
        // clean up old connection if present
        socket.emit('exit-room', { roomId: `chat-${chatId}`, userId: accountData.id })
        const listeners = ['room-entered', 'user-entering', 'user-exiting']
        listeners.forEach((event) => socket.removeAllListeners(event))
        // enter room
        socket.emit('enter-room', { roomId: `chat-${chatId}`, user: baseUserData(accountData) })
        // listen for events
        socket.on('room-entered', (usersInRoom) => {
            console.log('room-entered', usersInRoom)
            setPeopleInRoom(usersInRoom)
        })
        socket.on('user-entering', (user) => {
            console.log('user-entering', user.id)
            setPeopleInRoom((people) => [user, ...people])
        })
        socket.on('user-exiting', (userId) => {
            console.log('user-exiting', userId)
            setPeopleInRoom((people) => people.filter((u) => u.id !== userId))
        })
        socket.on('user-started-typing', (user) => {
            console.log('user-started-typing', user)
            setPeopleTyping((people) => [user, ...people])
        })
        socket.on('user-stopped-typing', (user) => {
            console.log('user-stopped-typing', user)
            setPeopleTyping((people) => people.filter((u) => u.id !== user.id))
        })
        socket.on('new-message', (messageId) => {
            console.log('new-message', messageId)
            getMessage(messageId)
        })
    }

    function signalTyping(typing: boolean) {
        const user = { id: accountData.id, name: accountData.name }
        if (typing) socket.emit('user-started-typing', { roomId: `chat-${chatId}`, user })
        else socket.emit('user-stopped-typing', { roomId: `chat-${chatId}`, user })
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

    // add socket signals
    useEffect(() => {
        if (accountData.id && chatId && socket) addSocketSignals()
    }, [accountData.id, chatId, socket])

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
                    <Row spaceBetween className={styles.header}>
                        <Row centerY>
                            <img
                                src={
                                    selectedChat.flagImagePath ||
                                    selectedChat.otherUser.flagImagePath
                                }
                                alt=''
                            />
                            <h1>{selectedChat.name || selectedChat.otherUser.name}</h1>
                        </Row>
                        <FlagImageHighlights
                            type='user'
                            images={peopleInRoom.map((u) => u.flagImagePath)}
                        />
                    </Row>
                )}
                <Column id='scroll-wrapper' className={`${styles.scrollWrapper} hide-scrollbars`}>
                    {messages.map((message) => (
                        <MessageCard
                            key={message.id}
                            message={message}
                            removeMessage={() => null}
                            setReplyParent={(parent) => setReplyParent(parent)}
                        />
                    ))}
                </Column>
                <Column className={styles.input}>
                    {replyParent && (
                        <Column className={styles.replyParent}>
                            <Column centerY centerX className={styles.closeButton}>
                                <CloseButton size={16} onClick={() => setReplyParent(null)} />
                            </Column>
                            <Row centerY className={styles.replyParentHeader}>
                                <ReplyIcon />
                                <h1>{replyParent.Creator.name}</h1>
                            </Row>
                            {replyParent.text && (
                                <p>{trimText(getDraftPlainText(replyParent.text), 300)}</p>
                            )}
                            {replyParent.UrlBlocks.length > 0 && (
                                <Row className={styles.replyParentUrl}>
                                    <img
                                        src={replyParent.UrlBlocks[0].Post.MediaLink.Url.image}
                                        alt=''
                                    />
                                    <Column centerY>
                                        {replyParent.UrlBlocks[0].Post.MediaLink.Url.title && (
                                            <h1 className={styles.urlTitle}>
                                                {trimText(
                                                    replyParent.UrlBlocks[0].Post.MediaLink.Url
                                                        .title,
                                                    60
                                                )}
                                            </h1>
                                        )}
                                        {replyParent.UrlBlocks[0].Post.MediaLink.Url
                                            .description && (
                                            <p className={styles.description}>
                                                {trimText(
                                                    replyParent.UrlBlocks[0].Post.MediaLink.Url
                                                        .description,
                                                    60
                                                )}
                                            </p>
                                        )}
                                    </Column>
                                </Row>
                            )}
                            {replyParent.ImageBlocks.length > 0 && (
                                <Row className={styles.replyParentImages}>
                                    {replyParent.ImageBlocks.map((imageBlock) => (
                                        <img
                                            key={imageBlock.Post.id}
                                            src={imageBlock.Post.MediaLink.Image.url}
                                            alt=''
                                        />
                                    )).splice(0, 5)}
                                </Row>
                            )}
                            {replyParent.AudioBlocks.length > 0 && (
                                <AudioCard
                                    key={replyParent.id}
                                    url={replyParent.AudioBlocks[0].Post.MediaLink.Audio.url}
                                    location='reply-parent'
                                    staticBars={200}
                                    style={{
                                        height: 100,
                                        width: '100%',
                                        maxWidth: 600,
                                        margin: '5px 0',
                                    }}
                                />
                            )}
                        </Column>
                    )}
                    {!!peopleTyping.length && (
                        <Row className={styles.peopleTyping}>
                            <p>{peopleTyping.map((u) => u.name).join(', ')} typing</p>
                            <TypingDots style={{ marginBottom: 1 }} />
                        </Row>
                    )}
                    <CommentInput
                        type={replyParent ? 'chat-reply' : 'chat-message'}
                        placeholder={replyParent ? 'Reply...' : 'New message...'}
                        links={{
                            chatId: +chatId,
                            parent: replyParent
                                ? { id: replyParent.id, type: replyParent.type }
                                : null,
                        }}
                        onSave={() => setReplyParent(null)}
                        signalTyping={signalTyping}
                    />
                </Column>
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
