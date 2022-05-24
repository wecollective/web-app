import React from 'react'
import { Route, Switch } from 'react-router-dom'
import ContextProviders from '@contexts/ContextProviders'
// import SidebarSmall from '@components/SidebarSmall'
import HomePage from '@pages/HomePage'
import FeaturesPage from '@pages/FeaturesPage'
import CoopPage from '@pages/CoopPage'
import SpacePage from '@pages/SpacePage/SpacePage'
import PostPage from '@pages/PostPage/PostPage'
import UserPage from '@pages/UserPage/UserPage'
import PageNotFound from '@pages/PageNotFound'
import Navbar from '@components/Navbar'
import Modals from '@components/Modals'
import styles from '@styles/App.module.scss'

const App = (): JSX.Element => {
    return (
        <div className={styles.wrapper}>
            <ContextProviders>
                <Modals />
                <Navbar />
                {/* <div className={styles.sidebarSmallWrapper}>
                        <SidebarSmall />
                    </div> */}
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
