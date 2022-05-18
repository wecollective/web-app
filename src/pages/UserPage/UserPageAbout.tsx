import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import styles from '@styles/pages/UserPage/UserPageAbout.module.scss'
import { UserContext } from '@contexts/UserContext'
import { timeSinceCreated, dateCreated } from '@src/Helpers'
import Column from '@components/Column'
import Row from '@components/Row'
import UserNotFound from '@pages/SpaceNotFound'
import Markdown from '@components/Markdown'

const UserPageAbout = (): JSX.Element => {
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
                    <Markdown text={bio} style={{ textAlign: 'center' }} />
                </Column>
            )}
        </Column>
    )
}

export default UserPageAbout
