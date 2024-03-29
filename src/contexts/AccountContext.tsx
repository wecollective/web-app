import { CreatePostModalSettings } from '@components/modals/CreatePostModal'
import config from '@src/Config'
import { baseUserData, getDraftPlainText } from '@src/Helpers'
import { IAccountContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import Cookies from 'universal-cookie'

export const AccountContext = createContext<IAccountContext>({} as IAccountContext)

const defaults = {
    accountData: {
        id: null,
        handle: null,
        name: null,
        bio: null,
        flagImagePath: null,
        unseenNotifications: 0,
        unseenMessages: 0,
        FollowedSpaces: [],
        ModeratedSpaces: [],
    },
}

function AccountContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [accountData, setAccountData] = useState(defaults.accountData)
    const [accountDataLoading, setAccountDataLoading] = useState(true)
    const [socket, setSocket] = useState<any>(null)
    const [loggedIn, setLoggedIn] = useState(false)
    const [pageBottomReached, setPageBottomReached] = useState(false)
    const [toyboxCollapsed, setToyboxCollapsed] = useState(false)
    const [toyBoxRow, setToyBoxRow] = useState({ id: null, index: 0, name: '', image: '' })
    const toyBoxRowRef = useRef({ id: null, index: 0, name: '', image: '' })
    const [toyBoxItems, setToyBoxItems] = useState<any[]>([])
    const toyBoxItemsRef = useRef<any[]>([])
    const [dragItem, setDragItem] = useState({ type: '', data: null })
    const dragItemRef = useRef<any>(null)
    // modals
    const [alertMessage, setAlertMessage] = useState<string>()
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [logInModalOpen, setLogInModalOpen] = useState(false)
    const [registerModalOpen, setRegisterModalOpen] = useState(false)
    const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
    const [createPostModalSettings, setCreatePostModalSettings] =
        useState<CreatePostModalSettings>()
    const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
    const [createCommentModalOpen, setCreateCommentModalOpen] = useState(false)
    const [settingModalOpen, setSettingModalOpen] = useState(false)
    const [settingModalType, setSettingModalType] = useState('')
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)
    const [imageUploadType, setImageUploadType] = useState('')
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
    const [resetPasswordToken, setResetPasswordToken] = useState<string | null>('')
    const [donateModalOpen, setDonateModalOpen] = useState(false)
    const [claimAccountModalOpen, setClaimAccountModalOpen] = useState(false)
    const [dropModalOpen, setDropModalOpen] = useState(false)
    const [dropLocation, setDropLocation] = useState<any>({ type: '', data: null })

    const cookies = new Cookies()

    async function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) registration.update()
            else navigator.serviceWorker.register('/service-worker.js')
        } else {
            console.log(' no service worker', navigator)
        }
    }

    async function subscribePushNotifications() {
        // check if service worker registered & subscribed to push notifications
        const registration = await navigator.serviceWorker.getRegistration()
        const subscription = await registration?.pushManager.getSubscription()
        if (registration && !subscription) {
            // register new subscription
            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: config.vapidPublicKey,
            })
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/store-push-subscription`, newSubscription, options)
                .then((res) => {
                    console.log('subscribe-to-push-notifications res: ', res.data)
                })
                .catch((error) => console.log(error))
        }
    }

    async function unsubscribePushNotifications() {
        const registration = await navigator.serviceWorker.getRegistration()
        const subscription = await registration?.pushManager.getSubscription()
        if (registration && subscription) {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/remove-push-subscription`, subscription, options)
                .then(() => {
                    subscription.unsubscribe()
                    cookies.remove('accessToken', { path: '/' })
                })
                .catch((error) => console.log(error))
        } else cookies.remove('accessToken', { path: '/' })
    }

    function addGreenCheckScript(data) {
        const { id, handle, name, bio, flagImagePath } = data
        const script = document.getElementById('greencheck')
        script!.innerHTML = JSON.stringify({
            id,
            username: handle,
            fullname: name,
            description: bio ? getDraftPlainText(bio) : '',
            image: flagImagePath,
        })
    }

    function getAccountData() {
        // register service worker and initialise socket
        registerServiceWorker()
        if (!socket) setSocket(io(config.apiWebSocketURL || ''))
        // if no access cookie end process
        const accessToken = cookies.get('accessToken')
        if (!accessToken) setAccountDataLoading(false)
        else {
            // fetch account data
            setAccountDataLoading(true)
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .get(`${config.apiURL}/account-data`, options)
                .then((res) => {
                    // console.log('account-data: ', res.data)
                    setAccountData(res.data)
                    addGreenCheckScript(res.data)
                    setLoggedIn(true)
                    setAccountDataLoading(false)
                    subscribePushNotifications()
                })
                .catch((error) => {
                    setAccountDataLoading(false)
                    // todo: handle errors
                    console.log(error)
                })
        }
    }

    function updateAccountData(key, payload) {
        setAccountData({ ...accountData, [key]: payload })
    }

    function logOut() {
        console.log('AccountContext: logOut')
        unsubscribePushNotifications()
        socket.emit('log-out')
        const script = document.getElementById('greencheck')
        script!.innerHTML = ''
        setAccountData(defaults.accountData)
        setLoggedIn(false)
    }

    function updateDragItem(data) {
        dragItemRef.current = data
        setDragItem(data)
    }

    function serviceWorkerMessage(event) {
        // console.log('serviceWorkerMessage: ', event)
        const { type } = event.data
        if (type === 'notification') {
            // todo: store unseenNotification seperately...
            setAccountData((oldData) => {
                return {
                    ...oldData,
                    unseenNotifications: oldData.unseenNotifications + 1,
                }
            })
        }
        if (type === 'message') {
            // todo: store unseenMessages seperately...
            setAccountData((oldData) => {
                return {
                    ...oldData,
                    unseenMessages: oldData.unseenMessages + 1,
                }
            })
        }
    }

    useEffect(() => getAccountData(), [])

    useEffect(() => {
        if (accountData.id) {
            // listen for notifications from the service worker
            navigator.serviceWorker?.addEventListener('message', serviceWorkerMessage)
            // add user data to socket
            socket.emit('log-in', { socketId: socket.id, ...baseUserData(accountData) })
        }
        return () => navigator.serviceWorker?.removeEventListener('message', serviceWorkerMessage)
    }, [accountData.id])

    return (
        <AccountContext.Provider
            value={{
                accountData,
                setAccountData,
                accountDataLoading,
                setAccountDataLoading,
                socket,
                loggedIn,
                toyboxCollapsed,
                setToyboxCollapsed,
                toyBoxRow,
                setToyBoxRow,
                toyBoxRowRef,
                toyBoxItems,
                setToyBoxItems,
                toyBoxItemsRef,
                dragItem,
                dragItemRef,
                updateDragItem,
                alertMessage,
                alert: setAlertMessage,
                closeAlertModal: () => setAlertMessage(undefined),
                authModalOpen,
                setAuthModalOpen,
                logInModalOpen,
                setLogInModalOpen,
                registerModalOpen,
                setRegisterModalOpen,
                forgotPasswordModalOpen,
                setForgotPasswordModalOpen,
                createPostModalSettings,
                setCreatePostModalSettings,
                createSpaceModalOpen,
                setCreateSpaceModalOpen,
                createCommentModalOpen,
                setCreateCommentModalOpen,
                settingModalOpen,
                setSettingModalOpen,
                settingModalType,
                setSettingModalType,
                imageUploadModalOpen,
                setImageUploadModalOpen,
                imageUploadType,
                setImageUploadType,
                resetPasswordModalOpen,
                setResetPasswordModalOpen,
                resetPasswordToken,
                setResetPasswordToken,
                donateModalOpen,
                setDonateModalOpen,
                pageBottomReached,
                setPageBottomReached,
                claimAccountModalOpen,
                setClaimAccountModalOpen,
                dropModalOpen,
                setDropModalOpen,
                dropLocation,
                setDropLocation,
                // functions
                getAccountData,
                updateAccountData,
                logOut,
            }}
        >
            {children}
        </AccountContext.Provider>
    )
}

export default AccountContextProvider
