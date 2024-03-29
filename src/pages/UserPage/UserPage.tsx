import Button from '@components/Button'
import Column from '@components/Column'
import CoverImage from '@components/CoverImage'
import EditableFlagImage from '@components/EditableFlagImage'
import FlagImage from '@components/FlagImage'
import PageTabs from '@components/PageTabs'
import Row from '@components/Row'
import SEO from '@components/SEO'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import About from '@pages/UserPage/About'
import Following from '@pages/UserPage/Following'
import Likes from '@pages/UserPage/Likes'
import Messages from '@pages/UserPage/Messages'
import Notifications from '@pages/UserPage/Notifications'
import Posts from '@pages/UserPage/Posts'
import Settings from '@pages/UserPage/Settings'
import Streams from '@pages/UserPage/Streams'
import config from '@src/Config'
import { capitalise, getDraftPlainText, onPageBottomReached } from '@src/Helpers'
import styles from '@styles/pages/UserPage/UserPage.module.scss'
import {
    AboutIcon,
    BellIcon,
    EyeIcon,
    LikeIcon,
    MessageIcon,
    PostIcon,
    SettingsIcon,
    StreamIcon,
    SuccessIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

// todo: load UserNotFound component here instead of in each subpage?

function UserPage(): JSX.Element {
    const { accountDataLoading, setPageBottomReached, loggedIn } = useContext(AccountContext)
    const { userData, getUserData, resetUserData, isOwnAccount, setSelectedUserSubPage } =
        useContext(UserContext)

    const [headerCollapsed, setHeaderColapsed] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followingModalOpen, setFollowingModalOpen] = useState(false)
    const [followUserLoading, setFollowUserLoading] = useState(false)
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const { clientWidth } = document.documentElement
    const mobileView = clientWidth < 900
    const tabletView = clientWidth >= 900 && clientWidth < 1200
    const cookies = new Cookies()
    const tabs = {
        baseRoute: `/u/${userHandle}`,
        left: [
            { text: 'About', visible: true, icon: <AboutIcon /> },
            { text: 'Posts', visible: true, icon: <PostIcon /> },
            { text: 'Streams', visible: isOwnAccount, icon: <StreamIcon /> },
            { text: 'Following', visible: isOwnAccount, icon: <EyeIcon /> },
            { text: 'Likes', visible: isOwnAccount, icon: <LikeIcon /> },
            { text: 'Notifications', visible: isOwnAccount, icon: <BellIcon /> },
            { text: 'Messages', visible: isOwnAccount, icon: <MessageIcon /> },
        ],
        right: [
            {
                text: 'Settings',
                visible: isOwnAccount,
                icon: <SettingsIcon />,
            },
        ],
    }

    function toggleFollowing() {
        setFollowUserLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = { userId: userData.id, isFollowing }
        axios
            .post(`${config.apiURL}/toggle-follow-user`, data, options)
            .then(() => {
                setFollowUserLoading(false)
                setIsFollowing(!isFollowing)
            })
            .catch((error) => console.log(error))
    }

    function followButtonClick() {
        if (isFollowing) setFollowingModalOpen(true)
        else toggleFollowing()
    }

    useEffect(() => {
        if (!accountDataLoading && userHandle !== userData.handle) getUserData(userHandle)
    }, [accountDataLoading, userHandle])

    useEffect(() => setSelectedUserSubPage(subpage), [location])

    useEffect(() => setIsFollowing(!!userData.isFollowing), [userData.id])

    useEffect(() => {
        document.addEventListener('scroll', () => {
            setHeaderColapsed(window.pageYOffset > (mobileView ? 260 : 170))
            onPageBottomReached(setPageBottomReached)
        })
    }, [])

    useEffect(() => () => resetUserData(), [])

    return (
        <Column centerX className={styles.wrapper}>
            <SEO
                title={`${userData.name} (u/${userData.handle}) ${
                    subpage && subpage !== 'posts' ? `| ${capitalise(subpage)}` : ''
                }`}
                description={userData.bio ? getDraftPlainText(userData.bio) : ''}
                image={userData.flagImagePath}
            />
            {/* <Sidebar /> */}
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
                    <Row centerY>
                        <Column className={styles.userName}>
                            <h1>{userData.name}</h1>
                            <p className='grey'>u/{userData.handle}</p>
                        </Column>
                    </Row>
                    {loggedIn && !isOwnAccount && (
                        <Button
                            icon={isFollowing ? <SuccessIcon /> : undefined}
                            text={isFollowing ? 'Following' : 'Follow'}
                            color='blue'
                            disabled={userHandle !== userData.handle}
                            loading={followUserLoading}
                            onClick={followButtonClick}
                        />
                    )}
                </Row>
                <Row centerX className={styles.tabRow}>
                    <Row centerY className={styles.userDataSmall}>
                        <FlagImage
                            type='space'
                            imagePath={userData.flagImagePath}
                            size={32}
                            style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
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
                    <Route path='/' element={<Navigate to='posts' replace />} />
                    <Route path='about' element={<About />} />
                    <Route path='posts' element={<Posts />} />
                    <Route path='streams/:stream/*' element={<Streams />} />
                    <Route path='streams' element={<Navigate to='spaces' replace />} />
                    <Route path='following/:itemType' element={<Following />} />
                    <Route path='following' element={<Navigate to='spaces' replace />} />
                    <Route path='likes' element={<Likes />} />
                    <Route path='notifications' element={<Notifications />} />
                    <Route path='messages' element={<Messages />} />
                    <Route path='settings' element={<Settings />} />
                </Routes>
            </Column>
            {followingModalOpen && (
                <Modal centerX close={() => setFollowingModalOpen(false)}>
                    <h1>Are you sure you want to unfollow this user?</h1>
                    <Row centerX style={{ marginTop: 10 }}>
                        <Button
                            text='Yes'
                            color='red'
                            onClick={() => {
                                toggleFollowing()
                                setFollowingModalOpen(false)
                            }}
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            text='No'
                            color='blue'
                            onClick={() => setFollowingModalOpen(false)}
                        />
                    </Row>
                </Modal>
            )}
        </Column>
    )
}

export default UserPage
