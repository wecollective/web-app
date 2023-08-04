import Column from '@components/Column'
import PeopleList from '@components/PeopleList'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import config from '@src/Config'
import SpaceList from '@src/components/SpaceList'
import styles from '@styles/pages/UserPage/Streams.module.scss'
import { EyeIcon, SpacesIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Following(): JSX.Element {
    const { accountData, pageBottomReached, loggedIn } = useContext(AccountContext)
    const { userData, userNotFound, userPostsFilters } = useContext(UserContext)
    const [items, setItems] = useState<any[]>([])
    const [itemsOffset, setItemsOffset] = useState(0)
    const [itemsLoading, setItemsLoading] = useState(true)
    const [nextItemsLoading, setNextItemsLoading] = useState(false)
    const [moreItems, setMoreItems] = useState(true)
    const itemRef = useRef('')
    const history = useNavigate()
    const location = useLocation()
    const cookies = new Cookies()
    const path = location.pathname.split('/')
    const userHandle = path[2]
    const itemType = path[4]
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...userPostsFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function getItems(offset) {
        itemRef.current = `${userHandle}-${itemType}`
        if (offset) setNextItemsLoading(true)
        else setItemsLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = { offset }
        axios
            .post(`${config.apiURL}/followed-${itemType}`, data, options)
            .then((res) => {
                if (itemRef.current === `${userHandle}-${itemType}`) {
                    setMoreItems(res.data.length === 10)
                    setItemsOffset(offset + res.data.length)
                    setItems(offset ? [...items, ...res.data] : res.data)
                    if (offset) setNextItemsLoading(false)
                    else setItemsLoading(false)
                }
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (accountData.id) {
            // get followed items if own account, otherwise redirect to posts
            if (userHandle === accountData.handle) getItems(0)
            else history(`/u/${userData.handle}/posts`)
        }
    }, [accountData.id])

    useEffect(() => getItems(0), [location])

    useEffect(() => {
        const loading = itemsLoading || nextItemsLoading || userData.handle !== userHandle
        if (pageBottomReached && moreItems && !loading) getItems(itemsOffset)
    }, [pageBottomReached])

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <Row className={styles.content}>
                <Column className={styles.sideBar}>
                    <Row className={styles.header}>
                        <EyeIcon />
                        <p>Following</p>
                    </Row>
                    <Link to={`/u/${userHandle}/following/spaces`} className={styles.streamButton}>
                        <Column centerY centerX>
                            <SpacesIcon />
                        </Column>
                        <p>Spaces</p>
                    </Link>
                    <Link to={`/u/${userHandle}/following/people`} className={styles.streamButton}>
                        <Column centerY centerX>
                            <UsersIcon />
                        </Column>
                        <p>People</p>
                    </Link>
                </Column>
                {params.lens === 'List' && (
                    <Row className={styles.postListView}>
                        {itemType === 'spaces' && (
                            <SpaceList
                                location='followed-spaces'
                                spaces={items}
                                totalSpaces={itemsOffset === 0 && items.length < 1 ? 1 : 0}
                                loading={itemsLoading}
                                nextSpacesLoading={nextItemsLoading}
                            />
                        )}
                        {itemType === 'people' && (
                            <Column style={{ width: 800 }}>
                                <PeopleList
                                    people={items}
                                    firstPeopleloading={itemsLoading}
                                    nextPeopleLoading={nextItemsLoading}
                                />
                            </Column>
                        )}
                    </Row>
                )}
                <Column className={styles.sideBar} />
            </Row>
        </Column>
    )
}

export default Following
