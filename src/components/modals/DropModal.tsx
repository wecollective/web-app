import Button from '@components/Button'
import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import MediumSquareCard from '@components/cards/MediumSquareCard'
import BeadCard from '@components/cards/PostCard/BeadCard'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/components/modals/DropModal.module.scss'
import { ArrowRightIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function DropModal(): JSX.Element {
    const { accountData, setDropModalOpen, setDropLocation, dragItem, dropLocation } =
        useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [loading, setLoading] = useState(true)
    const [checkMessage, setCheckMessage] = useState('')
    const [saving, setSaving] = useState(false)
    const cookies = new Cookies()

    function repost() {
        setSaving(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = {
            accountHandle: accountData.handle,
            accountName: accountData.name,
            postId: dragItem.data.id,
            spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
            spaceIds: [dropLocation.data.id],
        }
        axios
            .post(`${config.apiURL}/repost-post`, data, options)
            .then(() => {
                setDropModalOpen(false)
                setDropLocation({ type: '', data: null })
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        // check if post can be reposted to target space
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = {
            sourceType: dragItem.type,
            sourceId: dragItem.data.id,
            targetType: dropLocation.type,
            targetId: dropLocation.data.id,
        }
        axios
            .post(`${config.apiURL}/check-drop`, data, options)
            .then((res) => {
                const { message } = res.data
                if (message === 'Already in space')
                    setCheckMessage(`Post already in '${dropLocation.data.name}'`)
                else if (message === 'Blocked by privacy rules') setCheckMessage(message)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }, [])

    return (
        <Modal centerX close={() => setDropModalOpen(false)} className={styles.wrapper}>
            <h1>Repost to {dropLocation.data.name}</h1>
            <Row centerY className={styles.action}>
                <BeadCard bead={dragItem.data} location='link-modal' className={styles.bead} />
                <ArrowRightIcon />
                <MediumSquareCard type={dropLocation.type} data={dropLocation.data} />
            </Row>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX style={{ marginTop: 20 }}>
                    {checkMessage && <p className='danger'>{checkMessage}</p>}
                    <Button
                        text='Repost'
                        color='blue'
                        disabled={loading || saving || !!checkMessage.length}
                        loading={saving}
                        onClick={repost}
                        style={{ marginTop: 20 }}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default DropModal
