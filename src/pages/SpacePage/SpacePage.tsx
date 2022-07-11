import Button from '@components/Button'
import Column from '@components/Column'
import CoverImage from '@components/CoverImage'
import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import ImageFade from '@components/ImageFade'
import PageTabs from '@components/PageTabs'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import PageNotFound from '@pages/PageNotFound'
import SpacePageAbout from '@pages/SpacePage/SpacePageAbout'
import SpacePageCalendar from '@pages/SpacePage/SpacePageCalendar'
import SpacePageGovernance from '@pages/SpacePage/SpacePageGovernance'
import SpacePagePeople from '@pages/SpacePage/SpacePagePeople'
import SpacePagePosts from '@pages/SpacePage/SpacePagePosts'
import SpacePageRooms from '@pages/SpacePage/SpacePageRooms'
import SpacePageSettings from '@pages/SpacePage/SpacePageSettings'
import SpacePageSpaces from '@pages/SpacePage/SpacePageSpaces'
import config from '@src/Config'
import { onPageBottomReached } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/SpacePage.module.scss'
import { ReactComponent as AboutIcon } from '@svgs/book-open-solid.svg'
import { ReactComponent as GovernanceIcon } from '@svgs/building-columns-solid.svg'
import { ReactComponent as CalendarIcon } from '@svgs/calendar-days-solid.svg'
import { ReactComponent as SuccessIconSVG } from '@svgs/check-circle-solid.svg'
import { ReactComponent as SettingsIconSVG } from '@svgs/cog-solid.svg'
import { ReactComponent as PostsIcon } from '@svgs/edit-solid.svg'
import { ReactComponent as SpacesIcon } from '@svgs/overlapping-circles-thick.svg'
import { ReactComponent as PeopleIcon } from '@svgs/users-solid.svg'
import axios from 'axios'
import React, { useContext, useEffect } from 'react'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

const SpacePage = (): JSX.Element => {
    const {
        accountData,
        accountDataLoading,
        updateAccountData,
        loggedIn,
        setPageBottomReached,
        setImageUploadType,
        setImageUploadModalOpen,
    } = useContext(AccountContext)
    const {
        spaceData,
        getSpaceData,
        resetSpaceData,
        isModerator,
        isFollowing,
        setIsFollowing,
        setSelectedSpaceSubPage,
    } = useContext(SpaceContext)

    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const cookies = new Cookies()
    const tabs = {
        baseRoute: `/s/${spaceData.handle}`,
        left: [
            { text: 'About', visible: true, icon: <AboutIcon /> },
            { text: 'Posts', visible: true, icon: <PostsIcon /> },
            { text: 'Spaces', visible: true, icon: <SpacesIcon /> },
            { text: 'People', visible: true, icon: <PeopleIcon /> },
            { text: 'Calendar', visible: true, icon: <CalendarIcon /> },
            { text: 'Governance', visible: true, icon: <GovernanceIcon /> },
        ],
        right: [{ text: 'Settings', visible: isModerator, icon: <SettingsIconSVG /> }],
    }

    function joinSpace() {
        const data = { spaceId: spaceData.id, isFollowing }
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .post(`${config.apiURL}/toggle-join-space`, data, options)
            .then(() => {
                if (isFollowing) {
                    updateAccountData(
                        'FollowedHolons',
                        accountData.FollowedHolons.filter((h) => h.handle !== spaceData.handle)
                    )
                } else {
                    const newFollowedSpaces = [...accountData.FollowedHolons]
                    newFollowedSpaces.push({
                        handle: spaceData.handle,
                        name: spaceData.name,
                        flagImagePath: spaceData.flagImagePath,
                    })
                    updateAccountData('FollowedHolons', newFollowedSpaces)
                }
                setIsFollowing(!isFollowing)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (!accountDataLoading && spaceHandle !== spaceData.handle) getSpaceData(spaceHandle)
    }, [accountDataLoading, spaceHandle])

    useEffect(() => setSelectedSpaceSubPage(subpage), [location])

    useEffect(() => {
        document.addEventListener('scroll', () => onPageBottomReached(setPageBottomReached))
        // window.scrollTo(0, 300)
        // window.onunload = () => window.scrollTo(0, 300)
    }, [])

    useEffect(() => () => resetSpaceData(), [])

    return (
        <Column centerX className={styles.wrapper}>
            <CoverImage type='space' image={spaceData.coverImagePath} canEdit={isModerator} />
            <Column centerX className={styles.header}>
                <Row centerY className={styles.spaceData}>
                    <div className={styles.flagImage}>
                        <ImageFade imagePath={spaceData.flagImagePath} speed={1000}>
                            <FlagImagePlaceholder type='space' />
                        </ImageFade>
                        {isModerator && (
                            <button
                                type='button'
                                onClick={() => {
                                    setImageUploadType('space-flag')
                                    setImageUploadModalOpen(true)
                                }}
                            >
                                Add a new <br /> flag image
                            </button>
                        )}
                    </div>
                    <Row centerY wrap>
                        <Column className={styles.spaceName}>
                            <h1>{spaceData.name}</h1>
                            <p className='grey'>s/{spaceData.handle}</p>
                        </Column>
                        {spaceHandle !== 'all' && loggedIn && (
                            <Row>
                                <Button
                                    icon={isFollowing ? <SuccessIconSVG /> : undefined}
                                    text={isFollowing ? 'Joined' : 'Join'}
                                    color='blue'
                                    disabled={spaceHandle !== spaceData.handle}
                                    onClick={joinSpace}
                                />
                            </Row>
                        )}
                    </Row>
                </Row>
                <PageTabs tabs={tabs} />
            </Column>
            <Column centerX className={styles.content}>
                <Switch>
                    <Redirect from='/s/:spaceHandle/' to='/s/:spaceHandle/posts' exact />
                    <Route path='/s/:spaceHandle/about' component={SpacePageAbout} exact />
                    <Route path='/s/:spaceHandle/posts' component={SpacePagePosts} exact />
                    <Route path='/s/:spaceHandle/spaces' component={SpacePageSpaces} exact />
                    <Route path='/s/:spaceHandle/people' component={SpacePagePeople} exact />
                    <Route path='/s/:spaceHandle/calendar' component={SpacePageCalendar} exact />
                    <Route path='/s/:spaceHandle/rooms' component={SpacePageRooms} exact />
                    <Route
                        path='/s/:spaceHandle/governance'
                        component={SpacePageGovernance}
                        exact
                    />
                    <Route path='/s/:spaceHandle/settings' component={SpacePageSettings} exact />
                    <Route component={PageNotFound} />
                </Switch>
            </Column>
        </Column>
    )
}

export default SpacePage
