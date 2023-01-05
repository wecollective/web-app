import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/TopContributors.module.scss'
import { LikeIcon, StarIcon, TrophyIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const TopContributors = (): JSX.Element => {
    const { spaceData } = useContext(SpaceContext)
    const [topContributors, setTopContributors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    async function getUsers() {
        axios
            .get(`${config.apiURL}/top-space-contributors?spaceId=${spaceData.id}`)
            .then((res) => {
                setTopContributors(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setLoading(true)
        else getUsers()
    }, [spaceData.id, location])

    return (
        <Scrollbars className={styles.wrapper}>
            {!loading && (
                <Column>
                    <Row className={styles.header}>
                        <StarIcon />
                        <p>Top contributors</p>
                    </Row>
                    <Column>
                        {topContributors.map((user, index) => (
                            <Row key={user.id} centerY style={{ marginTop: 10 }}>
                                <ImageTitle
                                    type='space'
                                    imagePath={user.flagImagePath}
                                    title={user.name}
                                    link={`/u/${user.handle}`}
                                    fontSize={14}
                                    imageSize={35}
                                    wrapText
                                    style={{ marginRight: 10 }}
                                />
                                <Row centerY className={styles.stats}>
                                    <LikeIcon />
                                    <p>{user.likesReceived}</p>
                                    {index === 0 && <TrophyIcon />}
                                </Row>
                            </Row>
                        ))}
                    </Column>
                </Column>
            )}
        </Scrollbars>
    )
}

export default TopContributors
