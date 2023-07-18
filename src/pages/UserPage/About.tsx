import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import Row from '@components/Row'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/pages/UserPage/About.module.scss'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'

function About(): JSX.Element {
    const { userData, userNotFound } = useContext(UserContext)
    const { handle, createdAt, bio } = userData
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {handle !== userHandle ? (
                <p>User data loading... </p>
            ) : (
                <Column className={styles.content}>
                    <Row centerY centerX className={styles.creation}>
                        <p>Joined</p>
                        <p title={dateCreated(createdAt)}>{timeSinceCreated(createdAt)}</p>
                    </Row>
                    {bio && <DraftText stringifiedDraft={bio || ''} style={{ marginTop: 30 }} />}
                </Column>
            )}
        </Column>
    )
}

export default About
