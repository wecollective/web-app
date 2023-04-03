import Column from '@components/Column'
import CoverImage from '@components/CoverImage'
import EditableFlagImage from '@components/EditableFlagImage'
import PageTabs from '@components/PageTabs'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import FlagImage from '@src/components/FlagImage'
import { onPageBottomReached } from '@src/Helpers'
import About from '@src/pages/UserPage/About'
import Notifications from '@src/pages/UserPage/Notifications'
import Posts from '@src/pages/UserPage/Posts'
import Settings from '@src/pages/UserPage/Settings'
import styles from '@styles/pages/UserPage/UserPage.module.scss'
import { AboutIcon, BellIcon, PostIcon, SettingsIcon } from '@svgs/all'
import React, { useContext, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

// todo: load UserNotFound component here instead of in each subpage?

function UserPage(): JSX.Element {
    const { accountDataLoading, setPageBottomReached, loggedIn } = useContext(AccountContext)
    const { userData, getUserData, resetUserData, isOwnAccount, setSelectedUserSubPage } =
        useContext(UserContext)

    const [headerCollapsed, setHeaderColapsed] = useState(false)
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const { clientWidth } = document.documentElement
    const mobileView = clientWidth < 900
    const tabletView = clientWidth >= 900 && clientWidth < 1200
    const tabs = {
        baseRoute: `/u/${userHandle}`,
        left: [
            { text: 'About', visible: true, icon: <AboutIcon /> },
            { text: 'Posts', visible: true, icon: <PostIcon /> },
            { text: 'Notifications', visible: isOwnAccount, icon: <BellIcon /> },
        ],
        right: [
            {
                text: 'Settings',
                visible: isOwnAccount,
                icon: <SettingsIcon />,
            },
        ],
    }

    useEffect(() => {
        if (!accountDataLoading && userHandle !== userData.handle) getUserData(userHandle)
    }, [accountDataLoading, userHandle])

    useEffect(() => setSelectedUserSubPage(subpage), [location])

    useEffect(() => {
        document.addEventListener('scroll', () => {
            setHeaderColapsed(window.pageYOffset > (mobileView ? 260 : 290))
            onPageBottomReached(setPageBottomReached)
        })
    }, [])

    useEffect(() => () => resetUserData(), [])

    return (
        <Column centerX className={styles.wrapper}>
            <Column centerX className={`${styles.header} ${headerCollapsed && styles.collapsed}`}>
                <CoverImage type='user' image={userData.coverImagePath} canEdit={isOwnAccount} />
                <Row centerY className={styles.userData}>
                    <EditableFlagImage
                        type='user'
                        size={120}
                        imagePath={userData.flagImagePath}
                        canEdit={isOwnAccount}
                        className={styles.flagImageLarge}
                    />
                    <Row centerY style={{ height: 50 }}>
                        <Column className={styles.userName}>
                            <h1>{userData.name}</h1>
                            <p className='grey'>u/{userData.handle}</p>
                        </Column>
                    </Row>
                    {/* {loggedIn && (
                        <Button
                            icon={isFollowing ? <SuccessIconSVG /> : undefined}
                            text={isFollowing ? 'Following' : 'Follow'}
                            color='blue'
                            disabled={userHandle !== userData.handle}
                            onClick={followUser}
                        />
                    )} */}
                </Row>
                <Row centerX className={styles.tabRow}>
                    <Row centerY className={styles.userDataSmall}>
                        <FlagImage
                            type='space'
                            imagePath={userData.flagImagePath}
                            size={32}
                            shadow
                        />
                        {!tabletView && (
                            <Row centerY>
                                <p>{userData.name}</p>
                                <span>(u/{userData.handle})</span>
                            </Row>
                        )}
                    </Row>
                    <PageTabs tabs={tabs} />
                </Row>
            </Column>
            <Column centerX className={styles.content}>
                <Routes>
                    <Route path='/' element={<Navigate to='/about' replace />} />
                    <Route path='about' element={<About />} />
                    <Route path='posts' element={<Posts />} />
                    <Route path='notifications' element={<Notifications />} />
                    <Route path='settings' element={<Settings />} />
                </Routes>
            </Column>
        </Column>
    )
}

export default UserPage
