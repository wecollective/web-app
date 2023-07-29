import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import PostList from '@components/PostList'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import styles from '@styles/pages/UserPage/Streams.module.scss'
import { StreamIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Streams(): JSX.Element {
    const { pageBottomReached, loggedIn } = useContext(AccountContext)
    const {
        userData,
        userNotFound,
        userPostsFilters,
        userPostsPaginationLimit,
        userPostsPaginationOffset,
        userPostsPaginationHasMore,
        getUserPosts,
    } = useContext(UserContext)
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]
    const cookies = new Cookies()
    const [posts, setPosts] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [postsLoading, setPostsLoading] = useState(true)
    const [nextPostsLoading, setNextPostsLoading] = useState(false)

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...userPostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    useEffect(() => {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = {
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
            .post(`${config.apiURL}/stream`, data, options)
            .then((res) => {
                console.log('stream res:', res.data)
                setPosts(res.data.posts)
                setTotal(res.data.total)
                setPostsLoading(false)
            })
            .catch((error) => console.log(error))
    }, [])

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
                    <ImageTitle type='space' imagePath='' title='All' style={{ marginTop: 10 }} />
                    <ImageTitle
                        type='space'
                        imagePath=''
                        title='Spaces'
                        style={{ marginTop: 10 }}
                    />
                    <ImageTitle type='user' imagePath='' title='Users' style={{ marginTop: 10 }} />
                    <p style={{ marginTop: 10 }}>+ Custom stream</p>
                </Column>
                {params.lens === 'List' && (
                    <Row className={styles.postListView}>
                        <PostList
                            location='user-posts'
                            posts={posts}
                            totalPosts={total}
                            loading={postsLoading}
                            nextPostsLoading={nextPostsLoading}
                        />
                    </Row>
                )}
                <Column className={styles.sideBar} style={{ marginLeft: 20 }}>
                    <Row className={styles.sideBarHeader}>
                        {/* <StreamIcon /> */}
                        <p>This stream</p>
                    </Row>
                </Column>
            </Row>
        </Column>
    )
}

export default Streams
