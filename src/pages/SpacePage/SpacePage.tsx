/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import Column from '@components/Column'
import CoverImage from '@components/CoverImage'
import EditableFlagImage from '@components/EditableFlagImage'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import PageTabs from '@components/PageTabs'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import PageNotFound from '@pages/PageNotFound'
import Settings from '@pages/SpacePage/Settings'
import FlagImage from '@src/components/FlagImage'
import SuccessMessage from '@src/components/SuccessMessage'
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
    PostIcon,
    SettingsIcon,
    SpacesIcon,
    SuccessIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import textures from 'textures'
import Cookies from 'universal-cookie'

const SpacePage = (): JSX.Element => {
    const {
        accountData,
        accountDataLoading,
        updateAccountData,
        loggedIn,
        setPageBottomReached,
        setAlertMessage,
        setAlertModalOpen,
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
    const [headerCollapsed, setHeaderColapsed] = useState(false)
    const [accessRequestLoading, setAccessRequestLoading] = useState(false)
    const [followSpaceLoading, setFollowSpaceLoading] = useState(false)
    const [followingModalOpen, setFollowingModalOpen] = useState(false)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const awaitingSpaceData = spaceHandle !== spaceData.handle
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

    type errorState = 'default' | 'valid' | 'invalid'

    const [mmEmail, setMMEmail] = useState('')
    const [mmEmailState, setMMEmailState] = useState<errorState>('default')
    const [mmEmailErrors, setMMEmailErrors] = useState<string[]>([])
    const [mmPassword, setMMPassword] = useState('')
    const [mmPasswordState, setMMPasswordState] = useState<errorState>('default')
    const [mmPasswordErrors, setMMPasswordErrors] = useState<string[]>([])
    const [mmPassword2, setMMPassword2] = useState('')
    const [mmPassword2State, setMMPassword2State] = useState<errorState>('default')
    const [mmPassword2Errors, setMMPassword2Errors] = useState<string[]>([])
    const [mmLoading, setMMLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    function showAccessButton() {
        return (
            loggedIn &&
            spaceData.privacy === 'private' &&
            ['blocked', 'pending'].includes(spaceData.access)
        )
    }

    function findAccessIcon() {
        if (spaceData.access === 'pending') return <SuccessIcon />
        return undefined
    }

    function findAccessText() {
        if (spaceData.access === 'pending') return 'Access requested'
        if (spaceData.access === 'blocked') return 'Request access'
        return ''
    }

    function requestAccess() {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again.')
            setAlertModalOpen(true)
        } else {
            setAccessRequestLoading(true)
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                spaceId: spaceData.id,
            }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/request-space-access`, data, options)
                .then(() => {
                    setAccessRequestLoading(false)
                    setSpaceData({ ...spaceData, access: 'pending' })
                })
                .catch((error) => console.log(error))
        }
    }

    function showFollowingButton() {
        return loggedIn && spaceData.access === 'granted' && spaceHandle !== 'all'
    }

    function toggleFollowing() {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again.')
            setAlertModalOpen(true)
        } else {
            setFollowSpaceLoading(true)
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = { spaceId: spaceData.id, isFollowing }
            axios
                .post(`${config.apiURL}/toggle-follow-space`, data, options)
                .then(() => {
                    setFollowSpaceLoading(false)
                    setIsFollowing(!isFollowing)
                })
                .catch((error) => console.log(error))
        }
    }

    function followButtonClick() {
        if (isFollowing) setFollowingModalOpen(true)
        else toggleFollowing()
    }

    function verifyEmail() {
        setMMLoading(true)
        setMMEmailState(mmEmail ? 'valid' : 'invalid')
        setMMEmailErrors(mmEmail ? [] : ['Required'])
        setMMPasswordState(mmPassword ? 'valid' : 'invalid')
        setMMPasswordErrors(mmPassword ? [] : ['Required'])
        setMMPassword2State(mmPassword2 && mmPassword2 === mmPassword ? 'valid' : 'invalid')
        setMMPassword2Errors(
            mmPassword2 && mmPassword2 === mmPassword ? [] : ['Must match new password']
        )
        if (mmEmail && mmPassword && mmPassword2 === mmPassword) {
            axios
                .post(`${config.apiURL}/verfiy-mm-email`, { mmEmail, mmPassword })
                .then(() => {
                    setSuccess(true)
                    setMMLoading(false)
                })
                .catch((error) => {
                    const { message } = error.response.data
                    setMMEmailState('invalid')
                    setMMEmailErrors([message])
                    setMMLoading(false)
                })
        } else setMMLoading(false)
    }

    // todo: use promises in space context to get space data first, then content?
    useEffect(() => {
        if (!accountDataLoading && awaitingSpaceData) getSpaceData(spaceHandle)
    }, [accountDataLoading, spaceHandle])

    useEffect(() => {
        if (!awaitingSpaceData) getSpaceData(spaceHandle)
    }, [loggedIn])

    useEffect(() => setSelectedSpaceSubPage(subpage), [location])

    // todo: combine with reset space data
    useEffect(() => {
        document.addEventListener('scroll', () => {
            setHeaderColapsed(window.pageYOffset > (mobileView ? 260 : 290))
            onPageBottomReached(setPageBottomReached)
        })
        // window.scrollTo(0, 300)
        // window.onunload = () => window.scrollTo(0, 300)
    }, [])

    useEffect(() => () => resetSpaceData(), [])

    const wecoSpace =
        spaceData.id && (spaceData.id === 51 || spaceData.SpaceAncestors.find((a) => a.id === 51))

    useEffect(() => {
        if (wecoSpace) {
            const texture = textures
                .paths()
                .d('hexagons')
                .size(10)
                .strokeWidth(0.2)
                .stroke('#d8eaf2')
            const svg = d3
                .select(`#space-background`)
                .append('svg')
                .attr('width', '100%')
                .attr('height', '100%')
            // add texture to defs
            svg.call(texture)
            // create background
            svg.append('rect')
                .attr('width', '100%')
                .attr('height', '100%')
                .style('fill', texture.url())
        } else {
            d3.select(`#space-background`).select('svg').remove()
        }
    }, [spaceData.id])

    return (
        <Column centerX className={styles.wrapper}>
            <div id='space-background' className={styles.background} />
            <Column centerX className={`${styles.header} ${headerCollapsed && styles.collapsed}`}>
                <CoverImage type='space' image={spaceData.coverImagePath} canEdit={isModerator} />
                {awaitingSpaceData ? (
                    <Row centerY style={{ height: 72 }} />
                ) : (
                    <Row centerY className={styles.spaceData}>
                        <EditableFlagImage
                            type='space'
                            size={120}
                            imagePath={spaceData.flagImagePath}
                            canEdit={isModerator}
                            className={styles.flagImageLarge}
                        />
                        <Row centerY style={{ height: 50 }}>
                            <Column className={styles.spaceName}>
                                <h1>{spaceData.name}</h1>
                                <p className='grey'>s/{spaceData.handle}</p>
                            </Column>
                            {showAccessButton() && (
                                <Button
                                    icon={findAccessIcon()}
                                    text={findAccessText()}
                                    color='aqua'
                                    loading={accessRequestLoading}
                                    disabled={
                                        awaitingSpaceData ||
                                        spaceData.access === 'pending' ||
                                        accessRequestLoading
                                    }
                                    onClick={requestAccess}
                                    style={{ marginRight: 10 }}
                                />
                            )}
                            {showFollowingButton() && (
                                <Button
                                    icon={isFollowing ? <SuccessIcon /> : undefined}
                                    text={isFollowing ? 'Following' : 'Follow'}
                                    color='blue'
                                    loading={followSpaceLoading}
                                    disabled={awaitingSpaceData || followSpaceLoading}
                                    onClick={followButtonClick}
                                />
                            )}
                        </Row>
                    </Row>
                )}
                <Row centerX className={styles.tabRow}>
                    <Row centerY className={styles.spaceDataSmall}>
                        <FlagImage
                            type='space'
                            imagePath={spaceData.flagImagePath}
                            size={32}
                            shadow
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
                    <Switch>
                        <Redirect from='/s/:spaceHandle/' to='/s/:spaceHandle/posts' exact />
                        <Route path='/s/:spaceHandle/about' component={About} exact />
                        <Route path='/s/:spaceHandle/posts' component={Posts} exact />
                        <Route path='/s/:spaceHandle/spaces' component={Spaces} exact />
                        <Route path='/s/:spaceHandle/people' component={People} exact />
                        <Route path='/s/:spaceHandle/calendar' component={Calendar} exact />
                        <Route path='/s/:spaceHandle/rooms' component={Rooms} exact />
                        <Route path='/s/:spaceHandle/governance' component={Governance} exact />
                        <Route path='/s/:spaceHandle/settings' component={Settings} exact />
                        <Route component={PageNotFound} />
                    </Switch>
                ) : (
                    <Column centerX style={{ zIndex: 40 }}>
                        <h2>Access blocked!</h2>
                        {!loggedIn && <p>Log in to request access</p>}
                        {spaceHandle === 'the-metamodern-forum' && (
                            <Column centerX style={{ marginTop: 20, maxWidth: 500 }}>
                                <p style={{ marginBottom: 20 }}>
                                    {loggedIn ? 'If' : 'Or if'} you previously had an account at{' '}
                                    <b>forum.metamoderna.org</b> you can reclaim it using your old
                                    metamodern forum email below:
                                </p>
                                <Input
                                    title='Old metamodern forum email'
                                    type='email'
                                    style={{ marginBottom: 10 }}
                                    disabled={mmLoading}
                                    state={mmEmailState}
                                    errors={mmEmailErrors}
                                    value={mmEmail}
                                    onChange={(v) => {
                                        setMMEmail(v)
                                        setMMEmailState('default')
                                        setMMEmailErrors([])
                                    }}
                                />
                                <Input
                                    title='New password'
                                    type='password'
                                    style={{ marginBottom: 10 }}
                                    disabled={mmLoading}
                                    state={mmPasswordState}
                                    errors={mmPasswordErrors}
                                    value={mmPassword}
                                    onChange={(v) => {
                                        setMMPassword(v)
                                        setMMPasswordState('default')
                                        setMMPasswordErrors([])
                                    }}
                                />
                                <Input
                                    title='Confirm new password'
                                    type='password'
                                    style={{ marginBottom: 20 }}
                                    disabled={mmLoading}
                                    state={mmPassword2State}
                                    errors={mmPassword2Errors}
                                    value={mmPassword2}
                                    onChange={(v) => {
                                        setMMPassword2(v)
                                        setMMPassword2State('default')
                                        setMMPassword2Errors([])
                                    }}
                                />
                                <Button
                                    text='Send verification email'
                                    color='blue'
                                    disabled={mmLoading}
                                    loading={mmLoading}
                                    onClick={verifyEmail}
                                    style={{ marginBottom: 20 }}
                                />
                                {success && (
                                    <SuccessMessage
                                        text={`Success! We've sent you a verification email. Follow the instructions there to reclaim your account.`}
                                    />
                                )}
                            </Column>
                        )}
                    </Column>
                )}
            </Column>
            {followingModalOpen && (
                <Modal centered close={() => setFollowingModalOpen(false)}>
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
