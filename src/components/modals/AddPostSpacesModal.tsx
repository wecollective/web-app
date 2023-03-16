import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import config from '@src/Config'
import axios from 'axios'
import React, { useState } from 'react'
import Cookies from 'universal-cookie'

const AddPostSpacesModal = (props: {
    spaces: any[]
    setSpaces: (spaces: any[]) => void
    close: () => void
}): JSX.Element => {
    const { spaces, setSpaces, close } = props
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>(spaces)
    const [spacesError, setSpacesError] = useState(false)
    const [checkingPrivacyAccess, setCheckingPrivacyAccess] = useState(false)
    const [spaceRestrictions, setSpaceRestrictions] = useState<any | null>(null)
    const cookies = new Cookies()

    function findSpaces(query) {
        if (!query) setSpaceOptions([])
        else {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const blacklist = [...selectedSpaces.map((s) => s.id)]
            const data = { query, blacklist, spaceAccessRequired: true }
            axios
                .post(`${config.apiURL}/find-spaces`, data, options)
                .then((res) => setSpaceOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function checkPrivacyAccess(space) {
        // check privacy access for selected space
        setCheckingPrivacyAccess(true)
        const data = { newSpaceId: space.id, otherSpaceIds: selectedSpaces.map((s) => s.id) }
        axios
            .post(`${config.apiURL}/post-space-privacy-check`, data)
            .then((res) => {
                const { blockedByNewSpace, blockedByOtherSpaces, otherSpaces } = res.data
                if (blockedByNewSpace || blockedByOtherSpaces) {
                    setSpaceRestrictions({
                        blockedByNewSpace,
                        blockedByOtherSpaces,
                        otherSpaces,
                        newSpace: space,
                    })
                } else setSelectedSpaces((s) => [...s, space])
                setCheckingPrivacyAccess(false)
            })
            .catch((error) => console.log(error))
    }

    function findBlockedByMessage() {
        // if space blocked, display explanation to user
        const { blockedByNewSpace, blockedByOtherSpaces, newSpace, otherSpaces } = spaceRestrictions
        const explanation = blockedByNewSpace
            ? 'it has restricted access and the following spaces would leak the post outside of that access bubble:'
            : 'the following spaces have restricted access and it would leak the post outside of their access bubble:'
        if (blockedByNewSpace || blockedByOtherSpaces) {
            return (
                <Column centerX className='warningContainer'>
                    <div style={{ display: 'inline' }}>
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <FlagImage type='space' imagePath={newSpace.flagImagePath} size={27} />
                        </div>{' '}
                        <b>{newSpace.name}</b> is blocked because {explanation}
                    </div>
                    <Column>
                        {otherSpaces.map((s) => (
                            <ImageTitle
                                key={s.id}
                                type='space'
                                imagePath={s.flagImagePath}
                                title={`${s.name} (s/${s.handle})`}
                                fontSize={16}
                                style={{ marginTop: 10 }}
                            />
                        ))}
                    </Column>
                </Column>
            )
        }
        return null
    }

    function addSpace(space) {
        setSpaceOptions([])
        setSpacesError(false)
        setSpaceRestrictions(null)
        checkPrivacyAccess(space)
    }

    function removeSpace(spaceId) {
        setSpaceRestrictions(null)
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    function saveSpaces() {
        if (!selectedSpaces.length) setSpacesError(true)
        else {
            setSpaces(selectedSpaces)
            close()
        }
    }

    return (
        <Modal centered close={close} style={{ overflow: 'unset' }}>
            <h1>Add spaces</h1>
            <p>Choose where you want the post to appear</p>
            <SearchSelector
                type='space'
                placeholder='space name or handle...'
                onSearchQuery={(query) => findSpaces(query)}
                onOptionSelected={(space) => addSpace(space)}
                options={spaceOptions}
            />
            {selectedSpaces.length > 0 && (
                <Column centerX style={{ marginTop: 10 }}>
                    {selectedSpaces.map((space) => (
                        <Row key={space.id} centerY style={{ marginTop: 10 }}>
                            <ImageTitle
                                type='space'
                                imagePath={space.flagImagePath}
                                title={`${space.name} (${space.handle})`}
                                imageSize={35}
                                fontSize={16}
                                style={{ marginRight: 5 }}
                            />
                            <CloseButton size={17} onClick={() => removeSpace(space.id)} />
                        </Row>
                    ))}
                </Column>
            )}
            {checkingPrivacyAccess ? (
                <Row style={{ marginTop: 20 }}>
                    <p style={{ marginRight: 10 }}>Checking privacy access</p>
                    <LoadingWheel size={25} />
                </Row>
            ) : (
                <Column>
                    {spaceRestrictions && (
                        <Column style={{ marginTop: 20, maxWidth: 500, position: 'relative' }}>
                            <CloseButton
                                size={17}
                                onClick={() => setSpaceRestrictions(null)}
                                style={{ position: 'absolute', top: 6, right: 6 }}
                            />
                            {findBlockedByMessage()}
                        </Column>
                    )}
                </Column>
            )}
            {spacesError && (
                <p className='danger' style={{ margin: '20px 0 0 0' }}>
                    No spaces selected
                </p>
            )}
            <Button
                text='Save spaces'
                color='blue'
                onClick={saveSpaces}
                style={{ marginTop: 30 }}
            />
        </Modal>
    )
}

export default AddPostSpacesModal
