/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/control-has-associated-label */
import Button from '@components/Button'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import GlobalSearchBar from '@components/GlobalSearchBar'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import NavigationList from '@pages/SpacePage/NavigationList'
import styles from '@styles/components/Navbar.module.scss'
import {
    AboutIcon,
    BellIcon,
    CalendarIcon,
    ChevronDownIcon,
    EyeIcon,
    GovernanceIcon,
    LikeIcon,
    MessageIcon,
    PostIcon,
    SearchIcon,
    SettingsIcon,
    SpacesIcon,
    StreamIcon,
    TreeIcon,
    UserIcon,
    UsersIcon,
    WecoLogo,
} from '@svgs/all'
import React, { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function Navbar(): JSX.Element {
    const { loggedIn, accountData, accountDataLoading, setLogInModalOpen, logOut } =
        useContext(AccountContext)
    const { name, handle, flagImagePath, unseenNotifications, unseenMessages } = accountData
    const { spaceData, getSpaceData, isModerator, selectedSpaceSubPage } = useContext(SpaceContext)
    const { userData } = useContext(UserContext)
    const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false)
    const [accountMenuOpen, setAccountMenuOpen] = useState(false)
    const [searchDropDownOpen, setSearchDropDownOpen] = useState(false)
    const [exploreDropDownOpen, setExploreDropDownOpen] = useState(false)
    const [profileDropDownOpen, setProfileDropDownOpen] = useState(false)
    const history = useNavigate()
    const location = useLocation()
    const otherUsersPage =
        location.pathname.split('/')[1] === 'u' && location.pathname.split('/')[2] !== handle

    // todo: grab followed spaces when needed

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

    function toggleHamburgerMenu() {
        const menu = document.getElementById('mobile-left')
        if (menu) {
            if (hamburgerMenuOpen) {
                // close
                menu.classList.remove(styles.entering)
                menu.classList.add(styles.exiting)
                setTimeout(() => setHamburgerMenuOpen(false), 500)
            } else {
                // open
                if (!accountDataLoading && !spaceData.id) getSpaceData('all')
                if (searchDropDownOpen) toggleSearchDropDown()
                if (accountMenuOpen) toggleAccountMenu()
                setHamburgerMenuOpen(true)
                menu.classList.remove(styles.exiting)
                setTimeout(() => menu.classList.add(styles.entering), 50)
            }
        }
    }

    function toggleSearchDropDown() {
        const menu = document.getElementById('mobile-center')
        if (menu) {
            if (searchDropDownOpen) {
                // close
                menu.classList.remove(styles.entering)
                menu.classList.add(styles.exiting)
                setTimeout(() => setSearchDropDownOpen(false), 800)
            } else {
                // open
                if (hamburgerMenuOpen) toggleHamburgerMenu()
                if (accountMenuOpen) toggleAccountMenu()
                setSearchDropDownOpen(true)
                menu.classList.remove(styles.exiting)
                setTimeout(() => menu.classList.add(styles.entering), 50)
            }
        }
    }

    function toggleAccountMenu() {
        const menu = document.getElementById('mobile-right')
        if (menu) {
            if (accountMenuOpen) {
                // close
                menu.classList.remove(styles.entering)
                menu.classList.add(styles.exiting)
                setTimeout(() => setAccountMenuOpen(false), 500)
            } else {
                // open
                if (hamburgerMenuOpen) toggleHamburgerMenu()
                if (searchDropDownOpen) toggleSearchDropDown()
                setAccountMenuOpen(true)
                menu.classList.remove(styles.exiting)
                setTimeout(() => menu.classList.add(styles.entering), 50)
            }
        }
    }

    return (
        <Row spaceBetween className={styles.wrapper}>
            <Row centerY id='mobile-left' className={styles.mobileLeft}>
                <button type='button' onClick={() => toggleHamburgerMenu()}>
                    <TreeIcon />
                </button>
                {hamburgerMenuOpen && (
                    <>
                        <button
                            className={styles.hamburgerMenuBackground}
                            type='button'
                            onClick={() => toggleHamburgerMenu()}
                        />
                        <Column className={styles.hamburgerMenu}>
                            <Column centerY style={{ marginBottom: 15 }}>
                                <Row centerY>
                                    <button
                                        type='button'
                                        className={styles.homeButton}
                                        onClick={() => {
                                            toggleHamburgerMenu()
                                            history('/')
                                        }}
                                    >
                                        <WecoLogo />
                                    </button>
                                    <Link to='/' onClick={() => toggleHamburgerMenu()}>
                                        <p>Home page</p>
                                    </Link>
                                </Row>
                                {(otherUsersPage ||
                                    (spaceData.id !== 1 &&
                                        !spaceData.DirectParentSpaces.map((s) => s.id).includes(
                                            1
                                        ))) && (
                                    <ImageTitle
                                        type='space'
                                        imagePath='https://weco-prod-space-flag-images.s3.eu-west-1.amazonaws.com/1614556880362'
                                        title='All'
                                        link={`/s/all/${selectedSpaceSubPage}`}
                                        fontSize={14}
                                        imageSize={35}
                                        onClick={() => toggleHamburgerMenu()}
                                        wrapText
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                            </Column>
                            {/* <Row centerY className={styles.hamburgerMenuHeader}>
                                <FlagImage
                                    type={otherUsersPage ? 'user' : 'space'}
                                    size={80}
                                    imagePath={
                                        otherUsersPage
                                            ? userData.flagImagePath
                                            : spaceData.flagImagePath
                                    }
                                    style={{ marginRight: 10 }}
                                />
                                <Column>
                                    <h1>{otherUsersPage ? userData.name : spaceData.name}</h1>
                                    <p className='grey'>
                                        {otherUsersPage
                                            ? `u/${userData.handle}`
                                            : `s/${spaceData.handle}`}
                                    </p>
                                </Column>
                            </Row> */}
                            {otherUsersPage ? (
                                <Column className={styles.hamburgerMenuTabs}>
                                    <Link
                                        to={`/u/${userData.handle}/about`}
                                        onClick={() => toggleHamburgerMenu()}
                                    >
                                        <AboutIcon />
                                        <p>About</p>
                                    </Link>
                                    <Link
                                        to={`/u/${userData.handle}/posts`}
                                        onClick={() => toggleHamburgerMenu()}
                                    >
                                        <PostIcon />
                                        <p>Posts</p>
                                    </Link>
                                </Column>
                            ) : (
                                <>
                                    <Column className={styles.hamburgerMenuTabs}>
                                        <Link
                                            to={`/s/${spaceData.handle}/about`}
                                            onClick={() => toggleHamburgerMenu()}
                                        >
                                            <AboutIcon />
                                            <p>About</p>
                                        </Link>
                                        <Link
                                            to={`/s/${spaceData.handle}/posts`}
                                            onClick={() => toggleHamburgerMenu()}
                                        >
                                            <PostIcon />
                                            <p>Posts</p>
                                        </Link>
                                        <Link
                                            to={`/s/${spaceData.handle}/spaces`}
                                            onClick={() => toggleHamburgerMenu()}
                                        >
                                            <SpacesIcon />
                                            <p>Spaces</p>
                                        </Link>
                                        <Link
                                            to={`/s/${spaceData.handle}/people`}
                                            onClick={() => toggleHamburgerMenu()}
                                        >
                                            <UsersIcon />
                                            <p>People</p>
                                        </Link>
                                        <Link
                                            to={`/s/${spaceData.handle}/calendar`}
                                            onClick={() => toggleHamburgerMenu()}
                                        >
                                            <CalendarIcon />
                                            <p>Calendar</p>
                                        </Link>
                                        <Link
                                            to={`/s/${spaceData.handle}/governance`}
                                            onClick={() => toggleHamburgerMenu()}
                                        >
                                            <GovernanceIcon />
                                            <p>Governance</p>
                                        </Link>
                                        {isModerator && (
                                            <Link
                                                to={`/s/${spaceData.handle}/settings`}
                                                onClick={() => toggleHamburgerMenu()}
                                            >
                                                <SettingsIcon />
                                                <p>Settings</p>
                                            </Link>
                                        )}
                                    </Column>
                                    <NavigationList
                                        onLocationChange={() => toggleHamburgerMenu()}
                                    />
                                </>
                            )}
                        </Column>
                    </>
                )}
            </Row>
            <Row centerY className={styles.desktopLeft}>
                <button
                    type='button'
                    id='home-button'
                    className={styles.homeButton}
                    onClick={() => {
                        rotateButton()
                        history(loggedIn ? '/s/all/posts' : '/')
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
                            <Link to='/s/all/posts'>
                                <PostIcon />
                                <p>Posts</p>
                            </Link>
                            <Link to='/s/all/spaces'>
                                <SpacesIcon />
                                <p>Spaces</p>
                            </Link>
                            <Link to='/s/all/people'>
                                <UsersIcon />
                                <p>People</p>
                            </Link>
                            <Link to='/s/all/calendar'>
                                <CalendarIcon />
                                <p>Events</p>
                            </Link>
                        </div>
                    )}
                </div>
            </Row>
            <Row centerY id='mobile-center' className={styles.mobileCenter}>
                <button type='button' onClick={() => toggleSearchDropDown()}>
                    <SearchIcon />
                </button>
                {searchDropDownOpen && (
                    <>
                        <button
                            className={styles.mobileSearchBackground}
                            type='button'
                            onClick={() => toggleSearchDropDown()}
                        />
                        <Row centerY centerX className={styles.mobileSearchDropDown}>
                            <GlobalSearchBar
                                onLocationChange={() => toggleSearchDropDown()}
                                style={{ width: '100%', margin: '0 10px' }}
                            />
                        </Row>
                    </>
                )}
            </Row>
            <Row centerY className={styles.desktopCenter}>
                <GlobalSearchBar />
            </Row>
            {loggedIn ? (
                <>
                    <Row centerY id='mobile-right' className={styles.mobileRight}>
                        <button type='button' onClick={() => toggleAccountMenu()}>
                            <UserIcon />
                        </button>
                        {accountMenuOpen && (
                            <>
                                <button
                                    className={styles.accountMenuBackground}
                                    type='button'
                                    onClick={() => toggleAccountMenu()}
                                />
                                <Column className={styles.accountMenu}>
                                    <Row centerY className={styles.accountMenuHeader}>
                                        <FlagImage
                                            type='user'
                                            size={80}
                                            imagePath={flagImagePath}
                                            style={{ marginRight: 10 }}
                                        />
                                        <Column>
                                            <h1>{name}</h1>
                                            <p className='grey'>u/{handle}</p>
                                        </Column>
                                    </Row>
                                    <Row style={{ marginBottom: 20 }}>
                                        <Button text='Log out' color='blue' onClick={logOut} />
                                    </Row>
                                    <Column className={styles.accountMenuTabs}>
                                        <Link
                                            to={`/u/${handle}/about`}
                                            onClick={() => toggleAccountMenu()}
                                        >
                                            <AboutIcon />
                                            <p>About</p>
                                        </Link>
                                        <Link
                                            to={`/u/${handle}/posts`}
                                            onClick={() => toggleAccountMenu()}
                                        >
                                            <PostIcon />
                                            <p>Posts</p>
                                        </Link>
                                        <Link
                                            to={`/u/${handle}/streams/spaces`}
                                            onClick={() => toggleAccountMenu()}
                                        >
                                            <StreamIcon />
                                            <p>Streams</p>
                                        </Link>
                                        <Link
                                            to={`/u/${handle}/following`}
                                            onClick={() => toggleAccountMenu()}
                                        >
                                            <EyeIcon />
                                            <p>Following</p>
                                        </Link>
                                        <Link
                                            to={`/u/${handle}/likes`}
                                            onClick={() => toggleAccountMenu()}
                                        >
                                            <LikeIcon />
                                            <p>Likes</p>
                                        </Link>
                                        <Link
                                            to={`/u/${handle}/notifications`}
                                            onClick={() => toggleAccountMenu()}
                                        >
                                            <BellIcon />
                                            <p>Notifications</p>
                                        </Link>
                                        <Link
                                            to={`/u/${handle}/settings`}
                                            onClick={() => toggleAccountMenu()}
                                        >
                                            <SettingsIcon />
                                            <p>Settings</p>
                                        </Link>
                                    </Column>
                                    {/* <p className='grey'>Followed spaces</p>
                                    <Scrollbars style={{ marginTop: 10 }}>
                                        <Column>
                                            {FollowedSpaces.map((space) => (
                                                <ImageTitle
                                                    key={space.id}
                                                    type='space'
                                                    imagePath={space.flagImagePath}
                                                    imageSize={35}
                                                    title={space.name}
                                                    fontSize={14}
                                                    link={`/s/${space.handle}/${selectedSpaceSubPage}`}
                                                    style={{ marginBottom: 10 }}
                                                    onClick={() => toggleAccountMenu()}
                                                />
                                            ))}
                                        </Column>
                                    </Scrollbars> */}
                                </Column>
                            </>
                        )}
                    </Row>
                    <Row centerY className={styles.desktopRight}>
                        <div
                            className={styles.profileButton}
                            onMouseEnter={() => setProfileDropDownOpen(true)}
                            onMouseLeave={() => setProfileDropDownOpen(false)}
                        >
                            <p>{name}</p>
                            <FlagImage type='user' size={40} imagePath={flagImagePath} />
                            {unseenNotifications + unseenMessages > 0 && (
                                <div className={styles.totalUnseenItems}>
                                    <p>{unseenNotifications + unseenMessages}</p>
                                </div>
                            )}
                            {profileDropDownOpen && (
                                <div className={styles.profileDropDown}>
                                    <Link to={`/u/${handle}/notifications`}>
                                        <BellIcon />
                                        <p>Notifications</p>
                                        {unseenNotifications > 0 && (
                                            <div className={styles.unseenItems}>
                                                <p>{unseenNotifications}</p>
                                            </div>
                                        )}
                                    </Link>
                                    <Link to={`/u/${handle}/messages`}>
                                        <MessageIcon />
                                        <p>Messages</p>
                                        {unseenMessages > 0 && (
                                            <div className={styles.unseenItems}>
                                                <p>{unseenMessages}</p>
                                            </div>
                                        )}
                                    </Link>
                                    <Link to={`/u/${handle}/about`}>
                                        <AboutIcon />
                                        <p>About</p>
                                    </Link>
                                    <Link to={`/u/${handle}/posts`}>
                                        <PostIcon />
                                        <p>Posts</p>
                                    </Link>
                                    <Link to={`/u/${handle}/streams/spaces`}>
                                        <StreamIcon />
                                        <p>Streams</p>
                                    </Link>
                                    <Link to={`/u/${handle}/following`}>
                                        <EyeIcon />
                                        <p>Following</p>
                                    </Link>
                                    <Link to={`/u/${handle}/likes`}>
                                        <LikeIcon />
                                        <p>Likes</p>
                                    </Link>
                                    <Link to={`/u/${handle}/settings`}>
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
                </>
            ) : (
                <Row centerY>
                    <Button
                        text='Log in'
                        color='blue'
                        onClick={() => setLogInModalOpen(true)}
                        style={{ marginRight: 10 }}
                    />
                    {/* <Button text='Donate' color='purple' onClick={() => setDonateModalOpen(true)} /> */}
                </Row>
            )}
        </Row>
    )
}

export default Navbar
