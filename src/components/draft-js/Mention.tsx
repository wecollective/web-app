import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import config from '@src/Config'
import styles from '@styles/components/draft-js/Mention.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Mention(props: { mention }): JSX.Element {
    const { mention } = props
    const [userData, setUserData] = useState<any>(null)
    const [modalOpen, setModalOpen] = useState(false)

    function getUserData() {
        axios
            .get(`${config.apiURL}/user-mention-data?userId=${mention.id}`)
            .then((res) => setUserData(res.data))
            .catch((error) => console.log(error))
    }

    useEffect(() => getUserData(), [])

    if (!userData) return <span>@{mention.name}</span>
    return (
        <span className={styles.wrapper}>
            <Link
                to={`/u/${userData.handle}`}
                className={styles.text}
                onMouseEnter={() => setModalOpen(true)}
                onMouseLeave={() => setModalOpen(false)}
            >
                @{userData.name}
            </Link>
            {modalOpen && (
                <Row className={styles.modal}>
                    <ImageTitle
                        type='user'
                        imagePath={userData.flagImagePath}
                        title={`u/${userData.handle}`}
                        shadow
                    />
                </Row>
            )}
        </span>
    )
}

export default Mention
