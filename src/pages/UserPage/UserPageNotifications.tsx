/* eslint-disable no-nested-ternary */
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'universal-cookie'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/UserPageNotifications.module.scss'
import NotificationCard from '@components/cards/NotificationCard'
import Column from '@components/Column'
import config from '@src/Config'

const UserPageNotifications = (): JSX.Element => {
    const { accountData, accountDataLoading, setAccountData } = useContext(AccountContext)
    const { userData, getUserData, setSelectedUserSubPage, isOwnAccount } = useContext(UserContext)
    const cookies = new Cookies()
    const history = useHistory()
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]

    const [notifications, setNotifications] = useState<any[]>([])
    const [notificationsLoading, setNotificationsLoading] = useState(true)

    // todo: add pagination, search, filters, loading state etc

    function getNotifications() {
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        if (!accessToken) setNotificationsLoading(false)
        else {
            axios
                .get(`${config.apiURL}/account-notifications`, authHeader)
                .then((res) => {
                    setNotifications(res.data)
                    setNotificationsLoading(false)
                    // mark notifications as seen
                    setAccountData({ ...accountData, unseenNotifications: 0 })
                    const ids = res.data.map((notification) => notification.id)
                    axios.post(`${config.apiURL}/mark-notifications-seen`, ids, authHeader)
                })
                .catch((error) => console.log('GET account-notifications error: ', error))
        }
    }

    function updateNotification(id, key, payload) {
        const newNotifications = [...notifications]
        const notification = newNotifications.find((n) => n.id === id)
        notification[key] = payload
        setNotifications(newNotifications)
    }

    function getFirstNotifications(res) {
        if (res.handle === accountData.handle) getNotifications()
        else history.push(`/u/${res.handle}/about`)
    }

    useEffect(() => {
        if (!accountDataLoading) {
            if (userHandle !== userData.handle) {
                getUserData(userHandle, getFirstNotifications)
            } else getFirstNotifications({ handle: userHandle })
        }
    }, [accountDataLoading, location])

    useEffect(() => setSelectedUserSubPage('notifications'), [])

    return (
        <Column className={styles.wrapper}>
            {isOwnAccount && (
                <Column centerX className={styles.notifications}>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                location='account'
                                updateNotification={updateNotification}
                            />
                        ))
                    ) : notificationsLoading ? (
                        <p>Notifications loading...</p>
                    ) : (
                        <p>No notifications yet</p>
                    )}
                </Column>
            )}
        </Column>
    )
}

export default UserPageNotifications
