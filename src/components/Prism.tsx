import PostCard from '@components/cards/PostCard/PostCard'
import PrismMap from '@components/PrismMap'
import { PostContext } from '@contexts/PostContext'
import config from '@src/Config'
import { IPrism } from '@src/Interfaces'
import styles from '@styles/components/Prism.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'

const Prism = (): JSX.Element => {
    const { postData } = useContext(PostContext)
    const [prismData, setPrismData] = useState<Partial<IPrism>>({})

    function getPrismData() {
        console.log('Prism: getPrismData')
        axios
            .get(`${config.apiURL}/prism-data?postId=${postData.id}`)
            .then((res) => setPrismData(res.data))
    }

    useEffect(() => {
        getPrismData()
    }, [postData])

    return (
        <div className={styles.prism}>
            <div className={styles.postCardContainer}>
                <PostCard post={postData} location='post-page' />
            </div>
            <div className={styles.infoBar}>
                <span>
                    <b>Number of players: </b>
                    {prismData.numberOfPlayers}
                </span>
                <span>
                    <b>Duration: </b>
                    {prismData.duration}
                </span>
                <span>
                    <b>Privacy: </b>
                    {prismData.privacy}
                </span>
            </div>
            <PrismMap postData={postData} prismData={prismData} />
        </div>
    )
}

export default Prism
