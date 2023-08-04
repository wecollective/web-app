import CircleButton from '@components/CircleButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import TextLink from '@components/TextLink'
import Tooltip from '@components/Tooltip'
import GlobalHelpModal from '@components/modals/GlobalHelpModal'
import SpacePeopleFilters from '@components/modals/SpacePeopleFilters'
import SpacePostFilters from '@components/modals/SpacePostFilters'
import SpacePostLenses from '@components/modals/SpacePostLenses'
import SpaceSpaceFilters from '@components/modals/SpaceSpaceFilters'
import SpaceSpaceLenses from '@components/modals/SpaceSpaceLenses'
import UserPostFilters from '@components/modals/UserPostFilters'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { capitalise, trimText } from '@src/Helpers'
import styles from '@styles/components/ToyBar.module.scss'
import {
    EyeIcon,
    HelpIcon,
    InfinityIcon,
    PlusIcon,
    PostIcon,
    SlidersIcon,
    SpacesIcon,
    StreamIcon,
    UserIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function ToyBar(): JSX.Element {
    const {
        accountData,
        loggedIn,
        setAlertModalOpen,
        setAlertMessage,
        setCreatePostModalOpen,
        setCreateSpaceModalOpen,
    } = useContext(AccountContext)
    const [streams, setStreams] = useState<any[]>([])
    const [followedSpaces, setFollowedSpaces] = useState<any[]>([])
    const [followedUsers, setFollowedUsers] = useState<any[]>([])
    const [spacePostFiltersOpen, setSpacePostFiltersOpen] = useState(false)
    const [spacePostLensesOpen, setSpacePostLensesOpen] = useState(false)
    const [spaceSpaceFiltersOpen, setSpaceSpaceFiltersOpen] = useState(false)
    const [spaceSpaceLensesOpen, setSpaceSpaceLensesOpen] = useState(false)
    const [spacePeopleFiltersOpen, setSpacePeopleFiltersOpen] = useState(false)
    const [userPostFiltersOpen, setUserPostFiltersOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const cookies = new Cookies()
    const location = useLocation()
    const path = location.pathname.split('/')
    const page = path[1]
    const subpage = path[3]
    const mobileView = document.documentElement.clientWidth < 900
    const buttonSize = mobileView ? 36 : 46

    function getToyBarData() {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/toybar-data`, options)
            .then((res) => {
                setStreams(res.data.streams)
                setFollowedSpaces(res.data.spaces)
                setFollowedUsers(res.data.users)
            })
            .catch((error) => console.log(error))
    }

    function findStreamIcon(type: string) {
        if (type === 'all') return <InfinityIcon />
        if (type === 'spaces') return <SpacesIcon />
        if (type === 'people') return <UsersIcon />
        return null
    }

    function newPost(e) {
        e.stopPropagation()
        if (loggedIn) setCreatePostModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a post')
        }
    }

    function newSpace(e) {
        e.stopPropagation()
        if (loggedIn) setCreateSpaceModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a space')
        }
    }

    function renderFilters() {
        let openModal
        if (page === 's') {
            if (subpage === 'posts') openModal = setSpacePostFiltersOpen
            if (subpage === 'spaces') openModal = setSpaceSpaceFiltersOpen
            if (subpage === 'people') openModal = setSpacePeopleFiltersOpen
        }
        if (page === 'u' && subpage === 'posts') openModal = setUserPostFiltersOpen
        if (openModal) {
            return (
                <CircleButton
                    size={buttonSize}
                    icon={<SlidersIcon />}
                    onClick={() => openModal(true)}
                    style={{ marginRight: 10 }}
                />
            )
        }
        return null
    }

    function renderLenses() {
        let openModal
        if (page === 's') {
            if (subpage === 'posts') openModal = setSpacePostLensesOpen
            if (subpage === 'spaces') openModal = setSpaceSpaceLensesOpen
        }
        if (openModal) {
            return (
                <CircleButton
                    size={buttonSize}
                    icon={<EyeIcon />}
                    onClick={() => openModal(true)}
                    style={{ marginRight: 10 }}
                />
            )
        }
        return null
    }

    useEffect(() => {
        if (accountData.id) getToyBarData()
    }, [accountData.id])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Row centerY centerX className={styles.container}>
                <CircleButton size={buttonSize} icon={<PlusIcon />} style={{ marginRight: 10 }}>
                    <Tooltip centered top={40} width={150} className={styles.newButtons}>
                        <button type='button' onClick={newSpace}>
                            <SpacesIcon />
                            New space
                        </button>
                        <button type='button' onClick={newPost}>
                            <PostIcon />
                            New post
                        </button>
                    </Tooltip>
                </CircleButton>
                {loggedIn && (
                    <CircleButton
                        size={buttonSize}
                        icon={<StreamIcon />}
                        style={{ marginRight: 10 }}
                    >
                        <Tooltip top={40} width={250} centered>
                            <p className='grey' style={{ marginBottom: 10, fontSize: 14 }}>
                                Your Streams
                            </p>
                            {['all', 'spaces', 'people'].map((type) => (
                                <Link
                                    key={type}
                                    to={`/u/${accountData.handle}/streams/${type}`}
                                    className={styles.streamButton}
                                >
                                    <Column centerY centerX>
                                        {findStreamIcon(type)}
                                    </Column>
                                    <p>{capitalise(type)}</p>
                                </Link>
                            ))}
                            {streams.map((stream) => (
                                <ImageTitle
                                    key={stream.id}
                                    type='stream'
                                    imagePath={stream.image}
                                    imageSize={35}
                                    title={trimText(stream.name, 23)}
                                    link={`/u/${accountData.handle}/streams/custom?id=${stream.id}`}
                                    fontSize={14}
                                    style={{ marginBottom: 8 }}
                                />
                            ))}
                        </Tooltip>
                    </CircleButton>
                )}
                {loggedIn && (
                    <CircleButton
                        size={buttonSize}
                        icon={<SpacesIcon />}
                        style={{ marginRight: 10 }}
                    >
                        <Tooltip top={40} width={250} centered>
                            {followedSpaces.length ? (
                                <>
                                    <p className='grey' style={{ marginBottom: 10, fontSize: 14 }}>
                                        Followed Spaces
                                    </p>
                                    {followedSpaces.map((space) => (
                                        <ImageTitle
                                            key={space.id}
                                            type='space'
                                            imagePath={space.flagImagePath}
                                            imageSize={35}
                                            title={trimText(space.name, 23)}
                                            link={`/s/${space.handle}/posts`}
                                            fontSize={14}
                                            style={{ marginBottom: 8 }}
                                        />
                                    ))}
                                    <TextLink
                                        text='See all'
                                        link={`/u/${accountData.handle}/following/spaces`}
                                    />
                                </>
                            ) : (
                                <p style={{ fontSize: 14 }}>No followed spaces...</p>
                            )}
                        </Tooltip>
                    </CircleButton>
                )}
                {loggedIn && (
                    <CircleButton size={buttonSize} icon={<UserIcon />} style={{ marginRight: 10 }}>
                        <Tooltip top={40} width={250} centered>
                            {followedUsers.length ? (
                                <>
                                    <p className='grey' style={{ marginBottom: 10, fontSize: 14 }}>
                                        Followed Users
                                    </p>
                                    {followedUsers.map((user) => (
                                        <ImageTitle
                                            key={user.id}
                                            type='user'
                                            imagePath={user.flagImagePath}
                                            imageSize={35}
                                            title={trimText(user.name, 23)}
                                            link={`/u/${user.handle}/posts`}
                                            fontSize={14}
                                            style={{ marginBottom: 8 }}
                                        />
                                    ))}
                                    <TextLink
                                        text='See all'
                                        link={`/u/${accountData.handle}/following/people`}
                                    />
                                </>
                            ) : (
                                <p style={{ fontSize: 14 }}>No followed users...</p>
                            )}
                        </Tooltip>
                    </CircleButton>
                )}
                {renderFilters()}
                {renderLenses()}
                <CircleButton
                    size={buttonSize}
                    icon={<HelpIcon />}
                    onClick={() => setHelpModalOpen(true)}
                />
                {spacePostFiltersOpen && (
                    <SpacePostFilters close={() => setSpacePostFiltersOpen(false)} />
                )}
                {spacePostLensesOpen && (
                    <SpacePostLenses close={() => setSpacePostLensesOpen(false)} />
                )}
                {spaceSpaceFiltersOpen && (
                    <SpaceSpaceFilters close={() => setSpaceSpaceFiltersOpen(false)} />
                )}
                {spaceSpaceLensesOpen && (
                    <SpaceSpaceLenses close={() => setSpaceSpaceLensesOpen(false)} />
                )}
                {spacePeopleFiltersOpen && (
                    <SpacePeopleFilters close={() => setSpacePeopleFiltersOpen(false)} />
                )}
                {userPostFiltersOpen && (
                    <UserPostFilters close={() => setUserPostFiltersOpen(false)} />
                )}
                {helpModalOpen && <GlobalHelpModal close={() => setHelpModalOpen(false)} />}
            </Row>
        </Row>
    )
}

export default ToyBar
