import Button from '@components/Button'
import Column from '@components/Column'
import DraftText from '@components/DraftText'
import UpdateUserBioModal from '@components/modals/UpdateUserBioModal'
import UpdateUserNameModal from '@components/modals/UpdateUserNameModal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/UserPageSettings.module.scss'
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

const UserPageSettings = (): JSX.Element => {
    const { accountData, accountDataLoading } = useContext(AccountContext)
    const { setSelectedUserSubPage, userData, getUserData, isOwnAccount } = useContext(UserContext)
    const { handle, name, bio } = accountData

    const [updateUserNameModalOpen, setUpdateUserNameModalOpen] = useState(false)
    const [updateUserBioModalOpen, setUpdateUserBioModalOpen] = useState(false)

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
                            onClick={() => setUpdateUserNameModalOpen(true)}
                        />
                        {updateUserNameModalOpen && (
                            <UpdateUserNameModal close={() => setUpdateUserNameModalOpen(false)} />
                        )}
                    </Row>
                    <Column centerX>
                        <h1>Bio:</h1>
                        <ShowMoreLess height={75}>
                            <DraftText text={bio} />
                        </ShowMoreLess>
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            style={{ marginTop: 10 }}
                            onClick={() => setUpdateUserBioModalOpen(true)}
                        />
                        {updateUserBioModalOpen && (
                            <UpdateUserBioModal close={() => setUpdateUserBioModalOpen(false)} />
                        )}
                    </Column>
                </Column>
            )}
        </Column>
    )
}

export default UserPageSettings
