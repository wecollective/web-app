import config from '@src/Config'
import { getDraftPlainText } from '@src/Helpers'
import { IAccountContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useEffect, useRef, useState } from 'react'
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
        FollowedSpaces: [],
        ModeratedSpaces: [],
    },
}

function AccountContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [loggedIn, setLoggedIn] = useState(false)
    const [accountData, setAccountData] = useState(defaults.accountData)
    const [accountDataLoading, setAccountDataLoading] = useState(true)
    const [pageBottomReached, setPageBottomReached] = useState(false)
    const [toyBoxRow, setToyBoxRow] = useState({ id: null, index: 0, name: '', image: '' })
    const toyBoxRowRef = useRef({ id: null, index: 0, name: '', image: '' })
    const [toyBoxItems, setToyBoxItems] = useState<any[]>([])
    const toyBoxItemsRef = useRef<any[]>([])
    const [dragItem, setDragItem] = useState({ type: '', data: null })
    const dragItemRef = useRef<any>(null)
    // modals
    const [alertModalOpen, setAlertModalOpen] = useState(false)
    const [alertMessage, setAlertMessage] = useState('')
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [logInModalOpen, setLogInModalOpen] = useState(false)
    const [registerModalOpen, setRegisterModalOpen] = useState(false)
    const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
    const [createPostModalSettings, setCreatePostModalSettings] = useState<any>(null)
    const [createPostModalOpen, setCreatePostModalOpen] = useState(false)
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

    const cookies = new Cookies()

    function getAccountData() {
        console.log('AccountContext: getAccountData')
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        if (!accessToken) setAccountDataLoading(false)
        else {
            setAccountDataLoading(true)
            axios
                .get(`${config.apiURL}/account-data`, options)
                .then((res) => {
                    const { id, handle, name, bio, flagImagePath } = res.data
                    const script = document.getElementById('greencheck')
                    script!.innerHTML = JSON.stringify({
                        id,
                        username: handle,
                        fullname: name,
                        description: bio ? getDraftPlainText(bio) : '',
                        image: flagImagePath,
                    })
                    setAccountData(res.data)
                    setLoggedIn(true)
                    setAccountDataLoading(false)
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
        cookies.remove('accessToken', { path: '/' })
        const script = document.getElementById('greencheck')
        script!.innerHTML = ''
        setAccountData(defaults.accountData)
        setLoggedIn(false)
    }

    function updateDragItem(data) {
        dragItemRef.current = data
        setDragItem(data)
    }

    useEffect(() => getAccountData(), [])

    return (
        <AccountContext.Provider
            value={{
                loggedIn,
                accountData,
                setAccountData,
                accountDataLoading,
                setAccountDataLoading,
                toyBoxRow,
                setToyBoxRow,
                toyBoxRowRef,
                toyBoxItems,
                setToyBoxItems,
                toyBoxItemsRef,
                dragItem,
                dragItemRef,
                updateDragItem,
                alertModalOpen,
                setAlertModalOpen,
                alertMessage,
                setAlertMessage,
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
                createPostModalOpen,
                setCreatePostModalOpen,
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
