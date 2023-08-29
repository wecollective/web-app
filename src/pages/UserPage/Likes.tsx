import Column from '@components/Column'
import PostList from '@components/PostList'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import styles from '@styles/pages/UserPage/Likes.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Likes(): JSX.Element {
    const { accountData, pageBottomReached, loggedIn } = useContext(AccountContext)
    const { userData, userNotFound, userPostsFilters } = useContext(UserContext)
    const [items, setItems] = useState<any[]>([])
    const [itemsOffset, setItemsOffset] = useState(0)
    const [itemsLoading, setItemsLoading] = useState(true)
    const [nextItemsLoading, setNextItemsLoading] = useState(false)
    const [moreItems, setMoreItems] = useState(true)
    const history = useNavigate()
    const location = useLocation()
    const cookies = new Cookies()
    const path = location.pathname.split('/')
    const userHandle = path[2]
    const mobileView = document.documentElement.clientWidth < 900
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...userPostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function getItems(offset) {
        if (offset) setNextItemsLoading(true)
        else setItemsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/liked-posts`, { offset }, options)
            .then((res) => {
                setMoreItems(res.data.length === 10)
                setItemsOffset(offset + res.data.length)
                setItems(offset ? [...items, ...res.data] : res.data)
                if (offset) setNextItemsLoading(false)
                else setItemsLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (userData.id) {
            if (userHandle === accountData.handle) getItems(0)
            else history(`/u/${userHandle}/posts`)
        }
    }, [userData.id, loggedIn])

    useEffect(() => {
        if (!itemsLoading) getItems(0)
    }, [location])

    useEffect(() => {
        const loading = itemsLoading || nextItemsLoading || userData.handle !== userHandle
        if (pageBottomReached && moreItems && !loading) getItems(itemsOffset)
    }, [pageBottomReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <PostList
                location='user-posts'
                posts={items}
                totalPosts={itemsOffset === 0 && items.length < 1 ? 1 : 0}
                loading={itemsLoading}
                nextPostsLoading={nextItemsLoading}
            />
        </Column>
    )
}

export default Likes
