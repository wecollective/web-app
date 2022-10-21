import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import config from '@src/Config'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/About.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const About = (): JSX.Element => {
    const { spaceData, spaceNotFound } = useContext(SpaceContext)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>({})
    const { createdAt, Creator } = data

    useEffect(() => {
        if (spaceData.handle === spaceHandle)
            axios
                .get(`${config.apiURL}/space-about?handle=${spaceHandle}`)
                .then((res) => {
                    setData(res.data)
                    setLoading(false)
                })
                .catch((error) => console.log(error))
    }, [spaceData.handle])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {loading ? (
                <p>Space data loading... </p>
            ) : (
                <Column className={styles.content}>
                    <DraftText stringifiedDraft={spaceData.description || ''} />
                    <Row centerY centerX className={styles.creation}>
                        <p>Created</p>
                        <p title={dateCreated(createdAt)}>{timeSinceCreated(createdAt)}</p>
                        <p>by</p>
                        <ImageTitle
                            type='user'
                            imagePath={Creator.flagImagePath}
                            imageSize={32}
                            title={Creator.name}
                            fontSize={16}
                            link={`/u/${Creator.handle}/posts`}
                            shadow
                            style={{ marginLeft: 5 }}
                        />
                    </Row>
                </Column>
            )}
        </Column>
    )
}

export default About
