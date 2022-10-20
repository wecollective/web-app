import Button from '@components/Button'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import UpdateUserBioModal from '@components/modals/UpdateUserBioModal'
import UpdateUserEmailModal from '@components/modals/UpdateUserEmailModal'
import UpdateUserNameModal from '@components/modals/UpdateUserNameModal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/Settings.module.scss'
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

const Settings = (): JSX.Element => {
    const { accountData, accountDataLoading } = useContext(AccountContext)
    const { setSelectedUserSubPage, userData, getUserData, isOwnAccount } = useContext(UserContext)
    const { handle, name, bio, email } = accountData

    const [userNameModalOpen, setUserNameModalOpen] = useState(false)
    const [userBioModalOpen, setUserBioModalOpen] = useState(false)
    const [userEmailModalOpen, setUserEmailModalOpen] = useState(false)

    const history = useHistory()
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]

    function redirect(res) {
        if (res.handle !== handle) history.push(`/u/${res.handle}/about`)
    }

    useEffect(() => {
        if (!accountDataLoading) {
            if (userHandle !== userData.handle) {
                getUserData(userHandle, redirect)
            } else redirect({ handle: userHandle })
        }
    }, [accountDataLoading, location])

    useEffect(() => setSelectedUserSubPage('settings'), [])

    return (
        <Column centerX className={styles.wrapper}>
            {isOwnAccount && (
                <Column centerX className={styles.content}>
                    <Row centerY>
                        <h1>Name:</h1>
                        <p>{name}</p>
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            onClick={() => setUserNameModalOpen(true)}
                        />
                        {userNameModalOpen && (
                            <UpdateUserNameModal close={() => setUserNameModalOpen(false)} />
                        )}
                    </Row>
                    <Column centerX>
                        <h1>Bio:</h1>
                        <ShowMoreLess height={75}>
                            <DraftText stringifiedDraft={bio} />
                        </ShowMoreLess>
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            style={{ marginTop: 10 }}
                            onClick={() => setUserBioModalOpen(true)}
                        />
                        {userBioModalOpen && (
                            <UpdateUserBioModal close={() => setUserBioModalOpen(false)} />
                        )}
                    </Column>
                    <Row centerY>
                        <h1>Email:</h1>
                        <p>{email}</p>
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            onClick={() => setUserEmailModalOpen(true)}
                        />
                        {userEmailModalOpen && (
                            <UpdateUserEmailModal close={() => setUserEmailModalOpen(false)} />
                        )}
                    </Row>
                </Column>
            )}
        </Column>
    )
}

export default Settings
