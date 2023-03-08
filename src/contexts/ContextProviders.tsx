import AccountContextProvider from '@contexts/AccountContext'
import PostContextProvider from '@contexts/PostContext'
import SpaceContextProvider from '@contexts/SpaceContext'
import UserContextProvider from '@contexts/UserContext'
import config from '@src/Config'
import { createBrowserHistory } from 'history'
import React from 'react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { BrowserRouter } from 'react-router-dom'

const ContextProviders = (props: { children: any }): JSX.Element => {
    const { children } = props
    return (
        <BrowserRouter history={createBrowserHistory}>
            <AccountContextProvider>
                <SpaceContextProvider>
                    <UserContextProvider>
                        <PostContextProvider>
                            <GoogleReCaptchaProvider reCaptchaKey={config.recaptchaSiteKey || ''}>
                                {children}
                            </GoogleReCaptchaProvider>
                        </PostContextProvider>
                    </UserContextProvider>
                </SpaceContextProvider>
            </AccountContextProvider>
        </BrowserRouter>
    )
}

export default ContextProviders
