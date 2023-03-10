import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

const ParentSpaceRequestModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const { accountData } = useContext(AccountContext)
    const { spaceData, setSpaceData } = useContext(SpaceContext)
    const [blacklist, setBlacklist] = useState<string[]>([])
    const [blacklistRetrieved, setBlacklistRetrieved] = useState(false)
    const [options, setOptions] = useState<any[]>([])
    const [selectedSpace, setSelectedSpace] = useState<any>(null)
    const [checkingPrivacyAccess, setCheckingPrivacyAccess] = useState(false)
    const [blockedBy, setBlockedBy] = useState<any | null>(null)
    const [modOfSelectedSpace, setModOfSelectedSpace] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const cookies = new Cookies()

    function getParentSpaceBlacklist() {
        // blacklist: root space 'all', current space, existing parents, all descendents (to prevent loops)
        axios
            .get(`${config.apiURL}/parent-space-blacklist?spaceId=${spaceData.id}`)
            .then((res) => {
                setBlacklist(res.data)
                setBlacklistRetrieved(true)
            })
            .catch((error) => console.log(error))
    }

    function findSpaces(query) {
        // find non-blacklisted spaces (checks for ancestor access)
        if (query.length < 1) setOptions([])
        else if (blacklistRetrieved) {
            const accessToken = cookies.get('accessToken')
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = { spaceId: spaceData.id, query, blacklist }
            axios
                .post(`${config.apiURL}/viable-parent-spaces`, data, authHeader)
                .then((res) => setOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function checkPrivacyAccess(parentSpace) {
        // check privacy access for selected space
        setCheckingPrivacyAccess(true)
        setBlockedBy(null)
        const data = { childId: spaceData.id, parent: parentSpace }
        axios
            .post(`${config.apiURL}/parent-space-privacy-check`, data)
            .then((res) => {
                const { childBlockedBy, parentBlockedBy } = res.data
                if (childBlockedBy.length || parentBlockedBy.length)
                    setBlockedBy({ childBlockedBy, parentBlockedBy })
                else setBlockedBy(null)
                setCheckingPrivacyAccess(false)
            })
            .catch((error) => console.log(error))
    }

    function findBlockedByMessage() {
        const { childBlockedBy, parentBlockedBy } = blockedBy
        if (childBlockedBy.length) {
            return (
                <Column centerX className='warningContainer'>
                    <div style={{ display: 'inline' }}>
                        This connection is blocked because{' '}
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <FlagImage type='space' imagePath={spaceData.flagImagePath} size={27} />
                        </div>{' '}
                        <b>{spaceData.name}</b> exists within the following private spaces:
                    </div>
                    <Column>
                        {childBlockedBy.map((s) => (
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
        if (parentBlockedBy.length) {
            const blockedBySelectedSpace = parentBlockedBy.find((s) => s.id === selectedSpace.id)
            if (blockedBySelectedSpace) {
                return (
                    <Column className='warningContainer'>
                        <div style={{ display: 'inline' }}>
                            This connection is blocked because{' '}
                            <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                <FlagImage
                                    type='space'
                                    imagePath={selectedSpace.flagImagePath}
                                    size={27}
                                />
                            </div>{' '}
                            <b>{selectedSpace.name}</b> is private
                        </div>
                    </Column>
                )
            }
            return (
                <Column centerX className='warningContainer'>
                    <div style={{ display: 'inline' }}>
                        This connection is blocked because{' '}
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <FlagImage
                                type='space'
                                imagePath={selectedSpace.flagImagePath}
                                size={27}
                            />
                        </div>{' '}
                        <b>{selectedSpace.name}</b> exists within the following private spaces:
                    </div>
                    <Column>
                        {parentBlockedBy.map((s) => (
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

    function findAccessMessage() {
        if (modOfSelectedSpace) {
            return (
                <Column centerX className='successContainer'>
                    <div style={{ display: 'inline' }}>
                        This connection is allowed and you&apos;re a moderator of{' '}
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <FlagImage
                                type='space'
                                imagePath={selectedSpace.flagImagePath}
                                size={27}
                            />
                        </div>{' '}
                        <b>{selectedSpace.name}</b> so it can be connected immediatley
                    </div>
                </Column>
            )
        }
        return (
            <Column centerX className='successContainer'>
                <div style={{ display: 'inline' }}>
                    This connection is allowed but you&apos;re not a moderator of{' '}
                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <FlagImage type='space' imagePath={selectedSpace.flagImagePath} size={27} />
                    </div>{' '}
                    <b>{selectedSpace.name}</b> so a request will be sent to its moderators first.
                </div>
            </Column>
        )
    }

    function selectSpace(space) {
        setOptions([])
        setModOfSelectedSpace(space.Moderators.map((m) => m.id).includes(accountData.id))
        setSelectedSpace(space)
        checkPrivacyAccess(space)
    }

    function addParentSpace() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
        if (modOfSelectedSpace) {
            // add parent space
            const data = { childId: spaceData.id, parentId: selectedSpace.id }
            axios
                .post(`${config.apiURL}/add-parent-space`, data, authHeader)
                .then(() => {
                    setLoading(false)
                    // todo: review as DirectParents not necessary present...
                    // remove root space if present
                    const newParentSpaces = spaceData.DirectParentSpaces.filter((s) => s.id !== 1)
                    // add new parent space
                    newParentSpaces.push(selectedSpace)
                    // update space context
                    setSpaceData({
                        ...spaceData,
                        DirectParentSpaces: newParentSpaces,
                    })
                    setShowSuccessMessage(true)
                    setTimeout(() => close(), 3000)
                })
                .catch((error) => console.log(error))
        } else {
            // send parent space request
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                childId: spaceData.id,
                childName: spaceData.name,
                childHandle: spaceData.handle,
                parentId: selectedSpace.id,
            }
            axios
                .post(`${config.apiURL}/send-parent-space-request`, data, authHeader)
                .then(() => {
                    setLoading(false)
                    setShowSuccessMessage(true)
                    setTimeout(() => close(), 2000)
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => getParentSpaceBlacklist(), [])

    return (
        <Modal centered close={close} style={{ maxWidth: 600 }}>
            <h1>Add a new parent space</h1>
            <div style={{ display: 'inline', marginBottom: 20 }}>
                Once connected, new posts to{' '}
                <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <FlagImage type='space' imagePath={spaceData.flagImagePath} size={27} />
                </div>{' '}
                <b>{spaceData.name}</b> will appear in the selected parent space and all of its
                ancestors (unless blocked by privacy settings).
            </div>
            <Column centerX>
                <SearchSelector
                    type='space'
                    title="Search for the parent space's name or handle below:"
                    placeholder='name or handle...'
                    onSearchQuery={(query) => findSpaces(query)}
                    onOptionSelected={(space) => selectSpace(space)}
                    options={options}
                />
                {selectedSpace && (
                    <Column centerX style={{ marginTop: 20 }}>
                        <p>Selected parent space:</p>
                        <Row centerY style={{ margin: '10px 0 20px 0' }}>
                            <ImageTitle
                                type='space'
                                imagePath={selectedSpace.flagImagePath}
                                title={`${selectedSpace.name} (s/${selectedSpace.handle})`}
                                fontSize={16}
                                style={{ marginRight: 10 }}
                            />
                            <CloseButton size={17} onClick={() => setSelectedSpace(null)} />
                        </Row>
                        {checkingPrivacyAccess ? (
                            <Row>
                                <p style={{ marginRight: 10 }}>Checking privacy access</p>
                                <LoadingWheel size={25} />
                            </Row>
                        ) : (
                            <Column>
                                {blockedBy ? findBlockedByMessage() : findAccessMessage()}
                            </Column>
                        )}
                    </Column>
                )}
                <Column centerX style={{ marginTop: 30 }}>
                    <Button
                        text={modOfSelectedSpace ? 'Connect parent space' : 'Send request'}
                        color='blue'
                        style={{ marginBottom: 20 }}
                        disabled={
                            loading ||
                            showSuccessMessage ||
                            !selectedSpace ||
                            checkingPrivacyAccess ||
                            blockedBy
                        }
                        loading={loading}
                        onClick={addParentSpace}
                    />
                    {showSuccessMessage && (
                        <SuccessMessage
                            text={modOfSelectedSpace ? 'Parent space connected!' : 'Request sent!'}
                        />
                    )}
                </Column>
            </Column>
        </Modal>
    )
}

export default ParentSpaceRequestModal
