import Modals from '@components/modals/Modals'
import Navbar from '@components/Navbar'
import ContextProviders from '@contexts/ContextProviders'
import CoopPage from '@pages/CoopPage'
import FeaturesPage from '@pages/FeaturesPage'
import HomePage from '@pages/HomePage'
import PageNotFound from '@pages/PageNotFound'
import PostPage from '@pages/PostPage/PostPage'
import SpacePage from '@pages/SpacePage/SpacePage'
import UserPage from '@pages/UserPage/UserPage'
import styles from '@styles/App.module.scss'
import React from 'react'
import { Route, Switch } from 'react-router-dom'

const App = (): JSX.Element => {
    return (
        <div className={styles.wrapper}>
            <ContextProviders>
                <Modals />
                <Navbar />
                {/* <SidebarSmall /> */}
                <Switch>
                    <Route path='/' exact component={HomePage} />
                    <Route path='/features' exact component={FeaturesPage} />
                    <Route path='/coop' exact component={CoopPage} />
                    <Route path='/s/:spaceHandle' component={SpacePage} />
                    <Route path='/p/:postId' component={PostPage} />
                    <Route path='/u/:userHandle' component={UserPage} />
                    <Route component={PageNotFound} />
                </Switch>
            </ContextProviders>
        </div>
    )
}

export default App
