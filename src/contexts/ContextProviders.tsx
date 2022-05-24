import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import config from '@src/Config'
import AccountContextProvider from '@contexts/AccountContext'
import SpaceContextProvider from '@contexts/SpaceContext'
import UserContextProvider from '@contexts/UserContext'
import PostContextProvider from '@contexts/PostContext'

const ContextProviders = (props: { children: any }): JSX.Element => {
    const { children } = props
    return (
        <BrowserRouter history={createBrowserHistory}>
            <AccountContextProvider>
                <SpaceContextProvider>
                    <UserContextProvider>
                        <PostContextProvider>
                            <GoogleReCaptchaProvider reCaptchaKey={config.recaptchaSiteKey}>
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
