import AccountContextProvider from '@contexts/AccountContext'
import SpaceContextProvider from '@contexts/SpaceContext'
import UserContextProvider from '@contexts/UserContext'
import config from '@src/Config'
// import { createBrowserHistory } from 'history'
import React from 'react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { BrowserRouter } from 'react-router-dom'

function ContextProviders(props: { children: any }): JSX.Element {
    const { children } = props
    return (
        <BrowserRouter>
            <AccountContextProvider>
                <SpaceContextProvider>
                    <UserContextProvider>
                        <GoogleReCaptchaProvider reCaptchaKey={config.recaptchaSiteKey || ''}>
                            {children}
                        </GoogleReCaptchaProvider>
                    </UserContextProvider>
                </SpaceContextProvider>
            </AccountContextProvider>
        </BrowserRouter>
    )
}

export default ContextProviders
