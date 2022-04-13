import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styles from '@styles/pages/UserPage/UserPageAbout.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import { timeSinceCreated, dateCreated } from '@src/Helpers'
import Column from '@components/Column'
import Row from '@components/Row'
import Markdown from '@components/Markdown'

const UserPageAbout = ({ match }: { match: { params: { userHandle: string } } }): JSX.Element => {
    const { params } = match
    const { userHandle } = params
    const { accountDataLoading } = useContext(AccountContext)
    const { userData, getUserData, setSelectedUserSubPage } = useContext(UserContext)
    const { createdAt, bio } = userData
    const location = useLocation()

    useEffect(() => {
        if (!accountDataLoading && userHandle !== userData.handle) getUserData(userHandle)
    }, [accountDataLoading, location])

    useEffect(() => setSelectedUserSubPage('about'), [])

    return (
        <Column className={styles.wrapper}>
            <Column className={styles.content}>
                <Row centerY style={{ marginBottom: 30 }}>
                    <p>
                        Joined{' '}
                        <span title={dateCreated(createdAt)}>{timeSinceCreated(createdAt)}</span>
                    </p>
                </Row>
                <Markdown text={bio} />
            </Column>
        </Column>
    )
}

export default UserPageAbout
