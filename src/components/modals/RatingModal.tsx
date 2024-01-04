import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { pluralise } from '@src/Helpers'
import styles from '@styles/components/modals/RatingModal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function RatingModal(props: {
    itemType: 'post'
    itemData: any
    updateItem: () => void
    close: () => void
}): JSX.Element {
    const { itemType, itemData, updateItem, close } = props
    const { id, rated } = itemData
    const { loggedIn, accountData, setLogInModalOpen, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [ratings, setRatings] = useState<any[]>([])
    const [averageScore, setAverageScore] = useState(0)
    const [newRating, setNewRating] = useState(100)
    const [loading, setLoading] = useState(true)
    const [responseLoading, setResponseLoading] = useState(false)
    const cookies = new Cookies()
    const headerText = ratings.length
        ? `${ratings.length} signal${pluralise(ratings.length)}`
        : 'No signal yet...'
    const mobileView = document.documentElement.clientWidth < 900

    function getRatings() {
        axios
            .get(`${config.apiURL}/ratings?itemType=${itemType}&itemId=${id}`)
            .then((res) => {
                setRatings(res.data)
                setAverageScore(
                    res.data.map((r) => r.value).reduce((a, b) => a + b, 0) / res.data.length
                )
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function toggleRating() {
        setResponseLoading(true)
        const data = { itemType, itemId: id } as any
        if (!rated) {
            // todo: get user data server side
            data.accountHandle = accountData.handle
            data.accountName = accountData.name
            data.spaceId = window.location.pathname.includes('/s/') ? spaceData.id : null
            data.newRating = newRating
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/${rated ? 'remove' : 'add'}-rating`, data, options)
            .then(() => {
                updateItem()
                close()
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => getRatings(), [])

    return (
        <Modal close={close} centerX style={{ minWidth: mobileView ? null : 400 }}>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    <h1>{headerText}</h1>
                    {ratings.length > 0 && (
                        <Column style={{ marginBottom: 10 }}>
                            <Row centerY spaceBetween style={{ marginBottom: 15 }}>
                                <p>Average signal:</p>
                                <div className={`${styles.scoreBar} ${styles.aqua}`}>
                                    <div style={{ width: `${averageScore}%` }} />
                                    <p>{averageScore}%</p>
                                </div>
                            </Row>
                            {ratings.map((rating) => (
                                <Row
                                    centerY
                                    spaceBetween
                                    style={{ marginBottom: 15 }}
                                    key={rating.id}
                                >
                                    <ImageTitle
                                        type='user'
                                        imagePath={rating.Creator.flagImagePath}
                                        title={rating.Creator.name}
                                        link={`/u/${rating.Creator.handle}/posts`}
                                    />
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${rating.value}%` }} />
                                        <p>{`${rating.value}%`}</p>
                                    </div>
                                </Row>
                            ))}
                        </Column>
                    )}
                    {loggedIn ? (
                        <Column centerX>
                            {!itemData.accountRating && (
                                <Row centerY style={{ marginBottom: 20 }}>
                                    <Input
                                        type='text'
                                        style={{ width: 80, marginRight: 10 }}
                                        value={newRating}
                                        onChange={(v) => setNewRating(+v.replace(/\D/g, ''))}
                                    />
                                    <p>/ 100</p>
                                </Row>
                            )}
                            <Button
                                text={`${rated ? 'Remove' : 'Add'} signal`}
                                color={rated ? 'red' : 'blue'}
                                disabled={newRating > 100}
                                loading={responseLoading}
                                onClick={toggleRating}
                            />
                        </Column>
                    ) : (
                        <Row centerY style={{ marginTop: ratings.length ? 20 : 0 }}>
                            <Button
                                text='Log in'
                                color='blue'
                                style={{ marginRight: 5 }}
                                onClick={() => {
                                    setLogInModalOpen(true)
                                    close()
                                }}
                            />
                            <p>to add signal to {itemType}s</p>
                        </Row>
                    )}
                </Column>
            )}
        </Modal>
    )
}

export default RatingModal
