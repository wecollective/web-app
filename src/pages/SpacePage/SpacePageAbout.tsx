import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageAbout.module.scss'
import { timeSinceCreated, dateCreated } from '@src/Helpers'
import Column from '@components/Column'
import Row from '@components/Row'
import Markdown from '@components/Markdown'
import ImageTitle from '@components/ImageTitle'
import SpaceNotFound from '@pages/SpaceNotFound'

const SpacePageAbout = (): JSX.Element => {
    const { spaceData, spaceNotFound } = useContext(SpaceContext)
    const { description, createdAt, Creator } = spaceData
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column className={styles.wrapper}>
            {spaceData.handle !== spaceHandle ? (
                <p>Space data loading... </p>
            ) : (
                <Column className={styles.content}>
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
                            link={`/u/${Creator.handle}`}
                            shadow
                            style={{ marginLeft: 5 }}
                        />
                    </Row>
                    <Markdown text={description} style={{ textAlign: 'center' }} />
                </Column>
            )}
        </Column>
    )
}

export default SpacePageAbout
