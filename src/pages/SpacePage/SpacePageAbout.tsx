import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Markdown from '@components/Markdown'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/pages/SpacePage/SpacePageAbout.module.scss'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'

const SpacePageAbout = (): JSX.Element => {
    const { spaceData, spaceNotFound } = useContext(SpaceContext)
    const { description, createdAt, Creator } = spaceData
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {spaceData.handle !== spaceHandle ? (
                <p>Space data loading... </p>
            ) : (
                <Scrollbars className={styles.contentWrapper}>
                    <Column className={styles.content}>
                        <Markdown text={description} style={{ textAlign: 'center' }} />
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
                    </Column>
                </Scrollbars>
            )}
        </Column>
    )
}

export default SpacePageAbout
