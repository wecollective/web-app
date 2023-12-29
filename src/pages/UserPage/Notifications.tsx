import Column from '@components/Column'
import Row from '@components/Row'
import Toggle from '@components/Toggle'
import LoadingWheel from '@components/animations/LoadingWheel'
import NotificationCard from '@components/cards/NotificationCard'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import Button from '@src/components/Button'
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
    const [showSeenItems, setShowSeenItems] = useState(true)
    const [markAllSeenLoading, setMarkAllSeenLoading] = useState(false)
    const history = useNavigate()
    const cookies = new Cookies()
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]
    const mobileView = document.documentElement.clientWidth < 900

    function getNotifications(offset: number, includeSeen: boolean) {
        if (offset) setNextItemsLoading(true)
        else setItemsLoading(true)
        const data = { offset, includeSeen, mutedUsers: accountData.mutedUsers }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/account-notifications`, data, options)
            .then((res) => {
                console.log('account-notifications: ', res.data)
                setMoreItems(res.data.length === 10)
                setItemOffset(offset + res.data.length)
                setNotifications(offset ? [...notifications, ...res.data] : res.data)
                if (offset) setNextItemsLoading(false)
                else setItemsLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function updateNotification(id, key, payload) {
        const newNotifications = [...notifications]
        const notification = newNotifications.find((n) => n.id === id)
        notification[key] = payload
        setNotifications(newNotifications)
    }

    function markAllSeen() {
        setMarkAllSeenLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/mark-all-notifications-seen`, null, options)
            .then(() => {
                setAccountData({ ...accountData, unseenNotifications: 0 })
                setNotifications(
                    notifications.map((n) => {
                        return { ...n, seen: true }
                    })
                )
                setMarkAllSeenLoading(false)
            })
            .catch((error) => console.log(error))
    }

    // get first notifications
    useEffect(() => {
        if (userData.id) {
            if (userHandle === accountData.handle) {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                getNotifications(0, showSeenItems)
            } else history(`/u/${userHandle}/posts`)
        }
    }, [userData.id, loggedIn])

    // get next notifications
    useEffect(() => {
        const loading = itemsLoading || nextItemsLoading || userData.handle !== userHandle
        if (pageBottomReached && moreItems && !loading) getNotifications(itemOffset, showSeenItems)
    }, [pageBottomReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <Row centerY style={{ marginBottom: 10 }}>
                <Toggle
                    leftText='Show seen notifications'
                    positionLeft={!showSeenItems}
                    rightColor='blue'
                    onClick={() => {
                        setShowSeenItems(!showSeenItems)
                        getNotifications(0, !showSeenItems)
                    }}
                    onOffText
                />
                {accountData.unseenNotifications > 0 && (
                    <Button
                        text='Mark all seen'
                        color='aqua'
                        size='medium'
                        onClick={markAllSeen}
                        loading={markAllSeenLoading}
                        disabled={markAllSeenLoading}
                        style={{ marginLeft: 20 }}
                    />
                )}
            </Row>
            {itemsLoading ? (
                <Row centerY centerX className={styles.placeholder}>
                    <p>Notifications loading...</p>
                    <LoadingWheel size={30} />
                </Row>
            ) : (
                <Column style={{ width: '100%' }}>
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
