import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import SearchSelector from '@components/SearchSelector'
import SuccessMessage from '@components/SuccessMessage'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/components/SidebarSmall.module.scss'
import { PlusIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import Cookies from 'universal-cookie'

const SidebarSmall = (): JSX.Element | null => {
    const { accountData, updateAccountData, loggedIn } = useContext(AccountContext)
    const { selectedSpaceSubPage } = useContext(SpaceContext)
    const { FollowedSpaces: joinedSpaces } = accountData

    const [joinSpacesModalOpen, setJoinSpacesModalOpen] = useState(false)
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const cookies = new Cookies()

    function findSpaces(query) {
        if (!query) setSpaceOptions([])
        else {
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const blacklist = [...joinedSpaces.map((s) => s.id), ...selectedSpaces.map((s) => s.id)]
            const data = { query, blacklist }
            axios
                .post(`${config.apiURL}/find-spaces`, data, options)
                .then((res) => setSpaceOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function addSpace(space) {
        setSpaceOptions([])
        setSelectedSpaces((s) => [...s, space])
    }

    function removeSpace(spaceId) {
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    function joinSpaces() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        const spaceIds = selectedSpaces.map((s) => s.id)
        axios
            .post(`${config.apiURL}/join-spaces`, spaceIds, options)
            .then(() => {
                const newJoinedSpaces = [...joinedSpaces]
                selectedSpaces.forEach((space) => newJoinedSpaces.push(space))
                updateAccountData('FollowedSpaces', newJoinedSpaces)
                setLoading(false)
                setSuccess(true)
            })
            .catch((error) => console.log(error))
    }

    if (!loggedIn) return null
    return (
        <Column className={styles.wrapper}>
            <Column centerX className={styles.container}>
                <Column className={styles.section}>
                    {joinedSpaces.map((space) => (
                        <Link
                            key={space.id}
                            to={`/s/${space.handle}/${selectedSpaceSubPage || 'posts'}`}
                        >
                            <FlagImage type='space' size={50} imagePath={space.flagImagePath} />
                        </Link>
                    ))}
                    <button
                        className={styles.joinSpacesButton}
                        type='button'
                        onClick={() => setJoinSpacesModalOpen(true)}
                    >
                        <PlusIcon />
                    </button>
                </Column>
            </Column>
            {joinSpacesModalOpen && (
                <Modal
                    centered
                    close={() => {
                        setJoinSpacesModalOpen(false)
                        setSuccess(false)
                        setSelectedSpaces([])
                    }}
                    style={{ maxWidth: 600, overflow: 'visible' }}
                >
                    {!success ? (
                        <Column centerX>
                            <h1>Search for spaces to join</h1>
                            <SearchSelector
                                type='space'
                                placeholder='Space name or handle...'
                                onSearchQuery={(query) => findSpaces(query)}
                                onOptionSelected={(space) => addSpace(space)}
                                options={spaceOptions}
                                style={{ margin: '25px 0' }}
                            />
                            {selectedSpaces.length > 0 && (
                                <Column centerX style={{ marginBottom: 20 }}>
                                    {selectedSpaces.map((space) => (
                                        <Row centerY style={{ marginBottom: 15 }} key={space.id}>
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
                                </Column>
                            )}
                            <Button
                                text={`Join space${selectedSpaces.length > 1 ? 's' : ''}`}
                                color='blue'
                                disabled={!selectedSpaces.length || loading}
                                loading={loading}
                                onClick={joinSpaces}
                                style={{ marginTop: 25 }}
                            />
                        </Column>
                    ) : (
                        <SuccessMessage text='Spaces joined!' />
                    )}
                </Modal>
            )}
        </Column>
    )
}

export default SidebarSmall
