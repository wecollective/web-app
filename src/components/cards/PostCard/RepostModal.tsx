import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { pluralise } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/RepostModal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function RepostModal(props: {
    close: () => void
    postData: any
    setPostData: (payload: any) => void
}): JSX.Element {
    const { close, postData, setPostData } = props
    const { loggedIn, accountData, setLogInModalOpen, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [reposts, setReposts] = useState<any[]>([])
    const [indirectSpaces, setIndirectSpaces] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [responseLoading, setResponseLoading] = useState(false)
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([])
    const [checkingPrivacyAccess, setCheckingPrivacyAccess] = useState(false)
    const [spaceRestrictions, setSpaceRestrictions] = useState<any | null>(null)
    const cookies = new Cookies()
    const headerText = reposts.length
        ? `${reposts.length} repost${pluralise(reposts.length)}`
        : 'No reposts yet...'

    async function getRepostData() {
        const getReposts = await axios.get(`${config.apiURL}/post-reposts?postId=${postData.id}`)
        const getIndirectSpaces = await axios.get(
            `${config.apiURL}/post-indirect-spaces?postId=${postData.id}`
        )
        Promise.all([getReposts, getIndirectSpaces])
            .then((responses) => {
                setReposts(responses[0].data)
                setIndirectSpaces(responses[1].data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function findAllSpaceIds() {
        const ids = [
            ...reposts.map((r) => r.Space.id),
            ...postData.DirectSpaces.map((s) => s.id),
            ...indirectSpaces.map((s) => s.id),
            ...selectedSpaces.map((s) => s.id),
        ]
        const filteredIds = [...Array.from(new Set(ids))]
        return filteredIds
    }

    function findSpaces(query) {
        if (!query) setSpaceOptions([])
        else {
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const blacklist = findAllSpaceIds()
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
        const otherSpaceIds = findAllSpaceIds()
        const data = { newSpaceId: space.id, otherSpaceIds }
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
        const { blockedByNewSpace, blockedByOtherSpaces, newSpace, otherSpaces } = spaceRestrictions
        if (blockedByNewSpace) {
            return (
                <Column centerX className='warningContainer'>
                    <div style={{ display: 'inline' }}>
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <FlagImage type='space' imagePath={newSpace.flagImagePath} size={27} />
                        </div>{' '}
                        <b>{newSpace.name}</b> is blocked because it has restricted access and the
                        following other spaces the post appears{' '}
                        {selectedSpaces.length > 0 && `(or will appear)`} in exist outside of that
                        access bubble:
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
        if (blockedByOtherSpaces) {
            return (
                <Column centerX className='warningContainer'>
                    <div style={{ display: 'inline' }}>
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <FlagImage type='space' imagePath={newSpace.flagImagePath} size={27} />
                        </div>{' '}
                        <b>{newSpace.name}</b> is blocked because the following other spaces the
                        post appears {selectedSpaces.length > 0 && `(or will appear)`} in have
                        restricted access and it exists outside of their access bubble:
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
        setSpaceRestrictions(null)
        checkPrivacyAccess(space)
    }

    function removeSpace(spaceId) {
        setSpaceRestrictions(null)
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    function submitRepost() {
        setResponseLoading(true)
        const accessToken = cookies.get('accessToken')
        if (accessToken) {
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                postId: postData.id,
                spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
                spaceIds: selectedSpaces.map((space) => space.id),
            }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/repost-post`, data, authHeader)
                .then(() => {
                    setPostData({
                        ...postData,
                        totalReactions: postData.totalReactions + selectedSpaces.length,
                        totalReposts: postData.totalReposts + selectedSpaces.length,
                        accountRepost: true,
                    })
                    close()
                })
                .catch((error) => console.log(error))
        } else {
            close()
            setAlertMessage('Log in to like posts')
            setAlertModalOpen(true)
        }
    }

    useEffect(() => {
        getRepostData()
    }, [])

    return (
        <Modal close={close} style={{ width: 600 }} centered>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    <h1>{headerText}</h1>
                    {reposts.length > 0 && (
                        <Column centerX style={{ marginBottom: 20 }}>
                            {reposts.map((repost) => (
                                <div className={styles.repost} key={repost.id}>
                                    <ImageTitle
                                        type='user'
                                        imagePath={repost.Creator.flagImagePath}
                                        title={repost.Creator.name}
                                        link={`/u/${repost.Creator.handle}/posts`}
                                    />
                                    <p>to</p>
                                    <ImageTitle
                                        type='space'
                                        imagePath={repost.Space.flagImagePath}
                                        title={repost.Space.name}
                                        link={`/s/${repost.Space.handle}`}
                                    />
                                </div>
                            ))}
                        </Column>
                    )}
                    {loggedIn ? (
                        <Column centerX>
                            <SearchSelector
                                type='space'
                                title='Repost somewhere else (max 5 spaces):'
                                placeholder={`${
                                    selectedSpaces.length > 4
                                        ? 'max 5 spaces'
                                        : 'space name or handle...'
                                }`}
                                disabled={selectedSpaces.length > 4}
                                style={{ marginBottom: 20 }}
                                onSearchQuery={(query) => findSpaces(query)}
                                onOptionSelected={(space) => addSpace(space)}
                                options={spaceOptions}
                            />
                            {selectedSpaces.length > 0 && (
                                <Row style={{ marginBottom: 20 }} wrap centerX>
                                    {selectedSpaces.map((space) => (
                                        <Row
                                            centerY
                                            style={{ margin: '0 10px 10px 0' }}
                                            key={space.id}
                                        >
                                            <ImageTitle
                                                type='user'
                                                imagePath={space.flagImagePath}
                                                title={`${space.name} (${space.handle})`}
                                                imageSize={27}
                                                style={{ marginRight: 3 }}
                                            />
                                            <CloseButton
                                                size={17}
                                                onClick={() => removeSpace(space.id)}
                                            />
                                        </Row>
                                    ))}
                                </Row>
                            )}
                            {checkingPrivacyAccess ? (
                                <Row style={{ marginBottom: 20 }}>
                                    <p style={{ marginRight: 10 }}>Checking privacy access</p>
                                    <LoadingWheel size={25} />
                                </Row>
                            ) : (
                                <Column>
                                    {spaceRestrictions && (
                                        <Column style={{ marginBottom: 20, maxWidth: 500 }}>
                                            {findBlockedByMessage()}
                                        </Column>
                                    )}
                                </Column>
                            )}
                            <Button
                                text='Repost'
                                color='blue'
                                disabled={!selectedSpaces.length}
                                loading={responseLoading}
                                style={{ marginRight: 5 }}
                                onClick={submitRepost}
                            />
                        </Column>
                    ) : (
                        <Row centerY style={{ marginTop: reposts.length ? 10 : 0 }}>
                            <Button
                                text='Log in'
                                color='blue'
                                style={{ marginRight: 5 }}
                                onClick={() => {
                                    setLogInModalOpen(true)
                                    close()
                                }}
                            />
                            <p>to repost posts</p>
                        </Row>
                    )}
                </Column>
            )}
        </Modal>
    )
}

export default RepostModal
