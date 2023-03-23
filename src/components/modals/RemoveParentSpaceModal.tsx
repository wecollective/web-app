import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import Cookies from 'universal-cookie'

function RemoveParentSpaceModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { spaceData, setSpaceData } = useContext(SpaceContext)
    const [options, setOptions] = useState<any[]>([])
    const [selectedSpace, setSelectedSpace] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    const onlyOneParent = spaceData.DirectParentSpaces.length === 1
    const onlyParentIsRoot = onlyOneParent && spaceData.DirectParentSpaces[0].id === 1

    function findSpaces(query) {
        if (query.length < 1) setOptions([])
        else {
            const filteredSpaces = spaceData.DirectParentSpaces.filter(
                (space) =>
                    space.handle.includes(query.toLowerCase()) ||
                    space.name.toLowerCase().includes(query.toLowerCase())
            )
            setOptions(filteredSpaces)
        }
    }

    function selectSpace(user) {
        setOptions([])
        setSelectedSpace(user)
    }

    function removeParentSpace(e) {
        e.preventDefault()
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        const data = {
            childId: spaceData.id,
            parentId: selectedSpace.id,
            fromChild: true,
        }
        axios
            .post(`${config.apiURL}/remove-parent-relationship`, data, authHeader)
            .then(() => {
                setLoading(false)
                const newParentSpaces = spaceData.DirectParentSpaces.filter(
                    (s) => s.id !== selectedSpace.id
                )
                setSpaceData({
                    ...spaceData,
                    DirectParentSpaces: newParentSpaces,
                })
                setShowSuccessMessage(true)
                setTimeout(() => close(), 2000)
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal centered close={close} style={{ maxWidth: 600 }}>
            {showSuccessMessage ? (
                <SuccessMessage text='Parent space removed' />
            ) : (
                <Column centerX>
                    <h1>Remove a parent space</h1>
                    {onlyParentIsRoot ? (
                        <Column centerX>
                            <p style={{ marginBottom: 10 }}>
                                The only parent you&apos;re connected to at the moment is the root
                                space. To disconnect from there you need to attach to another parent
                                first, otherwise your space won&apos;t appear anywhere on the site.
                            </p>
                            <Button onClick={close} text='OK' color='blue' />
                        </Column>
                    ) : (
                        <Column centerX>
                            <Column>
                                {onlyOneParent && (
                                    <p style={{ marginBottom: 10 }}>
                                        &apos;{spaceData.name}&apos; only has one parent so it will
                                        be re-attached to the root space{' '}
                                        <Link to='/s/all/spaces'>all</Link> if you remove it.
                                    </p>
                                )}
                                <p style={{ marginBottom: 10 }}>
                                    Once removed, new posts to &apos;{spaceData.name}&apos; will no
                                    longer appear in the removed parent space.
                                </p>
                                <p>Old posts will remain where they were when posted.</p>
                            </Column>
                            <form onSubmit={removeParentSpace}>
                                <SearchSelector
                                    type='space'
                                    title="Search for the parent space's name or handle below:"
                                    placeholder='name or handle...'
                                    onSearchQuery={(query) => findSpaces(query)}
                                    onOptionSelected={(space) => selectSpace(space)}
                                    options={options}
                                    style={{ margin: '20px 0' }}
                                />
                                {selectedSpace && (
                                    <div className={styles.selectedOptionWrapper}>
                                        <p>Selected space:</p>
                                        <div className={styles.selectedOption}>
                                            <ImageTitle
                                                type='space'
                                                imagePath={selectedSpace.flagImagePath}
                                                title={`${selectedSpace.name} (${selectedSpace.handle})`}
                                            />
                                            <CloseButton
                                                size={17}
                                                onClick={() => setSelectedSpace(null)}
                                            />
                                        </div>
                                    </div>
                                )}
                                <Row centerX style={{ marginTop: 20 }}>
                                    <Button
                                        submit
                                        text='Remove parent space'
                                        color='blue'
                                        disabled={loading || !selectedSpace}
                                        loading={loading}
                                    />
                                </Row>
                            </form>
                        </Column>
                    )}
                </Column>
            )}
        </Modal>
    )
}

export default RemoveParentSpaceModal
