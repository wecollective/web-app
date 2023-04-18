import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Modal from '@components/modals/Modal'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/components/modals/Modal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function RemoveChildSpaceModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { spaceData } = useContext(SpaceContext)
    const [options, setOptions] = useState<any[]>([])
    const [selectedSpace, setSelectedSpace] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function findSpaces(query) {
        if (query.length < 1) setOptions([])
        else {
            const accessToken = cookies.get('accessToken')
            const headerOptions = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .get(
                    `${config.apiURL}/find-child-spaces?spaceId=${spaceData.id}&query=${query}`,
                    headerOptions
                )
                .then((res) => setOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function selectSpace(space) {
        setOptions([])
        setSelectedSpace(space)
    }

    function removeChildSpace() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        const data = {
            childId: selectedSpace.id,
            parentId: spaceData.id,
            fromChild: false,
        }
        axios
            .post(`${config.apiURL}/remove-parent-relationship`, data, authHeader)
            .then(() => {
                setLoading(false)
                setShowSuccessMessage(true)
                setTimeout(() => close(), 1000)
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal centerX close={close}>
            <Column centerX style={{ maxWidth: 600 }}>
                <h1>Remove a child space from &apos;{spaceData.name}&apos;</h1>
                <Column style={{ marginBottom: 20 }}>
                    <p style={{ marginBottom: 10 }}>
                        Once removed, new posts to the selected child space will no longer appear in
                        &apos;
                        {spaceData.name}&apos;.
                    </p>
                    <p>Old posts will remain where they were when posted.</p>
                </Column>
                <SearchSelector
                    type='space'
                    title="Search for the child space's name or handle below:"
                    placeholder='name or handle...'
                    onSearchQuery={(query) => findSpaces(query)}
                    onOptionSelected={(space) => selectSpace(space)}
                    onBlur={() => setTimeout(() => setOptions([]), 200)}
                    options={options}
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
                            <CloseButton size={17} onClick={() => setSelectedSpace(null)} />
                        </div>
                    </div>
                )}
                <div className={styles.footer}>
                    <Button
                        text='Remove child space'
                        color='blue'
                        onClick={removeChildSpace}
                        loading={loading}
                        disabled={loading || showSuccessMessage || !selectedSpace}
                        style={{ marginRight: 10 }}
                    />
                    {showSuccessMessage && <SuccessMessage text='Child space removed' />}
                </div>
            </Column>
        </Modal>
    )
}

export default RemoveChildSpaceModal
