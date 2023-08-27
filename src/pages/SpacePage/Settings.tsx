import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import Row from '@components/Row'
import DraftText from '@components/draft-js/DraftText'
import DeleteSpaceModal from '@components/modals/DeleteSpaceModal'
import InviteSpaceModeratorModal from '@components/modals/InviteSpaceModeratorModal'
import ParentSpaceRequestModal from '@components/modals/ParentSpaceRequestModal'
import RemoveChildSpaceModal from '@components/modals/RemoveChildSpaceModal'
import RemoveParentSpaceModal from '@components/modals/RemoveParentSpaceModal'
import RemoveSpaceModeratorModal from '@components/modals/RemoveSpaceModeratorModal'
import UpdateSpaceDescriptionModal from '@components/modals/UpdateSpaceDescriptionModal'
import UpdateSpaceHandleModal from '@components/modals/UpdateSpaceHandleModal'
import UpdateSpaceNameModal from '@components/modals/UpdateSpaceNameModal'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import config from '@src/Config'
import InviteSpaceUsersModal from '@src/components/modals/InviteSpaceUsersModal'
import styles from '@styles/pages/SpacePage/Settings.module.scss'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function Settings(): JSX.Element {
    const { spaceData, spaceNotFound, isModerator } = useContext(SpaceContext)
    const location = useLocation()
    const history = useNavigate()
    const spaceHandle = location.pathname.split('/')[2]
    const [spaceHandleModalOpen, setSpaceHandleModalOpen] = useState(false)
    const [spaceNameModalOpen, setSpaceNameModalOpen] = useState(false)
    const [spaceDescriptionModalOpen, setSpaceDescriptionModalOpen] = useState(false)
    const [inviteSpaceUsersModalOpen, setInviteSpaceUsersModalOpen] = useState(false)
    const [inviteSpaceModeratorModalOpen, setInviteSpaceModeratorModalOpen] = useState(false)
    const [removeSpaceModeratorModalOpen, setRemoveSpaceModeratorModalOpen] = useState(false)
    const [parentSpaceRequestModalOpen, setParentSpaceRequestModalOpen] = useState(false)
    const [removeParentSpaceModalOpen, setRemoveParentSpaceModalOpen] = useState(false)
    const [removeChildSpaceModalOpen, setRemoveChildSpaceModalOpen] = useState(false)
    const [deleteSpaceModalOpen, setDeleteSpaceModalOpen] = useState(false)

    useEffect(() => {
        if (spaceData.handle === spaceHandle && !isModerator) history(`/s/${spaceHandle}/posts`)
    }, [spaceData.handle])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {spaceData.handle !== spaceHandle || !isModerator ? (
                <p>Space data loading... </p>
            ) : (
                <Column centerX className={styles.content}>
                    <Row centerY>
                        <h1>Handle:</h1>
                        <p>{spaceData.handle}</p>
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            onClick={() => setSpaceHandleModalOpen(true)}
                        />
                    </Row>
                    <Row centerY>
                        <h1>Name:</h1>
                        <p>{spaceData.name}</p>
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            onClick={() => setSpaceNameModalOpen(true)}
                        />
                    </Row>
                    <Column centerX>
                        <h1>Description:</h1>
                        {/* <ShowMoreLess height={75}> */}
                        <DraftText stringifiedDraft={spaceData.description || ''} />
                        {/* </ShowMoreLess> */}
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            style={{ marginTop: 10 }}
                            onClick={() => setSpaceDescriptionModalOpen(true)}
                        />
                    </Column>
                    {spaceData.privacy === 'private' && (
                        <>
                            <Button
                                text='Invite users'
                                color='blue'
                                onClick={() => setInviteSpaceUsersModalOpen(true)}
                            />
                            <p>User invite link:</p>
                            <Input
                                type='text'
                                value={`${config.appURL}/s/${spaceData.handle}/posts?inviteToken=${spaceData.inviteToken}`}
                                style={{ width: '100%', maxWidth: 300, marginTop: 10 }}
                            />
                        </>
                    )}
                    <Button
                        text='Invite moderator'
                        color='blue'
                        onClick={() => setInviteSpaceModeratorModalOpen(true)}
                    />
                    <Button
                        text='Remove moderator'
                        color='blue'
                        onClick={() => setRemoveSpaceModeratorModalOpen(true)}
                    />
                    {spaceData.id !== 1 && (
                        <>
                            <Button
                                text='Add parent space'
                                color='blue'
                                onClick={() => setParentSpaceRequestModalOpen(true)}
                            />
                            <Button
                                text='Remove parent space'
                                color='blue'
                                onClick={() => setRemoveParentSpaceModalOpen(true)}
                            />
                            <Button
                                text='Remove child space'
                                color='blue'
                                onClick={() => setRemoveChildSpaceModalOpen(true)}
                            />
                            <Button
                                text='Delete'
                                color='red'
                                onClick={() => setDeleteSpaceModalOpen(true)}
                            />
                        </>
                    )}
                </Column>
            )}
            {spaceHandleModalOpen && (
                <UpdateSpaceHandleModal close={() => setSpaceHandleModalOpen(false)} />
            )}
            {spaceNameModalOpen && (
                <UpdateSpaceNameModal close={() => setSpaceNameModalOpen(false)} />
            )}
            {spaceDescriptionModalOpen && (
                <UpdateSpaceDescriptionModal close={() => setSpaceDescriptionModalOpen(false)} />
            )}
            {inviteSpaceUsersModalOpen && (
                <InviteSpaceUsersModal close={() => setInviteSpaceUsersModalOpen(false)} />
            )}
            {inviteSpaceModeratorModalOpen && (
                <InviteSpaceModeratorModal close={() => setInviteSpaceModeratorModalOpen(false)} />
            )}
            {removeSpaceModeratorModalOpen && (
                <RemoveSpaceModeratorModal close={() => setRemoveSpaceModeratorModalOpen(false)} />
            )}
            {parentSpaceRequestModalOpen && (
                <ParentSpaceRequestModal close={() => setParentSpaceRequestModalOpen(false)} />
            )}
            {removeParentSpaceModalOpen && (
                <RemoveParentSpaceModal close={() => setRemoveParentSpaceModalOpen(false)} />
            )}
            {removeChildSpaceModalOpen && (
                <RemoveChildSpaceModal close={() => setRemoveChildSpaceModalOpen(false)} />
            )}
            {deleteSpaceModalOpen && (
                <DeleteSpaceModal close={() => setDeleteSpaceModalOpen(false)} />
            )}
        </Column>
    )
}

export default Settings
