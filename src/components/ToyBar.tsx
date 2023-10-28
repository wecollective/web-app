/* eslint-disable no-param-reassign */
import CircleButton from '@components/CircleButton'
import Column from '@components/Column'
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
import TBIstyles from '@styles/components/cards/ToyBoxItem.module.scss'
import {
    ChevronDownIcon,
    ChevronUpIcon,
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
        dragItemRef,
        toyboxRow,
        setToyBoxRow,
        toyboxItems,
        setToyBoxItems,
        toyboxItemsRef,
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
    const toyboxRowRef = useRef(0)
    const droppingRef = useRef(false)
    const cookies = new Cookies()
    const location = useLocation()
    const path = location.pathname.split('/')
    const page = path[1]
    const subpage = path[3]
    const mobileView = document.documentElement.clientWidth < 900
    const buttonSize = mobileView ? 36 : 46
    const animationSpeed = 500

    // function getToyBarData() {
    //     const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
    //     axios
    //         .get(`${config.apiURL}/toybar-data`, options)
    //         .then((res) => {
    //             setStreams(res.data.streams)
    //             setFollowedSpaces(res.data.spaces)
    //             setFollowedUsers(res.data.users)
    //         })
    //         .catch((error) => console.log(error))
    // }

    function getToyBoxItems() {
        // fade out old items
        const items = document.querySelectorAll(`.${TBIstyles.wrapper}`)
        items.forEach((item) => item.classList.add(TBIstyles.fadeUp))
        setTimeout(() => {
            // get new items
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .get(`${config.apiURL}/toybox-items?row=${toyboxRow}`, options)
                .then((res) => {
                    // update toybox width
                    const toybox = document.getElementById('toybox')
                    toybox!.style.width = `${res.data.length ? res.data.length * 110 : 110}px`
                    setTimeout(() => {
                        toyboxItemsRef.current = res.data
                        Promise.all([setToyBoxItems(res.data)]).then(() => {
                            items.forEach((item) => {
                                item.classList.add(TBIstyles.noTransition)
                                item.classList.add(TBIstyles.fade)
                            })
                            items.forEach((item) => {
                                item.classList.remove(TBIstyles.noTransition)
                                item.classList.remove(TBIstyles.fade)
                            })
                        })
                    }, animationSpeed)
                })
                .catch((error) => console.log(error))
        }, animationSpeed)
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

    function isMatch(item) {
        // checks if toybox item matches drag item
        const { type, data } = dragItemRef.current
        return item.type === type && item.data.id === data.id
    }

    function addToyBoxItem(index) {
        const { type, data: item } = dragItemRef.current
        const data = { row: toyboxRowRef.current, index, itemType: type, itemId: item.id }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/add-toybox-item`, data, options)
            .catch((error) => console.log(error))
    }

    function moveToyBoxItem(oldIndex, newIndex) {
        const data = { row: toyboxRowRef.current, oldIndex, newIndex }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/move-toybox-item`, data, options)
            .catch((error) => console.log(error))
    }

    function deleteToyBoxItem(index) {
        const data = { row: toyboxRowRef.current, index }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/delete-toybox-item`, data, options)
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        toyboxRowRef.current = toyboxRow
        if (accountData.id) getToyBoxItems()
    }, [accountData.id, toyboxRow])

    useEffect(() => {
        const toybox = document.getElementById('toybox')
        const trash = document.getElementById('trash')
        let dragLeaveCounter = 0 // used to avoid dragleave firing when hovering child elements
        let hoverIndex = toyboxItemsRef.current.length // used to animate cards
        let dropIndex = toyboxItemsRef.current.length // determines drop location
        if (toybox && trash) {
            toybox.addEventListener('dragover', (e) => {
                e.preventDefault()
                const { x } = toybox.getBoundingClientRect()
                const difference = e.clientX - x
                const hIndex = Math.floor((difference - 55) / 110)
                // if new hover index, reposition cards and update drop index
                if (hoverIndex !== hIndex) {
                    hoverIndex = hIndex
                    // expand toybox
                    toybox.style.width = `${(toyboxItemsRef.current.length + 1) * 110}px`
                    // update item positions and drop index
                    const items = document.querySelectorAll(`.${TBIstyles.wrapper}`)
                    items.forEach((item, i) => {
                        if (i < hIndex) item.classList.remove(TBIstyles.moveRight)
                        if (i === hIndex)
                            dropIndex = item.classList.contains(TBIstyles.moveRight) ? i : i + 1
                        if (i > hIndex) item.classList.add(TBIstyles.moveRight)
                    })
                    // handle edges
                    if (hIndex < 0) dropIndex = 0
                    if (hIndex === toyboxItemsRef.current.length) dropIndex = hIndex
                }
            })
            toybox.addEventListener('dragenter', () => {
                dragLeaveCounter += 1
                if (dragLeaveCounter === 1) {
                    const { type, data, fromToyBox } = dragItemRef.current
                    const items = document.querySelectorAll(`.${TBIstyles.wrapper}`)
                    items.forEach((item) => item.classList.remove(TBIstyles.noTransition))
                    // highlight match if present
                    const match = !fromToyBox && document.getElementById(`tbi-${type}-${data.id}`)
                    if (match) match.classList.add(TBIstyles.highlighted)
                }
            })
            toybox.addEventListener('dragleave', () => {
                dragLeaveCounter -= 1
                if (dragLeaveCounter === 0) {
                    // shrink toybox
                    const totalItems = toyboxItemsRef.current.length
                    toybox.style.width = totalItems ? `${totalItems * 110}px` : '110px'
                    // reset item positions
                    const items = document.querySelectorAll(`.${TBIstyles.wrapper}`)
                    items.forEach((item) => item.classList.remove(TBIstyles.moveRight))
                    // remove highlighted match if present
                    const { type, data, fromToyBox } = dragItemRef.current
                    const match = !fromToyBox && document.getElementById(`tbi-${type}-${data.id}`)
                    if (match) match.classList.remove(TBIstyles.highlighted)
                    // reset indexes
                    hoverIndex = toyboxItemsRef.current.length
                    dropIndex = toyboxItemsRef.current.length
                }
            })
            toybox.addEventListener('drop', () => {
                dragLeaveCounter = 0
                const { type, data, fromToyBox } = dragItemRef.current
                const duplicate =
                    !fromToyBox && toyboxItemsRef.current.find((item) => isMatch(item))
                const items = document.querySelectorAll(`.${TBIstyles.wrapper}`)
                if (duplicate) {
                    // reset item positions
                    items.forEach((item) => item.classList.remove(TBIstyles.moveRight))
                    toybox.style.width = `${toyboxItemsRef.current.length * 110}px`
                    // fade out match
                    const match = document.getElementById(`tbi-${type}-${data.id}`)
                    if (match) match.classList.remove(TBIstyles.highlighted)
                } else {
                    // update items array
                    let newItems = JSON.parse(JSON.stringify(toyboxItemsRef.current))
                    if (fromToyBox) {
                        // save new item positions
                        const oldIndex = newItems.findIndex((item) => isMatch(item))
                        const newIndex = dropIndex > oldIndex ? dropIndex - 1 : dropIndex
                        if (newIndex !== oldIndex) moveToyBoxItem(oldIndex, newIndex)
                        // mark old item for removal after transition
                        const oldItem = newItems.find((item) => isMatch(item))
                        oldItem.data.id = 'removed'
                    } else {
                        // save new item
                        addToyBoxItem(dropIndex)
                    }
                    newItems.splice(dropIndex, 0, dragItemRef.current)
                    // add new item
                    toyboxItemsRef.current = newItems
                    Promise.all([setToyBoxItems(newItems)]).then(() => {
                        // reset indexes
                        hoverIndex = newItems.length
                        dropIndex = newItems.length
                        // remove animation and reposition items
                        items.forEach((item) => {
                            item.classList.add(TBIstyles.noTransition)
                            item.classList.remove(TBIstyles.moveRight)
                        })
                        if (fromToyBox) {
                            // transition out old item
                            const oldItem = document.getElementById(`tbi-${type}-removed`)
                            if (oldItem) {
                                oldItem.classList.add(TBIstyles.removing)
                                toybox.style.width = `${(newItems.length - 1) * 110}px`
                            }
                            // remove old item
                            setTimeout(() => {
                                newItems = newItems.filter((i) => i.data.id !== 'removed')
                                setToyBoxItems(newItems)
                                toyboxItemsRef.current = newItems
                            }, animationSpeed)
                        }
                    })
                }
            })
            // trash
            trash.addEventListener('dragover', (e) => e.preventDefault())
            trash.addEventListener('dragenter', () => {
                const { fromToyBox } = dragItemRef.current
                if (fromToyBox) trash.classList.add(styles.hover)
            })
            trash.addEventListener('dragleave', () => {
                trash.classList.remove(styles.hover)
            })
            trash.addEventListener('drop', () => {
                trash.classList.remove(styles.hover)
                const { type, data, fromToyBox } = dragItemRef.current
                if (fromToyBox) {
                    // save deleted item
                    const itemIndex = toyboxItemsRef.current.findIndex((item) => isMatch(item))
                    deleteToyBoxItem(itemIndex)
                    // update UI
                    const oldItem = document.getElementById(`tbi-${type}-${data.id}`)
                    const newItems = toyboxItemsRef.current.filter((item) => !isMatch(item))
                    if (newItems.length) {
                        oldItem?.classList.add(TBIstyles.removing)
                        toybox.style.width = `${(toyboxItemsRef.current.length - 1) * 110}px`
                        setTimeout(() => {
                            setToyBoxItems(newItems)
                            toyboxItemsRef.current = newItems
                        }, animationSpeed)
                    } else {
                        setToyBoxItems(newItems)
                        toyboxItemsRef.current = newItems
                    }
                }
            })
        }
    }, [])

    useEffect(() => {
        if (!toyboxItems.length) {
            // set up inbox event listeners
            const inbox = document.getElementById('inbox')
            inbox?.addEventListener('dragover', (e) => e.preventDefault())
            inbox?.addEventListener('dragenter', () => {
                inbox?.classList.add(styles.hover)
            })
            inbox?.addEventListener('dragleave', () => {
                inbox?.classList.remove(styles.hover)
            })
        }
    }, [toyboxItems])

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
                <Column centerX className={styles.toyboxRows}>
                    <button
                        type='button'
                        onClick={() => setToyBoxRow(toyboxRow - 1)}
                        disabled={toyboxRow === 0}
                    >
                        <ChevronUpIcon />
                    </button>
                    {toyboxRow + 1}
                    <button type='button' onClick={() => setToyBoxRow(toyboxRow + 1)}>
                        <ChevronDownIcon />
                    </button>
                </Column>
                <Row id='toybox' className={styles.toybox}>
                    {toyboxItems.length < 1 && (
                        <div id='inbox' className={styles.button} style={{ marginRight: 10 }}>
                            <InboxIcon />
                        </div>
                    )}
                    {toyboxItems.map((item) => (
                        <ToyBoxItem
                            key={`${item.type}-${item.data.id}`}
                            // key={uuidv4()}
                            className={`${TBIstyles.wrapper} ${
                                item.data.id === 'removed' && TBIstyles.dragging
                            }`}
                            type={item.type}
                            data={item.data}
                        />
                    ))}
                </Row>
                <div id='trash' className={styles.button}>
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
