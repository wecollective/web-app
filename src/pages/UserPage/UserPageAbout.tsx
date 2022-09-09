import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/SpaceNotFound'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/pages/UserPage/UserPageAbout.module.scss'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'

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
                <Scrollbars className={styles.contentWrapper}>
                    <Column className={styles.content}>
                        <Row centerY centerX className={styles.creation}>
                            <p>Joined</p>
                            <p title={dateCreated(createdAt)}>{timeSinceCreated(createdAt)}</p>
                        </Row>
                        <DraftText stringifiedDraft={bio || ''} />
                    </Column>
                </Scrollbars>
            )}
        </Column>
    )
}

export default UserPageAbout
