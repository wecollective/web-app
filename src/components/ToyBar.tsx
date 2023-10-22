/* eslint-disable no-param-reassign */
import CircleButton from '@components/CircleButton'
import Row from '@components/Row'
import Tooltip from '@components/Tooltip'
import ToyBoxItem from '@components/cards/ToyBoxItem'
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
import {
    DeleteIcon,
    EyeIcon,
    InboxIcon,
    InfinityIcon,
    PlusIcon,
    PostIcon,
    SlidersIcon,
    SpacesIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function ToyBar(): JSX.Element {
    const {
        accountData,
        loggedIn,
        dragItem,
        dragItemRef,
        setDragItem,
        toyBoxItems,
        toyBoxItemsRef,
        setToyBoxItems,
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
    const [showDragItem, setShowDragItem] = useState(false)
    const droppingRef = useRef(false)
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

    useEffect(() => {
        const dropBox = document.getElementById('drop-box')
        let counter = 0 // used to avoid dragleave firing when hovering child elements
        let hoverIndex = toyBoxItemsRef.current.length // used to animate cards
        let dropIndex = toyBoxItemsRef.current.length // determines drop location
        if (dropBox) {
            dropBox.addEventListener('dragover', (e) => {
                e.preventDefault()
                const { x } = dropBox.getBoundingClientRect()
                const difference = e.clientX - x
                const hIndex = Math.floor((difference - 55) / 110)
                if (hoverIndex !== hIndex) {
                    hoverIndex = hIndex
                    // update item positions and drop index
                    const items = document.querySelectorAll(`.${styles.toyBoxItem}`)
                    items.forEach((item, i) => {
                        if (i < hIndex) item.classList.remove(styles.moveRight)
                        if (i === hIndex)
                            dropIndex = item.classList.contains(styles.moveRight) ? i : i + 1
                        if (i > hIndex) item.classList.add(styles.moveRight)
                    })
                    // handle edges
                    if (hIndex < 0) dropIndex = 0
                    if (hIndex === toyBoxItemsRef.current.length) dropIndex = hIndex
                }
            })
            dropBox.addEventListener('dragenter', () => {
                counter += 1
                // expand toybox
                dropBox.style.width = `${(toyBoxItemsRef.current.length + 1) * 110}px`
                // remove noTransform class from items
                const items = document.querySelectorAll(`.${styles.toyBoxItem}`)
                items.forEach((item) => item.classList.remove(styles.noTransition))
            })
            dropBox.addEventListener('dragleave', () => {
                counter -= 1
                if (counter === 0) {
                    // shrink toybox
                    dropBox.style.width = `${toyBoxItemsRef.current.length * 110}px`
                    // reset item positions
                    const items = document.querySelectorAll(`.${styles.toyBoxItem}`)
                    items.forEach((item) => item.classList.remove(styles.moveRight))
                    // reset indexes
                    hoverIndex = toyBoxItemsRef.current.length
                    dropIndex = toyBoxItemsRef.current.length
                }
            })
            dropBox.addEventListener('drop', () => {
                console.log('dropIndex: ', dropIndex)
                counter = 0
                // remove animation and reposition items
                const items = document.querySelectorAll(`.${styles.toyBoxItem}`)
                items.forEach((item) => {
                    item.classList.add(styles.noTransition)
                    item.classList.remove(styles.moveRight)
                })
                // add new item
                let newItems = [...toyBoxItemsRef.current]
                const { type, data, fromToyBox } = dragItemRef.current
                if (fromToyBox) {
                    const oldItem = newItems.find((i) => i.type === type && i.data.id === data.id)
                    oldItem.type = 'removed'
                }
                newItems.splice(dropIndex, 0, dragItemRef.current)
                setToyBoxItems(newItems)
                toyBoxItemsRef.current = newItems
                if (fromToyBox) {
                    setTimeout(() => {
                        const oldItem = document.getElementById(`removed-${data.id}`)
                        if (oldItem) {
                            oldItem.classList.add(styles.opacity)
                            oldItem.classList.remove(styles.noTransition)
                            oldItem.classList.add(styles.removing)
                            dropBox.style.width = `${(newItems.length - 1) * 110}px`
                        }
                        setTimeout(() => {
                            newItems = newItems.filter((i) => i.type !== 'removed')
                            setToyBoxItems(newItems)
                            toyBoxItemsRef.current = newItems
                        }, 300)
                    }, 100)
                }
                // reset indexes
                hoverIndex = toyBoxItemsRef.current.length
                dropIndex = toyBoxItemsRef.current.length
                // re-add animation
                setTimeout(
                    () => items.forEach((item) => item.classList.remove(styles.noTransition)),
                    300
                )
            })
        }
    }, [])

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
                {/* {loggedIn && (
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
                )} */}
                {renderFilters()}
                {renderLenses()}
                {/* <CircleButton
                    size={buttonSize}
                    icon={<HelpIcon />}
                    onClick={() => setHelpModalOpen(true)}
                /> */}
                <Row id='drop-box' className={styles.toyBox}>
                    {toyBoxItems.length < 1 && (
                        <div className={styles.button} style={{ marginRight: 10 }}>
                            <InboxIcon />
                        </div>
                    )}
                    {toyBoxItems.map((item) => (
                        <ToyBoxItem
                            key={`${item.type}-${item.data.id}`}
                            // key={uuidv4()}
                            className={styles.toyBoxItem}
                            type={item.type}
                            data={item.data}
                        />
                    ))}
                </Row>
                <div className={styles.button}>
                    <DeleteIcon />
                </div>
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
