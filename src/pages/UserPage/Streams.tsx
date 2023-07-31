import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import PostList from '@components/PostList'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import CreateStreamModal from '@src/components/modals/CreateStreamModal'
import styles from '@styles/pages/UserPage/Streams.module.scss'
import { InfinityIcon, PlusIcon, SpacesIcon, StreamIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Streams(): JSX.Element {
    const { accountData, pageBottomReached, loggedIn } = useContext(AccountContext)
    const {
        userData,
        userNotFound,
        userPostsFilters,
        userPostsPaginationLimit,
        userPostsPaginationOffset,
        userPostsPaginationHasMore,
        getUserPosts,
    } = useContext(UserContext)
    const [streams, setStreams] = useState<any[]>([])
    const [posts, setPosts] = useState<any[]>([])
    const [sources, setSources] = useState<any>({ spaces: [], users: [] })
    const [postsLoading, setPostsLoading] = useState(true)
    const [nextPostsLoading, setNextPostsLoading] = useState(false)
    const [createStreamModalOpen, setCreateStreamModalOpen] = useState(false)
    const location = useLocation()
    const cookies = new Cookies()
    const path = location.pathname.split('/')
    const userHandle = path[2]
    const stream = path[4]
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const streamId = urlParams.id || null
    const params = { ...userPostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function getStreams() {
        //
    }

    function getStreamSources() {
        //
    }

    function getStreamPosts() {
        //
    }

    useEffect(() => {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = {
            stream,
            streamId,
            timeRange: 'All Time',
            postType: 'All Types',
            sortBy: 'Date Created',
            sortOrder: 'Descending',
            depth: 'All Contained Posts', // 'Only Direct Descendents'
            searchQuery: '',
            limit: 10,
            offset: 0,
        }
        setPostsLoading(true)
        axios
            .post(`${config.apiURL}/streams`, data, options)
            .then((res) => {
                console.log('stream res:', res.data)
                setPosts(res.data.posts)
                setSources(res.data.sources)
                setPostsLoading(false)
            })
            .catch((error) => console.log(error))
    }, [location])

    // useEffect(() => {
    //     if (userData.handle !== userHandle) setUserPostsLoading(true)
    //     else {
    //         if (params.lens === 'List')
    //             getUserPosts(userData.id, 0, userPostsPaginationLimit, params)
    //         if (params.lens === 'Map') {
    //             // getPostMapData(spaceData.id, params)
    //         }
    //     }
    // }, [userData.handle, location, loggedIn])

    // useEffect(() => {
    //     if (
    //         !userPostsLoading &&
    //         !nextUserPostsLoading &&
    //         userData.handle === userHandle &&
    //         userPostsPaginationHasMore &&
    //         pageBottomReached
    //     )
    //         getUserPosts(userData.id, userPostsPaginationOffset, userPostsPaginationLimit, params)
    // }, [pageBottomReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <Row className={styles.content}>
                <Column className={styles.sideBar}>
                    <Row className={styles.sideBarHeader}>
                        <StreamIcon />
                        <p>Your streams</p>
                    </Row>
                    <Link to={`/u/${userHandle}/streams/all`} className={styles.streamButton}>
                        <Column centerY centerX>
                            <InfinityIcon />
                        </Column>
                        <p>All</p>
                    </Link>
                    <Link to={`/u/${userHandle}/streams/spaces`} className={styles.streamButton}>
                        <Column centerY centerX>
                            <SpacesIcon />
                        </Column>
                        <p>Spaces</p>
                    </Link>
                    <Link to={`/u/${userHandle}/streams/people`} className={styles.streamButton}>
                        <Column centerY centerX>
                            <UsersIcon />
                        </Column>
                        <p>People</p>
                    </Link>
                    <div className={styles.divider} />
                    <Button
                        icon={<PlusIcon />}
                        text='New stream'
                        color='blue'
                        disabled={false}
                        loading={false}
                        onClick={() => setCreateStreamModalOpen(true)}
                        style={{ marginTop: 10 }}
                    />
                </Column>
                {params.lens === 'List' && (
                    <Row className={styles.postListView}>
                        <PostList
                            location='user-posts'
                            posts={posts}
                            totalPosts={1}
                            loading={postsLoading}
                            nextPostsLoading={nextPostsLoading}
                        />
                    </Row>
                )}
                <Column className={styles.sideBar} style={{ marginLeft: 20 }}>
                    <Row className={styles.sideBarHeader}>
                        <StreamIcon />
                        <p>This stream</p>
                    </Row>
                    {sources.spaces.length > 0 && (
                        <Row className={styles.sideBarHeader}>
                            <SpacesIcon />
                            <p>Spaces</p>
                        </Row>
                    )}
                    {sources.spaces.map((u) => (
                        <ImageTitle
                            type='space'
                            imagePath={u.flagImagePath}
                            title={u.name}
                            style={{ marginBottom: 10 }}
                        />
                    ))}
                    {sources.users.length > 0 && (
                        <Row className={styles.sideBarHeader}>
                            <UsersIcon />
                            <p>People</p>
                        </Row>
                    )}
                    {sources.users.map((u) => (
                        <ImageTitle
                            type='user'
                            imagePath={u.flagImagePath}
                            title={u.name}
                            style={{ marginBottom: 10 }}
                        />
                    ))}
                </Column>
            </Row>
            {createStreamModalOpen && (
                <CreateStreamModal close={() => setCreateStreamModalOpen(false)} />
            )}
        </Column>
    )
}

export default Streams
