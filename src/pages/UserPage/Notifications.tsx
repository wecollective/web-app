import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import NotificationCard from '@components/cards/NotificationCard'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import styles from '@styles/pages/UserPage/Notifications.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

// todo: add search and filters

function Notifications(): JSX.Element {
    const { accountData, pageBottomReached, setAccountData, loggedIn } = useContext(AccountContext)
    const { userData, userNotFound, isOwnAccount } = useContext(UserContext)
    const [notifications, setNotifications] = useState<any[]>([])
    const [itemsLoading, setItemsLoading] = useState(true)
    const [nextItemsLoading, setNextItemsLoading] = useState(false)
    const [moreItems, setMoreItems] = useState(false)
    const [itemOffset, setItemOffset] = useState(0)
    const history = useNavigate()
    const cookies = new Cookies()
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]
    const mobileView = document.documentElement.clientWidth < 900

    function getNotifications(offset: number) {
        if (offset) setNextItemsLoading(true)
        else setItemsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/account-notifications?offset=${offset}`, options)
            .then((res) => {
                setMoreItems(res.data.length === 10)
                setItemOffset(offset + res.data.length)
                setNotifications(offset ? [...notifications, ...res.data] : res.data)
                if (offset) setNextItemsLoading(false)
                else setItemsLoading(false)
                // mark notifications seen
                const ids = res.data.filter((n) => !n.seen).map((n) => n.id)
                const totalUnseen = accountData.unseenNotifications - ids.length
                setAccountData({ ...accountData, unseenNotifications: totalUnseen })
                axios.post(`${config.apiURL}/mark-notifications-seen`, ids, options)
            })
            .catch((error) => console.log(error))
    }

    function updateNotification(id, key, payload) {
        const newNotifications = [...notifications]
        const notification = newNotifications.find((n) => n.id === id)
        notification[key] = payload
        setNotifications(newNotifications)
    }

    useEffect(() => {
        if (userData.id) {
            if (userHandle === accountData.handle) getNotifications(0)
            else history(`/u/${userHandle}/posts`)
        }
    }, [userData.id, loggedIn])

    useEffect(() => {
        const loading = itemsLoading || nextItemsLoading || userData.handle !== userHandle
        if (pageBottomReached && moreItems && !loading) getNotifications(itemOffset)
    }, [pageBottomReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Column className={styles.wrapper}>
            {itemsLoading ? (
                <Row centerY centerX className={styles.placeholder}>
                    <p>Notifications loading...</p>
                    <LoadingWheel size={30} />
                </Row>
            ) : (
                <Column>
                    {notifications.map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            location='account'
                            updateNotification={updateNotification}
                        />
                    ))}
                    {nextItemsLoading && (
                        <Row centerX style={{ marginBottom: 100, marginTop: mobileView ? 15 : 0 }}>
                            <LoadingWheel />
                        </Row>
                    )}
                </Column>
            )}
        </Column>
    )
}

export default Notifications
