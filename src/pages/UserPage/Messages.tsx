/* eslint-disable prefer-destructuring */
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
import FlagImage from '@src/components/FlagImage'
import styles from '@styles/pages/UserPage/Messages.module.scss'
import {
    HereIcon,
    ImageIcon,
    ReplyIcon,
    SearchIcon,
    TextIcon,
    UserIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Messages(): JSX.Element {
    const { accountData, setAccountData, loggedIn, socket, setToyboxCollapsed } =
        useContext(AccountContext)
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
    const [newChatOpen, setNewChatOpen] = useState(false)
    const [newGroupModalOpen, setNewGroupModalOpen] = useState(false)
    const [createGroupLoading, setCreateGroupLoading] = useState(false)
    const [chatNotFoundError, setChatNotFoundError] = useState(false)
    const [userOptions, setUserOptions] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [imageFile, setImageFile] = useState<any>(null)
    const [imageURL, setImageURL] = useState<any>('')
    const [groupName, setGroupName] = useState('')
    const userSearch = useRef('')
    const history = useNavigate()
    const cookies = new Cookies()
    const location = useLocation()
    const [x, page, userHandle, subPage] = location.pathname.split('/')
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const { chatId } = urlParams
    const cleanup = useRef(() => {
        // cleanup ref function updated with latest chatId state in addSocketSignals function
    })
    const parentMemo = useMemo(() => {
        return replyParent ? { id: replyParent.id, type: replyParent.type } : null
    }, [replyParent?.id, replyParent?.type])

    function scrollHandler(e) {
        const { scrollHeight, scrollTop, clientHeight } = e.target
        const topReached = scrollHeight + scrollTop < clientHeight + 5
        setScrollTopReached(topReached)
    }

    function getMessages(offset: number, oldChats?: any[]) {
        if (offset) setNextMessagesLoading(true)
        else {
            setChatNotFoundError(false)
            setMessagesLoading(true)
        }
        const data = { chatId, offset }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/messages`, data, options)
            .then((res) => {
                // console.log('messages res:', res.data.messages)
                if (!offset) setSelectedChat(res.data.chat)
                // update unseen messages
                const limit = res.data.messages.length
                const newChats = oldChats ? [...oldChats] : [...chats]
                const chat = newChats.find((c) => c.id === +chatId)
                const decrementBy = chat.unseenMessages > limit ? limit : chat.unseenMessages
                setAccountData({
                    ...accountData,
                    unseenMessages: accountData.unseenMessages - decrementBy,
                })
                chat.unseenMessages -= decrementBy
                setChats(newChats)
                // update messages
                setTotalMessages(res.data.total)
                setMessages(offset ? [...messages, ...res.data.messages] : res.data.messages)
                if (offset) setNextMessagesLoading(false)
                else setMessagesLoading(false)
            })
            .catch((error) => {
                console.log(error)
                if (error.statusCode === 404) setChatNotFoundError(true)
            })
    }

    // todo: set up pagination with offset
    function getChats(offset) {
        setChatsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/chats`, options)
            .then((res) => {
                // console.log('chats res: ', res.data)
                setChats(res.data)
                setChatsLoading(false)
                if (chatId) getMessages(0, res.data)
                else history(`?chatId=${res.data[0].id}`)
            })
            .catch((error) => console.log(error))
    }

    function getMessage(messageId: number): any {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        return axios.get(`${config.apiURL}/post-data?postId=${messageId}`, options)
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

    function addGroupImage() {
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

    function createGroup() {
        setCreateGroupLoading(true)
        const data = { name: groupName, userIds: users.map((u) => u.id) }
        const formData = new FormData()
        if (imageFile) formData.append('image', imageFile)
        formData.append('post-data', JSON.stringify(data))
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/create-chat-group`, formData, options)
            .then((res) => {
                setChats([res.data, ...chats])
                history(`?chatId=${res.data.id}`)
                setCreateGroupLoading(false)
                setNewGroupModalOpen(false)
                // reset modal values
                setGroupName('')
                setImageFile(null)
                setImageURL('')
                setUsers([])
            })
            .catch((error) => console.log(error))
    }

    function findLastMessagePreview(message) {
        let text = message.text ? getDraftPlainText(message.text) : ''
        if (!text) {
            const mediaTypes = message.mediaTypes.split(',')
            const mediaType = mediaTypes[mediaTypes.length - 1]
            if (mediaType === 'image') text = '📷'
            else if (mediaType === 'audio') text = '🔊'
            else if (mediaType === 'event') text = '🗓️'
            else text = '...'
        } else if (text.length > 100) text = text.substring(0, 100).concat('...')
        return text
    }

    function bumpChat(bumpedChatId, newMessage, incrementUnseenMessages) {
        setChats((oldChats) => {
            const movedChat = oldChats.find((chat) => chat.id === bumpedChatId)
            movedChat.lastMessage = newMessage
            if (incrementUnseenMessages) movedChat.unseenMessages += 1
            const newChats = [movedChat, ...oldChats.filter((chat) => chat.id !== bumpedChatId)]
            return newChats
        })
    }

    function addSocketSignals() {
        // remove old listeners
        const listeners = [
            'room-entered',
            'user-entering',
            'user-exiting',
            'user-started-typing',
            'user-stopped-typing',
            'new-message',
        ]
        listeners.forEach((event) => socket.removeAllListeners(event))
        // enter room
        socket.emit('enter-room', {
            roomId: `chat-${chatId}`,
            user: { socketId: socket.id, ...baseUserData(accountData) },
        })
        // listen for events
        socket.on('room-entered', (usersInRoom) => setPeopleInRoom(usersInRoom))
        socket.on('user-entering', (user) => setPeopleInRoom((people) => [user, ...people]))
        socket.on('user-exiting', (socketId) =>
            setPeopleInRoom((people) => people.filter((u) => u.socketId !== socketId))
        )
        socket.on('user-started-typing', (user) => setPeopleTyping((people) => [user, ...people]))
        socket.on('user-stopped-typing', (user) =>
            setPeopleTyping((people) => people.filter((u) => u.id !== user.id))
        )
        socket.on('new-message', (messageId) => {
            getMessage(messageId)
                .then((res) => {
                    setMessages((oldMessages) => [res.data, ...oldMessages])
                    bumpChat(+chatId, res.data, false)
                })
                .catch((error) => console.log(error))
        })
        // add latest chatId state to cleanup
        cleanup.current = () => socket.emit('exit-room', `chat-${chatId}`)
    }

    function signalTyping(typing: boolean) {
        const user = { id: accountData.id, name: accountData.name }
        if (typing) socket.emit('user-started-typing', { roomId: `chat-${chatId}`, user })
        else socket.emit('user-stopped-typing', { roomId: `chat-${chatId}`, user })
    }

    function selectUser(user) {
        setUserOptions([])
        // check if user chat already exists or open new one (create on first message)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/create-chat`, { userId: user.id }, options)
            .then((res) => {
                if (res.data.existingChatId) history(`?chatId=${res.data.existingChatId}`)
                else {
                    setChats([{ ...res.data, otherUser: user }, ...chats])
                    history(`?chatId=${res.data.id}`)
                }
            })
            .catch((error) => console.log(error))
    }

    function serviceWorkerMessage(event) {
        const { type, data } = event.data
        if (type === 'message') {
            getMessage(data.messageId)
                .then((res) => bumpChat(data.chatId, res.data, true))
                .catch((error) => console.log(error))
        }
        if (type === 'chat-invite') setChats((oldChats) => [data.chat, ...oldChats])
    }

    // add scroll and message listener
    useEffect(() => {
        const scrollWrapper = document.getElementById('scroll-wrapper')
        scrollWrapper?.addEventListener('scroll', scrollHandler)
        navigator.serviceWorker.addEventListener('message', serviceWorkerMessage)
        return () => {
            scrollWrapper?.removeEventListener('scroll', scrollHandler)
            navigator.serviceWorker.removeEventListener('message', serviceWorkerMessage)
            cleanup.current()
        }
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

    // if chatId included in url params get messages
    useEffect(() => {
        setReplyParent(null)
        if (chatId && !chatsLoading) getMessages(0)
        // disconnect from previous chat if present
        if (selectedChat) socket.emit('exit-room', `chat-${selectedChat.id}`)
    }, [chatId])

    // add socket signals
    useEffect(() => {
        if (accountData.id && chatId && socket) addSocketSignals()
    }, [accountData.id, chatId, socket])

    // get next messages when scroll top reached
    useEffect(() => {
        if (scrollTopReached && !nextMessagesLoading && totalMessages > messages.length)
            getMessages(messages.length)
    }, [scrollTopReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Row className={styles.wrapper}>
            <Column className={styles.sidebar}>
                {chatsLoading ? (
                    <LoadingWheel size={30} />
                ) : (
                    <Row>
                        <Button
                            text='New Chat'
                            icon={<UserIcon />}
                            color='blue'
                            onClick={() => setNewChatOpen(!newChatOpen)}
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            text='New Group'
                            icon={<UsersIcon />}
                            color='aqua'
                            onClick={() => {
                                setNewChatOpen(false)
                                setNewGroupModalOpen(true)
                            }}
                        />
                    </Row>
                )}
                {newChatOpen && (
                    <Row centerY style={{ marginTop: 10 }}>
                        <SearchIcon className={styles.icon} />
                        <SearchSelector
                            type='user'
                            placeholder='People...'
                            onSearchQuery={(query) => findUsers(query)}
                            onOptionSelected={selectUser}
                            onBlur={() => setTimeout(() => setUserOptions([]), 200)}
                            options={userOptions}
                            style={{ width: '100%' }}
                        />
                    </Row>
                )}
                {chats.map((chat) => (
                    <Link
                        to={`?chatId=${chat.id}`}
                        key={chat.id}
                        className={`${styles.chat} ${+chatId === chat.id && styles.selected}`}
                    >
                        <Row centerY>
                            <FlagImage
                                type='space'
                                imagePath={
                                    chat.name ? chat.flagImagePath : chat.otherUser.flagImagePath
                                }
                                size={40}
                            />
                            <Column style={{ marginLeft: 10 }}>
                                <h1>{chat.otherUser ? chat.otherUser.name : chat.name}</h1>
                                {chat.lastMessage && (
                                    <Row>
                                        <p>
                                            <b>
                                                {chat.lastMessage.Creator.id === accountData.id
                                                    ? 'You'
                                                    : chat.lastMessage.Creator.name}
                                                :
                                            </b>{' '}
                                            {findLastMessagePreview(chat.lastMessage)}
                                        </p>
                                    </Row>
                                )}
                            </Column>
                        </Row>
                        {!!chat.unseenMessages && (
                            <Column centerX centerY className={styles.unseenMessages}>
                                {chat.unseenMessages}
                            </Column>
                        )}
                    </Link>
                ))}
            </Column>
            <Column className={`${styles.messages} hide-scrollbars`}>
                {selectedChat && (
                    <Row spaceBetween className={styles.header}>
                        <Row centerY>
                            <FlagImage
                                type='space'
                                imagePath={
                                    selectedChat.name
                                        ? selectedChat.flagImagePath
                                        : selectedChat.otherUser.flagImagePath
                                }
                                size={40}
                                style={{ border: '1px solid #eee', marginRight: 5 }}
                            />
                            <h1 style={{ marginRight: 30 }}>
                                {selectedChat.name || selectedChat.otherUser.name}
                            </h1>
                        </Row>
                        <Row centerY>
                            {selectedChat.name && (
                                <Row centerY>
                                    <UsersIcon className={styles.icon} />
                                    <FlagImageHighlights
                                        type='user'
                                        images={selectedChat.Members.map((u) => u.flagImagePath)}
                                        style={{ marginRight: 20 }}
                                    />
                                </Row>
                            )}
                            <HereIcon className={styles.icon} />
                            <FlagImageHighlights
                                type='user'
                                images={peopleInRoom.map((u) => u.flagImagePath)}
                            />
                        </Row>
                    </Row>
                )}
                <Column id='scroll-wrapper' className={`${styles.scrollWrapper} hide-scrollbars`}>
                    {messages.map((message) => (
                        <MessageCard
                            key={message.id}
                            message={message}
                            removeMessage={() => null}
                            setReplyParent={() => setReplyParent(message)}
                            emit={() => console.log('TODO')}
                        />
                    ))}
                    {nextMessagesLoading && (
                        <Row centerX centerY style={{ height: 50, flexShrink: 0 }}>
                            <LoadingWheel size={30} />
                        </Row>
                    )}
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
                            chatName: selectedChat?.name,
                            parent: parentMemo,
                            membersNotInRoom:
                                selectedChat?.Members.filter(
                                    (u) => !peopleInRoom.find((p) => p.id === u.id)
                                ).map((u) => u.id) || [],
                        }}
                        onSave={() => setReplyParent(null)}
                        signalTyping={signalTyping}
                    />
                </Column>
            </Column>
            {newGroupModalOpen && (
                <Modal
                    centerX
                    close={() => setNewGroupModalOpen(false)}
                    style={{ overflow: 'visible' }}
                >
                    <h1>New group</h1>
                    <Column centerX centerY className={styles.image}>
                        {imageURL && <img src={imageURL} alt='' />}
                        <ImageIcon />
                        <label htmlFor='stream-image-file-input'>
                            <input
                                type='file'
                                id='stream-image-file-input'
                                accept='.png, .jpg, .jpeg, .gif'
                                onChange={addGroupImage}
                                hidden
                            />
                        </label>
                    </Column>
                    <Row centerY style={{ marginBottom: 20 }}>
                        <TextIcon className={styles.icon} />
                        <Input
                            type='text'
                            placeholder='Name... (required)'
                            value={groupName}
                            maxLength={30}
                            onChange={(v) => setGroupName(v)}
                        />
                    </Row>
                    <Row centerY style={{ marginBottom: 10 }}>
                        <UsersIcon className={styles.icon} />
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
                    <Column style={{ width: '100%' }}>
                        {users.map((user) => (
                            <Row key={user.id} centerY style={{ marginBottom: 10 }}>
                                <ImageTitle
                                    type='space'
                                    imagePath={user.flagImagePath}
                                    imageSize={36}
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
                    </Column>
                    <Button
                        text='Create group'
                        color='blue'
                        disabled={createGroupLoading || !groupName || !users.length}
                        loading={createGroupLoading}
                        onClick={createGroup}
                        style={{ marginTop: 30 }}
                    />
                </Modal>
            )}
        </Row>
    )
}

export default Messages
