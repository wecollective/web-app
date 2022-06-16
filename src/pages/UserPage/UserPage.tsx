import React, { useContext, useEffect } from 'react'
import { Route, Switch, Redirect, useLocation } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import { onPageBottomReached } from '@src/Helpers'
import styles from '@styles/pages/UserPage/UserPage.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import CoverImage from '@components/CoverImage'
import ImageFade from '@components/ImageFade'
import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import PageTabs from '@components/PageTabs'
import UserPageAbout from '@pages/UserPage/UserPageAbout'
import UserPageSettings from '@pages/UserPage/UserPageSettings'
import UserPageNotifications from '@pages/UserPage/UserPageNotifications'
import UserPagePosts from '@pages/UserPage/UserPagePosts'
import { ReactComponent as AboutIcon } from '@svgs/book-open-solid.svg'
import { ReactComponent as PostsIcon } from '@svgs/edit-solid.svg'
import { ReactComponent as BellIcon } from '@svgs/bell-solid.svg'
import { ReactComponent as SettingsIcon } from '@svgs/cog-solid.svg'

const UserPage = (): JSX.Element => {
    const {
        accountDataLoading,
        setPageBottomReached,
        setImageUploadType,
        setImageUploadModalOpen,
        loggedIn
    } = useContext(AccountContext)
    const {
        userData,
        getUserData,
        resetUserData,
        isOwnAccount,
        setSelectedUserSubPage,
    } = useContext(UserContext)
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const tabs = {
        baseRoute: `/u/${userData.handle}`,
        left: [
            { text: 'About', visible: true, icon: <AboutIcon /> },
            { text: 'Posts', visible: true, icon: <PostsIcon /> },
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
        document.addEventListener('scroll', () => onPageBottomReached(setPageBottomReached))
    }, [])

    useEffect(() => () => resetUserData(), [])

    return (
        <Column centerX className={styles.wrapper}>
            <CoverImage type='user' image={userData.coverImagePath} canEdit={isOwnAccount} />
            <Column centerX className={styles.header}>
                <Row centerY className={styles.userData}>
                    <div className={styles.flagImage}>
                        <ImageFade imagePath={userData.flagImagePath} speed={1000}>
                            <FlagImagePlaceholder type='space' />
                        </ImageFade>
                        {isOwnAccount && (
                            <button
                                type='button'
                                onClick={() => {
                                    setImageUploadType('user-flag')
                                    setImageUploadModalOpen(true)
                                }}
                            >
                                Add a new <br /> flag image
                            </button>
                        )}
                    </div>
                    <Column className={styles.userName}>
                        <h1>{userData.name}</h1>
                        <p className='grey'>u/{userData.handle}</p>
                    </Column>
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
                <PageTabs tabs={tabs} />
            </Column>
            <Column className={styles.content}>
                <Column className={styles.centerPanel}>
                    <Switch>
                        <Redirect from='/u/:userHandle/' to='/u/:userHandle/about' exact />
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
        </Column>
    )
}

export default UserPage
