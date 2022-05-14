import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageSettings.module.scss'
import Button from '@components/Button'
import ShowMoreLess from '@components/ShowMoreLess'
import Markdown from '@components/Markdown'
import Column from '@components/Column'
import Row from '@components/Row'
import UpdateSpaceHandleModal from '@src/components/modals/UpdateSpaceHandleModal'
import UpdateSpaceNameModal from '@src/components/modals/UpdateSpaceNameModal'
import UpdateSpaceDescriptionModal from '@src/components/modals/UpdateSpaceDescriptionModal'
import InviteSpaceModeratorModal from '@src/components/modals/InviteSpaceModeratorModal'
import RemoveSpaceModeratorModal from '@src/components/modals/RemoveSpaceModeratorModal'
import ParentSpaceRequestModal from '@src/components/modals/ParentSpaceRequestModal'
import RemoveParentSpaceModal from '@src/components/modals/RemoveParentSpaceModal'
import RemoveChildSpaceModal from '@src/components/modals/RemoveChildSpaceModal'
import DeleteSpaceModal from '@src/components/modals/DeleteSpaceModal'
import SpaceNotFound from '@pages/SpaceNotFound'

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
        <Column className={styles.wrapper}>
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
                    <Column style={{ alignItems: 'start' }}>
                        <h1>Description:</h1>
                        <ShowMoreLess height={75}>
                            <Markdown text={spaceData.description || ''} />
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
