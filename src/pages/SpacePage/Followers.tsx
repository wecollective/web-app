import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/Followers.module.scss'
import { UsersIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

function Followers(): JSX.Element {
    const { spaceData } = useContext(SpaceContext)
    const [followers, setFollowers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const spaceHandleRef = useRef('')

    async function getFollowers() {
        spaceHandleRef.current = spaceHandle
        axios
            .get(`${config.apiURL}/followers?spaceId=${spaceData.id}`)
            .then((res) => {
                if (spaceHandleRef.current === spaceHandle) {
                    setFollowers(res.data)
                    setLoading(false)
                }
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) {
            setLoading(true)
            setFollowers([])
        } else getFollowers()
    }, [spaceData.id, location.pathname])

    if (loading || spaceData.totalFollowers === 0) return <div />
    return (
        <Column className={styles.wrapper}>
            <Row centerY className={styles.header}>
                <UsersIcon />
                <p>Followers</p>
            </Row>
            <Row centerY>
                <FlagImageHighlights type='user' images={followers} />
                {spaceData.totalFollowers > 6 && (
                    <p style={{ marginLeft: 5 }}>+{spaceData.totalFollowers - 6}</p>
                )}
            </Row>
        </Column>
    )
}

export default Followers
