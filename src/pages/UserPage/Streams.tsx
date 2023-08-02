import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import PostList from '@components/PostList'
import Row from '@components/Row'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import { capitalise, trimText } from '@src/Helpers'
import LoadingWheel from '@src/components/LoadingWheel'
import CreateStreamModal from '@src/components/modals/CreateStreamModal'
import styles from '@styles/pages/UserPage/Streams.module.scss'
import {
    DeleteIcon,
    EditIcon,
    InfinityIcon,
    PlusIcon,
    SpacesIcon,
    StreamIcon,
    UsersIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Streams(): JSX.Element {
    const { accountData, pageBottomReached, loggedIn } = useContext(AccountContext)
    const { userData, userNotFound, userPostsFilters } = useContext(UserContext)
    const [streams, setStreams] = useState<any[]>([])
    const [sources, setSources] = useState<any>({ stream: null, spaces: [], users: [] })
    const [posts, setPosts] = useState<any[]>([])
    const [postOffset, setPostOffset] = useState(0)
    const [streamsLoading, setStreamsLoading] = useState(true)
    const [sourcesLoading, setSourcesLoading] = useState(true)
    const [postsLoading, setPostsLoading] = useState(true)
    const [nextPostsLoading, setNextPostsLoading] = useState(false)
    const [deleteStreamLoading, setDeleteStreamLoading] = useState(false)
    const [morePosts, setMorePosts] = useState(true)
    const [streamNotFound, setStreamNotFound] = useState(false)
    const [editingStream, setEditingStream] = useState(false)
    const [createStreamModalOpen, setCreateStreamModalOpen] = useState(false)
    const [deleteStreamModalOpen, setDeleteStreamModalOpen] = useState(false)
    const streamRef = useRef('')
    const history = useNavigate()
    const location = useLocation()
    const cookies = new Cookies()
    const path = location.pathname.split('/')
    const userHandle = path[2]
    const streamType = path[4]
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const streamId = urlParams.id || null
    const params = { ...userPostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function findStreamIcon(type: string) {
        if (type === 'all') return <InfinityIcon />
        if (type === 'spaces') return <SpacesIcon />
        if (type === 'people') return <UsersIcon />
        return null
    }

    function getStreams() {
        setStreamsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/streams`, options)
            .then((res) => {
                setStreams(res.data)
                setStreamsLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getSources() {
        setSourcesLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/stream-sources?type=${streamType}&id=${streamId}`, options)
            .then((res) => {
                setSources(res.data)
                setSourcesLoading(false)
            })
            .catch((error) => {
                console.log(error)
                if (error.response.status === 404) {
                    setStreamNotFound(true)
                    setSourcesLoading(false)
                }
            })
    }

    function getPosts(offset: number) {
        streamRef.current = `${streamType}-${streamId}`
        if (offset) setNextPostsLoading(true)
        else setPostsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        // todo: set up filter modal (and search?)
        const data = {
            type: streamType,
            id: streamId,
            timeRange: 'All Time',
            postType: 'All Types',
            sortBy: 'Date Created',
            sortOrder: 'Descending',
            depth: 'All Contained Posts', // 'Only Direct Descendents'
            searchQuery: '',
            offset,
        }
        axios
            .post(`${config.apiURL}/stream-posts`, data, options)
            .then((res) => {
                if (streamRef.current === `${streamType}-${streamId}`) {
                    setMorePosts(res.data.length === 10)
                    setPostOffset(offset + res.data.length)
                    setPosts(offset ? [...posts, ...res.data] : res.data)
                    if (offset) setNextPostsLoading(false)
                    else setPostsLoading(false)
                }
            })
            .catch((error) => {
                console.log(error)
                if (error.response.status === 404) {
                    setStreamNotFound(true)
                    if (offset) setNextPostsLoading(false)
                    else setPostsLoading(false)
                }
            })
    }

    function deleteStream() {
        setDeleteStreamLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/delete-stream`, { streamId }, options)
            .then(() => {
                setStreams(streams.filter((s) => s.id !== +streamId!))
                history(`/u/${userData.handle}/streams/spaces`)
                setDeleteStreamModalOpen(false)
                setDeleteStreamLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (accountData.id) {
            // get streams if own account, otherwise redirect to posts
            if (userHandle === accountData.handle) getStreams()
            else history(`/u/${userData.handle}/posts`)
        }
    }, [accountData.id])

    useEffect(() => {
        setStreamNotFound(false)
        getSources()
        getPosts(0)
    }, [location])

    useEffect(() => {
        const loading = postsLoading || nextPostsLoading || userData.handle !== userHandle
        if (pageBottomReached && morePosts && !loading) getPosts(postOffset)
    }, [pageBottomReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <Row className={styles.content}>
                <Column className={styles.sideBar}>
                    <Row className={styles.header}>
                        <StreamIcon />
                        <p>Your streams</p>
                    </Row>
                    {['all', 'spaces', 'people'].map((type) => (
                        <Link
                            key={type}
                            to={`/u/${userHandle}/streams/${type}`}
                            className={styles.streamButton}
                        >
                            <Column centerY centerX>
                                {findStreamIcon(type)}
                            </Column>
                            <p>{capitalise(type)}</p>
                        </Link>
                    ))}
                    <div className={styles.divider} />
                    {streamsLoading ? (
                        <LoadingWheel size={30} style={{ marginBottom: 10 }} />
                    ) : (
                        <Column>
                            {streams.map((stream) => (
                                <ImageTitle
                                    key={stream.id}
                                    type='stream'
                                    imagePath={stream.image}
                                    imageSize={32}
                                    title={trimText(stream.name, 25)}
                                    fontSize={16}
                                    link={`/u/${userHandle}/streams/custom?id=${stream.id}`}
                                    style={{ marginBottom: 10 }}
                                />
                            ))}
                        </Column>
                    )}
                    <Button
                        icon={<PlusIcon />}
                        text='New stream'
                        color='blue'
                        onClick={() => setCreateStreamModalOpen(true)}
                        style={{ marginTop: 10 }}
                    />
                </Column>
                {params.lens === 'List' && (
                    <Row className={styles.postListView}>
                        {streamNotFound ? (
                            <Row centerX centerY className={styles.streamNotFound}>
                                Stream not found...
                            </Row>
                        ) : (
                            <PostList
                                location='user-posts'
                                posts={posts}
                                totalPosts={postOffset === 0 && posts.length < 1 ? 1 : 0}
                                loading={postsLoading}
                                nextPostsLoading={nextPostsLoading}
                            />
                        )}
                    </Row>
                )}
                <Column className={styles.sideBar} style={{ marginLeft: 20 }}>
                    <Row className={styles.header}>
                        <StreamIcon />
                        <p>This stream</p>
                    </Row>
                    {streamType === 'custom' && sources.stream && (
                        <Row centerY style={{ marginBottom: 10 }}>
                            <ImageTitle
                                type='stream'
                                imagePath={sources.stream.image}
                                imageSize={40}
                                title={sources.stream.name}
                                fontSize={18}
                                style={{ marginRight: 5 }}
                            />
                            <button
                                type='button'
                                className={styles.editButton}
                                onClick={() => {
                                    setEditingStream(true)
                                    setCreateStreamModalOpen(true)
                                }}
                            >
                                <EditIcon />
                            </button>
                            <button
                                type='button'
                                className={styles.editButton}
                                onClick={() => setDeleteStreamModalOpen(true)}
                            >
                                <DeleteIcon />
                            </button>
                        </Row>
                    )}
                    {['all', 'spaces', 'people'].includes(streamType) && (
                        <Row className={`${styles.streamButton} ${styles.large}`}>
                            <Column centerY centerX>
                                {findStreamIcon(streamType)}
                            </Column>
                            <p>{capitalise(streamType)}</p>
                        </Row>
                    )}
                    {sourcesLoading ? (
                        <LoadingWheel size={30} style={{ marginBottom: 10 }} />
                    ) : (
                        <Column>
                            {streamType === 'spaces' && !sources.spaces.length && (
                                <p className={styles.greyText}>No followed spaces...</p>
                            )}
                            {streamType === 'people' && !sources.users.length && (
                                <p className={styles.greyText}>No followed people...</p>
                            )}
                            {sources.spaces.length > 0 && (
                                <Row className={styles.header}>
                                    <SpacesIcon />
                                    <p>Spaces</p>
                                </Row>
                            )}
                            {sources.spaces.map((s) => (
                                <ImageTitle
                                    key={s.id}
                                    type='space'
                                    imagePath={s.flagImagePath}
                                    title={trimText(s.name, 25)}
                                    link={`/s/${s.handle}`}
                                    style={{ marginBottom: 10 }}
                                />
                            ))}
                            {sources.users.length > 0 && (
                                <Row className={styles.header}>
                                    <UsersIcon />
                                    <p>People</p>
                                </Row>
                            )}
                            {sources.users.map((u) => (
                                <ImageTitle
                                    key={u.id}
                                    type='user'
                                    imagePath={u.flagImagePath}
                                    title={trimText(u.name, 25)}
                                    link={`/u/${u.handle}`}
                                    style={{ marginBottom: 10 }}
                                />
                            ))}
                        </Column>
                    )}
                </Column>
            </Row>
            {createStreamModalOpen && (
                <CreateStreamModal
                    editing={editingStream}
                    currentData={sources}
                    onSave={(newStream) => {
                        if (editingStream) {
                            getStreams()
                            getSources()
                            getPosts(0)
                        } else {
                            setStreams([...streams, newStream])
                            history(`/u/${userData.handle}/streams/custom?id=${newStream.id}`)
                        }
                    }}
                    close={() => {
                        setCreateStreamModalOpen(false)
                        setEditingStream(false)
                    }}
                />
            )}
            {deleteStreamModalOpen && (
                <Modal centerX close={() => setDeleteStreamModalOpen(false)}>
                    <h1>Are you sure you want to delete your stream?</h1>
                    <Row>
                        <Button
                            text='Yes, delete'
                            color='red'
                            loading={deleteStreamLoading}
                            onClick={deleteStream}
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            text='Cancel'
                            color='blue'
                            disabled={deleteStreamLoading}
                            onClick={() => setDeleteStreamModalOpen(false)}
                        />
                    </Row>
                </Modal>
            )}
        </Column>
    )
}

export default Streams
