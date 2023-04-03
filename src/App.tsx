import GlobalHelpButton from '@components/GlobalHelpButton'
import Modals from '@components/modals/Modals'
import Navbar from '@components/Navbar'
import ContextProviders from '@contexts/ContextProviders'
import HomePage from '@pages/HomePage'
import PageNotFound from '@pages/PageNotFound'
import PostPage from '@pages/PostPage/PostPage'
import SpacePage from '@pages/SpacePage/SpacePage'
import UserPage from '@pages/UserPage/UserPage'
import styles from '@styles/App.module.scss'
import React from 'react'
import { Route, Routes } from 'react-router-dom'

function App(): JSX.Element {
    return (
        <div className={styles.wrapper}>
            <ContextProviders>
                <Modals />
                <Navbar />
                <GlobalHelpButton />
                {/* <SidebarSmall /> */}
                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='/s/:spaceHandle/*' element={<SpacePage />} />
                    <Route path='/p/:postId/*' element={<PostPage />} />
                    <Route path='/u/:userHandle/*' element={<UserPage />} />
                    <Route element={<PageNotFound />} />
                </Routes>
            </ContextProviders>
        </div>
    )
}

export default App
