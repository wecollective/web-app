import Button from '@components/Button'
import Column from '@components/Column'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import DraftText from '@components/draft-js/DraftText'
import DeleteAccountModal from '@components/modals/DeleteAccountModal'
import MuteUserModal from '@components/modals/MuteUserModal'
import UpdateUserBioModal from '@components/modals/UpdateUserBioModal'
import UpdateUserEmailModal from '@components/modals/UpdateUserEmailModal'
import UpdateUserNameModal from '@components/modals/UpdateUserNameModal'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/Settings.module.scss'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function Settings(): JSX.Element | null {
    const { accountData, accountDataLoading } = useContext(AccountContext)
    const { setSelectedUserSubPage, userData, getUserData, isOwnAccount } = useContext(UserContext)
    const { handle, name, bio, email } = accountData
    const [userNameModalOpen, setUserNameModalOpen] = useState(false)
    const [userBioModalOpen, setUserBioModalOpen] = useState(false)
    const [userEmailModalOpen, setUserEmailModalOpen] = useState(false)
    const [muteUserModalOpen, setMuteUserModalOpen] = useState(false)
    const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)
    const history = useNavigate()
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]

    function redirect(res) {
        if (res.handle !== handle) history(`/u/${res.handle}/about`)
    }

    useEffect(() => {
        if (!accountDataLoading) {
            if (userHandle !== userData.handle) {
                getUserData(userHandle, redirect)
            } else redirect({ handle: userHandle })
        }
    }, [accountDataLoading, location])

    useEffect(() => setSelectedUserSubPage('settings'), [])

    if (!isOwnAccount) return null
    return (
        <Column centerX className={styles.wrapper}>
            <Column centerX className={styles.content}>
                <h1>Personal details</h1>
                <Row centerY>
                    <h2>Name:</h2>
                    <p>{name}</p>
                    <Button
                        text='Edit'
                        color='blue'
                        size='medium'
                        onClick={() => setUserNameModalOpen(true)}
                    />
                </Row>
                <Column centerX>
                    <h2>Bio:</h2>
                    {bio && (
                        <ShowMoreLess height={75}>
                            <DraftText stringifiedDraft={bio} />
                        </ShowMoreLess>
                    )}
                    <Button
                        text='Edit'
                        color='blue'
                        size='medium'
                        style={{ marginTop: 10 }}
                        onClick={() => setUserBioModalOpen(true)}
                    />
                </Column>
                <Row centerY style={{ marginBottom: 40 }}>
                    <h2>Email:</h2>
                    <p>{email}</p>
                    <Button
                        text='Edit'
                        color='blue'
                        size='medium'
                        onClick={() => setUserEmailModalOpen(true)}
                    />
                </Row>
                <h1>Account preferences</h1>
                <Button
                    text='Muted users'
                    color='blue'
                    onClick={() => setMuteUserModalOpen(true)}
                    style={{ marginBottom: 40 }}
                />
                <h1>Exit</h1>
                <Button
                    text='Delete account'
                    color='red'
                    onClick={() => setDeleteAccountModalOpen(true)}
                    // style={{ marginTop: 20 }}
                />
            </Column>
            {userNameModalOpen && <UpdateUserNameModal close={() => setUserNameModalOpen(false)} />}
            {userBioModalOpen && <UpdateUserBioModal close={() => setUserBioModalOpen(false)} />}
            {userEmailModalOpen && (
                <UpdateUserEmailModal close={() => setUserEmailModalOpen(false)} />
            )}
            {muteUserModalOpen && <MuteUserModal close={() => setMuteUserModalOpen(false)} />}
            {deleteAccountModalOpen && (
                <DeleteAccountModal close={() => setDeleteAccountModalOpen(false)} />
            )}
        </Column>
    )
}

export default Settings
