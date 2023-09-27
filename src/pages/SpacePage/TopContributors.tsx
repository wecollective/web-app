import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { trimText } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/TopContributors.module.scss'
import { LikeIcon, RankingIcon, TrophyIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

function TopContributors(): JSX.Element {
    const { spaceData } = useContext(SpaceContext)
    const [users, setUsers] = useState<any[]>([])
    const [totalUsers, setTotalUsers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [nextUsersLoading, setNextUsersLoading] = useState(false)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const spaceHandleRef = useRef('')

    async function getUsers() {
        spaceHandleRef.current = spaceHandle
        axios
            .get(`${config.apiURL}/top-contributors?spaceId=${spaceData.id}&offset=${users.length}`)
            .then((res) => {
                if (spaceHandleRef.current === spaceHandle) {
                    setUsers([...users, ...res.data.users])
                    setTotalUsers(res.data.totalUsers)
                    setLoading(false)
                    setNextUsersLoading(false)
                }
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) {
            setLoading(true)
            setUsers([])
        } else getUsers()
    }, [spaceData.id, location.pathname])

    return (
        <Scrollbars className={styles.wrapper}>
            {!loading && (
                <Column>
                    <Row className={styles.header}>
                        <RankingIcon />
                        <p>Top contributors</p>
                    </Row>
                    {users.map((user, index) => (
                        <Row key={user.id} centerY style={{ marginTop: 10 }}>
                            <ImageTitle
                                type='space'
                                imagePath={user.flagImagePath}
                                title={trimText(user.name, 18)}
                                link={`/u/${user.handle}/posts`}
                                fontSize={14}
                                imageSize={35}
                                wrapText
                                style={{ marginRight: 10 }}
                            />
                            <Row centerY className={styles.stats}>
                                <LikeIcon />
                                <p>{user.totalPostLikes}</p>
                                {index === 0 && <TrophyIcon />}
                            </Row>
                        </Row>
                    ))}
                    {users.length < totalUsers && (
                        <Row centerX centerY style={{ marginTop: 10 }}>
                            {nextUsersLoading ? (
                                <LoadingWheel size={20} />
                            ) : (
                                <button
                                    type='button'
                                    onClick={() => {
                                        setNextUsersLoading(true)
                                        getUsers()
                                    }}
                                    className={styles.loadMore}
                                >
                                    Load more ({totalUsers - users.length})
                                </button>
                            )}
                        </Row>
                    )}
                </Column>
            )}
        </Scrollbars>
    )
}

export default TopContributors
