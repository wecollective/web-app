import React, { useContext, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/components/Navbar.module.scss'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import Button from '@components/Button'
import GlobalSearchBar from '@components/GlobalSearchBar'
import { ReactComponent as WecoLogo } from '@svgs/weco-logo.svg'
import { ReactComponent as ChevronDownIcon } from '@svgs/chevron-down-solid.svg'
import { ReactComponent as SpacesIcon } from '@svgs/overlapping-circles-thick.svg'
import { ReactComponent as PostsIcon } from '@svgs/edit-solid.svg'
import { ReactComponent as UsersIcon } from '@svgs/users-solid.svg'
import { ReactComponent as EventsIcon } from '@svgs/calendar-days-solid.svg'
import { ReactComponent as BellIcon } from '@svgs/bell-solid.svg'
import { ReactComponent as SettingsIcon } from '@svgs/cog-solid.svg'
import { ReactComponent as UserIcon } from '@svgs/user-solid.svg'

const Navbar = (): JSX.Element => {
    const { loggedIn, accountData, setLogInModalOpen, setDonateModalOpen, logOut } = useContext(
        AccountContext
    )
    const [exploreDropDownOpen, setExploreDropDownOpen] = useState(false)
    const [profileDropDownOpen, setProfileDropDownOpen] = useState(false)
    const history = useHistory()

    function rotateButton() {
        const homeButton = document.getElementById('home-button')
        if (homeButton) {
            if (!homeButton.style.transform) homeButton.style.transform = 'rotate(-360deg)'
            else {
                const degrees = homeButton.style.transform.split('-')[1].split('d')[0]
                homeButton.style.transform = `rotate(-${+degrees + 360}deg)`
            }
        }
    }

    return (
        <Row spaceBetween className={styles.wrapper}>
            <Row centerY>
                <button
                    type='button'
                    id='home-button'
                    className={styles.homeButton}
                    onClick={() => {
                        rotateButton()
                        history.push('/')
                    }}
                >
                    <WecoLogo />
                </button>
                <div
                    className={styles.exploreButton}
                    onMouseEnter={() => setExploreDropDownOpen(true)}
                    onMouseLeave={() => setExploreDropDownOpen(false)}
                >
                    <Link to='/s/all/spaces'>Explore</Link>
                    <ChevronDownIcon />
                    {exploreDropDownOpen && (
                        <div className={styles.exploreDropDown}>
                            <Link to='/s/all/spaces'>
                                <SpacesIcon />
                                <p>Spaces</p>
                            </Link>
                            <Link to='/s/all/posts'>
                                <PostsIcon />
                                <p>Posts</p>
                            </Link>
                            <Link to='/s/all/people'>
                                <UsersIcon />
                                <p>People</p>
                            </Link>
                            <Link to='/s/all/calendar'>
                                <EventsIcon />
                                <p>Events</p>
                            </Link>
                        </div>
                    )}
                </div>
            </Row>
            <Row centerY className={styles.searchBar}>
                <GlobalSearchBar />
            </Row>
            {loggedIn ? (
                <Row centerY className={styles.accountButtons}>
                    <div
                        className={styles.profileButton}
                        onMouseEnter={() => setProfileDropDownOpen(true)}
                        onMouseLeave={() => setProfileDropDownOpen(false)}
                    >
                        <p>{accountData.name}</p>
                        <FlagImage type='user' size={40} imagePath={accountData.flagImagePath} />
                        {accountData.unseenNotifications > 0 && (
                            <div className={styles.totalUnseenItems}>
                                <p>{accountData.unseenNotifications}</p>
                            </div>
                        )}
                        {profileDropDownOpen && (
                            <div className={styles.profileDropDown}>
                                <Link to={`/u/${accountData.handle}/about`}>
                                    <UserIcon />
                                    <p>Profile</p>
                                </Link>
                                <Link to={`/u/${accountData.handle}/posts`}>
                                    <PostsIcon />
                                    <p>Posts</p>
                                </Link>
                                <Link to={`/u/${accountData.handle}/notifications`}>
                                    <BellIcon />
                                    <p>Notifications</p>
                                    {accountData.unseenNotifications > 0 && (
                                        <div className={styles.unseenItems}>
                                            <p>{accountData.unseenNotifications}</p>
                                        </div>
                                    )}
                                </Link>
                                <Link to={`/u/${accountData.handle}/settings`}>
                                    <SettingsIcon />
                                    <p>Settings</p>
                                </Link>
                                <Row centerX style={{ marginTop: 15 }}>
                                    <Button text='Log out' color='blue' onClick={logOut} />
                                </Row>
                            </div>
                        )}
                    </div>
                </Row>
            ) : (
                <Row centerY>
                    <Button
                        text='Log in'
                        color='blue'
                        onClick={() => setLogInModalOpen(true)}
                        style={{ marginRight: 10 }}
                    />
                    <Button text='Donate' color='purple' onClick={() => setDonateModalOpen(true)} />
                </Row>
            )}
        </Row>
    )
}

export default Navbar
