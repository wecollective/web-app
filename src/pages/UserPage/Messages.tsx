// import Button from '@components/Button'
import Column from '@components/Column'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
// import LoadingWheel from '@components/LoadingWheel'
import config from '@src/Config'
import styles from '@styles/pages/UserPage/Messages.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
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
    const history = useNavigate()
    const cookies = new Cookies()
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]

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
            <Column className={styles.sidebar}>side bar...</Column>
            <Column className={styles.messages}>messages go here...</Column>
        </Row>
    )
}

export default Messages
