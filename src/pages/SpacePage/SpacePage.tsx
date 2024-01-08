/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import Column from '@components/Column'
import CoverImage from '@components/CoverImage'
import EditableFlagImage from '@components/EditableFlagImage'
import FlagImage from '@components/FlagImage'
import PageTabs from '@components/PageTabs'
import Row from '@components/Row'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import PageNotFound from '@pages/PageNotFound'
import Settings from '@pages/SpacePage/Settings'
import config from '@src/Config'
import { onPageBottomReached } from '@src/Helpers'
import About from '@src/pages/SpacePage/About'
import Calendar from '@src/pages/SpacePage/Calendar'
import Governance from '@src/pages/SpacePage/Governance'
import People from '@src/pages/SpacePage/People'
import Posts from '@src/pages/SpacePage/Posts'
import Rooms from '@src/pages/SpacePage/Rooms'
import Spaces from '@src/pages/SpacePage/Spaces'
import styles from '@styles/pages/SpacePage/SpacePage.module.scss'
import {
    AboutIcon,
    CalendarIcon,
    GovernanceIcon,
    LockIcon,
    PostIcon,
    SettingsIcon,
    SpacesIcon,
    SuccessIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function SpacePage(): JSX.Element {
    const {
        accountData,
        accountDataLoading,
        loggedIn,
        setPageBottomReached,
        setAlertMessage,
        setAlertModalOpen,
        setClaimAccountModalOpen,
    } = useContext(AccountContext)
    const {
        spaceData,
        getSpaceData,
        setSpaceData,
        resetSpaceData,
        isModerator,
        isFollowing,
        setIsFollowing,
        setSelectedSpaceSubPage,
    } = useContext(SpaceContext)
    const { id, handle, access } = spaceData
    const [headerCollapsed, setHeaderColapsed] = useState(false)
    const [accessRequestLoading, setAccessRequestLoading] = useState(false)
    const [followSpaceLoading, setFollowSpaceLoading] = useState(false)
    const [followingModalOpen, setFollowingModalOpen] = useState(false)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const awaitingSpaceData = spaceHandle !== handle
    const { clientWidth } = document.documentElement
    const mobileView = clientWidth < 900
    const tabletView = clientWidth >= 900 && clientWidth < 1200
    const cookies = new Cookies()
    const tabs = {
        baseRoute: `/s/${spaceHandle}`,
        left: [
            { text: 'About', visible: true, icon: <AboutIcon /> },
            { text: 'Posts', visible: true, icon: <PostIcon /> },
            { text: 'Spaces', visible: true, icon: <SpacesIcon /> },
            { text: 'People', visible: true, icon: <UsersIcon /> },
            { text: 'Calendar', visible: true, icon: <CalendarIcon /> },
            { text: 'Governance', visible: true, icon: <GovernanceIcon /> },
        ],
        right: [{ text: 'Settings', visible: isModerator, icon: <SettingsIcon /> }],
    }

    function requestAccess() {
        setAccessRequestLoading(true)
        const data = {
            accountHandle: accountData.handle,
            accountName: accountData.name,
            spaceId: id,
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/request-space-access`, data, options)
            .then(() => {
                setAccessRequestLoading(false)
                setSpaceData({ ...spaceData, access: 'pending' })
            })
            .catch((error) => console.log(error))
    }

    function toggleFollowing() {
        setFollowSpaceLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = { spaceId: id, isFollowing }
        axios
            .post(`${config.apiURL}/toggle-follow-space`, data, options)
            .then(() => {
                setFollowSpaceLoading(false)
                setIsFollowing(!isFollowing)
            })
            .catch((error) => console.log(error))
    }

    function followButtonClick() {
        if (isFollowing) setFollowingModalOpen(true)
        else toggleFollowing()
    }

    function renderAccessButton(): JSX.Element | null {
        if (loggedIn) {
            if (access !== 'granted') {
                // show access button
                let text = ''
                if (access === 'blocked') text = 'Request access' // allow click
                if (access === 'pending') text = 'Access requested' // disable click
                if (access === 'blocked-by-ancestor') text = 'Access blocked by a private ancestor' // disable click
                return (
                    <Button
                        icon={access === 'pending' ? <SuccessIcon /> : undefined}
                        text={text}
                        color='aqua'
                        loading={accessRequestLoading}
                        disabled={awaitingSpaceData || access !== 'blocked' || accessRequestLoading}
                        onClick={requestAccess}
                        style={{ marginRight: 10, marginTop: mobileView ? 5 : 0 }}
                    />
                )
            }
            if (spaceHandle !== 'all')
                // show following button
                return (
                    <Button
                        icon={isFollowing ? <SuccessIcon /> : undefined}
                        text={isFollowing ? 'Following' : 'Follow'}
                        color='blue'
                        loading={followSpaceLoading}
                        disabled={awaitingSpaceData || followSpaceLoading}
                        onClick={followButtonClick}
                        style={{ marginTop: mobileView ? 5 : 0 }}
                    />
                )
        }
        return null
    }

    // todo: use promises in space context to get space data first, then content?
    useEffect(() => {
        if (!accountDataLoading && awaitingSpaceData) getSpaceData(spaceHandle)
    }, [accountDataLoading, spaceHandle])

    useEffect(() => {
        if (!awaitingSpaceData) getSpaceData(spaceHandle)
    }, [loggedIn])

    useEffect(() => setSelectedSpaceSubPage(subpage), [location])

    useEffect(() => {
        // add scroll listener
        document.addEventListener('scroll', () => {
            setHeaderColapsed(window.pageYOffset > (mobileView ? 260 : 170))
            onPageBottomReached(setPageBottomReached)
        })
        // window.scrollTo(0, 300)
        // window.onunload = () => window.scrollTo(0, 300)
        return () => resetSpaceData()
    }, [])

    // handle invite token if present
    useEffect(() => {
        // problem: after log in, space data access not updated before token check...
        if (id) {
            const urlParams = Object.fromEntries(new URLSearchParams(location.search))
            const { inviteToken } = urlParams
            if (inviteToken && access !== 'granted') {
                if (loggedIn) {
                    const data = { spaceId: id, inviteToken }
                    const accessToken = cookies.get('accessToken')
                    const options = { headers: { Authorization: `Bearer ${accessToken}` } }
                    axios
                        .post(`${config.apiURL}/accept-space-invite-link`, data, options)
                        .then(() => setSpaceData({ ...spaceData, access: 'granted' }))
                        .catch((error) => {
                            console.log(error)
                            if (error.response && error.response.data.message === 'Invalid token') {
                                setAlertMessage('Invalid invite token')
                                setAlertModalOpen(true)
                            }
                        })
                } else {
                    setAlertMessage('Log in and refresh page to use this invite link')
                    setAlertModalOpen(true)
                }
            }
        }
    }, [id, access])

    // const wecoSpace =
    //     spaceData.id && (spaceData.id === 51 || spaceData.SpaceAncestors.find((a) => a.id === 51))

    // useEffect(() => {
    //     if (wecoSpace) {
    //         const texture = textures
    //             .paths()
    //             .d('hexagons')
    //             .size(10)
    //             .strokeWidth(0.2)
    //             .stroke('#d8eaf2')
    //         const svg = d3
    //             .select(`#space-background`)
    //             .append('svg')
    //             .attr('width', '100%')
    //             .attr('height', '100%')
    //         // add texture to defs
    //         svg.call(texture)
    //         // create background
    //         svg.append('rect')
    //             .attr('width', '100%')
    //             .attr('height', '100%')
    //             .style('fill', texture.url())
    //     } else {
    //         d3.select(`#space-background`).select('svg').remove()
    //     }
    // }, [spaceData.id])

    return (
        <Column centerX className={styles.wrapper}>
            {/* <div id='space-background' className={styles.background} /> */}
            <Column centerX className={`${styles.header} ${headerCollapsed && styles.collapsed}`}>
                <CoverImage type='space' image={spaceData.coverImagePath} canEdit={isModerator} />
                {awaitingSpaceData ? (
                    <Row centerY style={{ height: 53 }} />
                ) : (
                    <Row centerY className={styles.spaceData}>
                        <EditableFlagImage
                            type='space'
                            size={100}
                            imagePath={spaceData.flagImagePath}
                            canEdit={isModerator}
                            className={styles.flagImageLarge}
                        />
                        <Row centerY>
                            <Column className={styles.spaceName}>
                                <h1>{spaceData.name}</h1>
                                <p className='grey'>s/{spaceData.handle}</p>
                            </Column>
                            {!mobileView && renderAccessButton()}
                        </Row>
                    </Row>
                )}
                {mobileView && renderAccessButton()}
                <Row centerX className={styles.tabRow}>
                    <Row centerY className={styles.spaceDataSmall}>
                        <FlagImage
                            type='space'
                            imagePath={spaceData.flagImagePath}
                            size={30}
                            style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
                        />
                        {!tabletView && (
                            <Row centerY>
                                <p>{spaceData.name}</p>
                                <span>(s/{spaceData.handle})</span>
                            </Row>
                        )}
                    </Row>
                    <PageTabs tabs={tabs} />
                </Row>
            </Column>
            <Column centerX className={styles.content}>
                {spaceData.access === 'granted' ? (
                    <Routes>
                        <Route path='/' element={<Navigate to='posts' replace />} />
                        <Route path='about' element={<About />} />
                        <Route path='posts' element={<Posts />} />
                        <Route path='spaces' element={<Spaces />} />
                        <Route path='people' element={<People />} />
                        <Route path='calendar' element={<Calendar />} />
                        <Route path='rooms' element={<Rooms />} />
                        <Route path='governance' element={<Governance />} />
                        <Route path='settings' element={<Settings />} />
                        <Route element={<PageNotFound />} />
                    </Routes>
                ) : (
                    <Column centerX style={{ zIndex: 40 }}>
                        <Column className={styles.lockIcon}>
                            <LockIcon />
                        </Column>
                        <h2>This space is private</h2>
                        {loggedIn ? <p>Request access above</p> : <p>Log in to request access</p>}
                        {spaceHandle === 'the-metamodern-forum' && (
                            <Column centerX style={{ marginTop: 20, maxWidth: 400 }}>
                                <p style={{ textAlign: 'center', marginBottom: 20 }}>
                                    {loggedIn ? 'If' : 'Or if'} you previously had an account at{' '}
                                    <b>forum.metamoderna.org</b> you can reclaim it below:
                                </p>
                                <Button
                                    text='Reclaim account'
                                    color='blue'
                                    onClick={() => setClaimAccountModalOpen(true)}
                                />
                            </Column>
                        )}
                    </Column>
                )}
            </Column>
            {followingModalOpen && (
                <Modal centerX close={() => setFollowingModalOpen(false)}>
                    <h1>Are you sure you want to unfollow this space?</h1>
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

export default SpacePage
