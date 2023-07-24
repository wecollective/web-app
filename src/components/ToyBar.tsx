import CircleButton from '@components/CircleButton'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
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
import styles from '@styles/components/ToyBar.module.scss'
import { EyeIcon, HelpIcon, PlusIcon, PostIcon, SlidersIcon, SpacesIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
    const [followedSpaces, setFollowedSpaces] = useState<any[]>([])
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

    function getFollowedSpaces() {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/followed-spaces`, options)
            .then((res) => setFollowedSpaces(res.data))
            .catch((error) => console.log(error))
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
                    color='yellow'
                    size={45}
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
                    color='orange'
                    size={45}
                    icon={<EyeIcon />}
                    onClick={() => openModal(true)}
                    style={{ marginRight: 10 }}
                />
            )
        }
        return null
    }

    useEffect(() => {
        if (accountData.id) getFollowedSpaces()
    }, [accountData.id])

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Row centerY centerX className={styles.container}>
                <CircleButton
                    color='blue'
                    size={46}
                    icon={<PlusIcon />}
                    style={{ marginRight: 10 }}
                >
                    <Tooltip centered top={40} width={150} className={styles.newButtons}>
                        <button type='button' onClick={newPost}>
                            <PostIcon />
                            New post
                        </button>
                        <button type='button' onClick={newSpace}>
                            <SpacesIcon />
                            New space
                        </button>
                    </Tooltip>
                </CircleButton>
                {loggedIn && (
                    <CircleButton
                        color='green'
                        size={46}
                        icon={<SpacesIcon />}
                        style={{ marginRight: 10 }}
                    >
                        <Tooltip top={40} width={200} centered>
                            {followedSpaces.length ? (
                                <>
                                    <p className='grey' style={{ marginBottom: 10, fontSize: 14 }}>
                                        Followed spaces
                                    </p>
                                    {followedSpaces.map((space) => (
                                        <ImageTitle
                                            key={space.id}
                                            type='space'
                                            imagePath={space.flagImagePath}
                                            imageSize={35}
                                            title={space.name}
                                            link={`/s/${space.handle}/posts`}
                                            fontSize={14}
                                            style={{ marginBottom: 5 }}
                                        />
                                    ))}
                                </>
                            ) : (
                                <p style={{ fontSize: 14 }}>No followed spaces...</p>
                            )}
                            {/* <p>See all</p> */}
                        </Tooltip>
                    </CircleButton>
                )}
                {renderFilters()}
                {renderLenses()}
                <CircleButton
                    color='red'
                    size={45}
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
