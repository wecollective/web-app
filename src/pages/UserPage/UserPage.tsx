import React, { useContext, useEffect } from 'react'
import { Route, Switch, Redirect, useLocation } from 'react-router-dom'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/UserPage.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import UserPageSidebar from '@pages/UserPage/UserPageSidebar'
import CoverImage from '@components/CoverImage'
import PageTabs from '@components/PageTabs'
import UserPageAbout from '@pages/UserPage/UserPageAbout'
import UserPageSettings from '@pages/UserPage/UserPageSettings'
import UserPageNotifications from '@pages/UserPage/UserPageNotifications'
// import UserPageMessages from '@pages/UserPage/UserPageMessages'
import UserPagePosts from '@pages/UserPage/UserPagePosts'
import { ReactComponent as SettingsIconSVG } from '@svgs/cog-solid.svg'

const UserPage = ({
    match,
}: {
    match: { url: string; params: { userHandle: string } }
}): JSX.Element => {
    const { url } = match
    const { userData, isOwnAccount, resetUserData } = useContext(UserContext)
    const location = useLocation()
    const subpage = location.pathname.split('/')[3]
    const tabs = {
        baseRoute: `/u/${userData.handle}`,
        left: [
            { text: 'About', visible: true, selected: subpage === 'about' },
            { text: 'Posts', visible: true, selected: subpage === 'posts' },
            { text: 'Notifications', visible: isOwnAccount, selected: subpage === 'notifications' },
        ],
        right: [
            {
                text: 'Settings',
                visible: isOwnAccount,
                selected: subpage === 'settings',
                icon: <SettingsIconSVG />,
            },
        ],
    }

    useEffect(() => () => resetUserData(), [])

    return (
        <Row className={styles.wrapper}>
            <UserPageSidebar />
            <Column className={styles.content}>
                <CoverImage type='user' image={userData.coverImagePath} canEdit={isOwnAccount} />
                <PageTabs tabs={tabs} />
                <Column className={styles.centerPanel}>
                    <Switch>
                        <Redirect from={`${url}`} to={`${url}/about`} exact />
                        <Route path='/u/:userHandle/about' component={UserPageAbout} exact />
                        <Route path='/u/:userHandle/posts' component={UserPagePosts} exact />
                        <Route
                            path='/u/:userHandle/notifications'
                            component={UserPageNotifications}
                            exact
                        />
                        <Route path='/u/:userHandle/settings' component={UserPageSettings} exact />
                    </Switch>
                </Column>
            </Column>
        </Row>
    )
}

export default UserPage
