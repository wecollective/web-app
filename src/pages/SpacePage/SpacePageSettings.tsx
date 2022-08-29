import Button from '@components/Button'
import Column from '@components/Column'
import DraftText from '@components/DraftText'
import DeleteSpaceModal from '@components/modals/DeleteSpaceModal'
import InviteSpaceModeratorModal from '@components/modals/InviteSpaceModeratorModal'
import ParentSpaceRequestModal from '@components/modals/ParentSpaceRequestModal'
import RemoveChildSpaceModal from '@components/modals/RemoveChildSpaceModal'
import RemoveParentSpaceModal from '@components/modals/RemoveParentSpaceModal'
import RemoveSpaceModeratorModal from '@components/modals/RemoveSpaceModeratorModal'
import UpdateSpaceDescriptionModal from '@components/modals/UpdateSpaceDescriptionModal'
import UpdateSpaceHandleModal from '@components/modals/UpdateSpaceHandleModal'
import UpdateSpaceNameModal from '@components/modals/UpdateSpaceNameModal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import styles from '@styles/pages/SpacePage/SpacePageSettings.module.scss'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const SpacePageSettings = ({ history }): JSX.Element => {
    const { spaceData, spaceNotFound, isModerator } = useContext(SpaceContext)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const [spaceHandleModalOpen, setSpaceHandleModalOpen] = useState(false)
    const [spaceNameModalOpen, setSpaceNameModalOpen] = useState(false)
    const [spaceDescriptionModalOpen, setSpaceDescriptionModalOpen] = useState(false)
    const [inviteSpaceModeratorModalOpen, setInviteSpaceModeratorModalOpen] = useState(false)
    const [removeSpaceModeratorModalOpen, setRemoveSpaceModeratorModalOpen] = useState(false)
    const [parentSpaceRequestModalOpen, setParentSpaceRequestModalOpen] = useState(false)
    const [removeParentSpaceModalOpen, setRemoveParentSpaceModalOpen] = useState(false)
    const [removeChildSpaceModalOpen, setRemoveChildSpaceModalOpen] = useState(false)
    const [deleteSpaceModalOpen, setDeleteSpaceModalOpen] = useState(false)

    useEffect(() => {
        if (spaceData.handle === spaceHandle && !isModerator)
            history.push(`/s/${spaceHandle}/posts`)
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
                        {spaceHandleModalOpen && (
                            <UpdateSpaceHandleModal close={() => setSpaceHandleModalOpen(false)} />
                        )}
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
                        {spaceNameModalOpen && (
                            <UpdateSpaceNameModal close={() => setSpaceNameModalOpen(false)} />
                        )}
                    </Row>
                    <Column centerX>
                        <h1>Description:</h1>
                        <ShowMoreLess height={75}>
                            <DraftText text={spaceData.description || ''} />
                        </ShowMoreLess>
                        <Button
                            text='Edit'
                            color='blue'
                            size='medium'
                            style={{ marginTop: 10 }}
                            onClick={() => setSpaceDescriptionModalOpen(true)}
                        />
                        {spaceDescriptionModalOpen && (
                            <UpdateSpaceDescriptionModal
                                close={() => setSpaceDescriptionModalOpen(false)}
                            />
                        )}
                    </Column>
                    <Row>
                        <Button
                            text='Invite moderator'
                            color='blue'
                            onClick={() => setInviteSpaceModeratorModalOpen(true)}
                        />
                        {inviteSpaceModeratorModalOpen && (
                            <InviteSpaceModeratorModal
                                close={() => setInviteSpaceModeratorModalOpen(false)}
                            />
                        )}
                    </Row>
                    <Row>
                        <Button
                            text='Remove moderator'
                            color='blue'
                            onClick={() => setRemoveSpaceModeratorModalOpen(true)}
                        />
                        {removeSpaceModeratorModalOpen && (
                            <RemoveSpaceModeratorModal
                                close={() => setRemoveSpaceModeratorModalOpen(false)}
                            />
                        )}
                    </Row>
                    {spaceData.id !== 1 && (
                        <>
                            <Row>
                                <Button
                                    text='Add parent space'
                                    color='blue'
                                    onClick={() => setParentSpaceRequestModalOpen(true)}
                                />
                                {parentSpaceRequestModalOpen && (
                                    <ParentSpaceRequestModal
                                        close={() => setParentSpaceRequestModalOpen(false)}
                                    />
                                )}
                            </Row>
                            <Row>
                                <Button
                                    text='Remove parent space'
                                    color='blue'
                                    onClick={() => setRemoveParentSpaceModalOpen(true)}
                                />
                                {removeParentSpaceModalOpen && (
                                    <RemoveParentSpaceModal
                                        close={() => setRemoveParentSpaceModalOpen(false)}
                                    />
                                )}
                            </Row>
                            <Row>
                                <Button
                                    text='Remove child space'
                                    color='blue'
                                    onClick={() => setRemoveChildSpaceModalOpen(true)}
                                />
                                {removeChildSpaceModalOpen && (
                                    <RemoveChildSpaceModal
                                        close={() => setRemoveChildSpaceModalOpen(false)}
                                    />
                                )}
                            </Row>
                            <Row>
                                <Button
                                    text='Delete'
                                    color='red'
                                    onClick={() => setDeleteSpaceModalOpen(true)}
                                />
                                {deleteSpaceModalOpen && (
                                    <DeleteSpaceModal
                                        close={() => setDeleteSpaceModalOpen(false)}
                                    />
                                )}
                            </Row>
                        </>
                    )}
                </Column>
            )}
        </Column>
    )
}

export default SpacePageSettings
