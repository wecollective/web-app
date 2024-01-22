import PostCard from '@components/cards/PostCard/PostCard'
import PrismMap from '@components/PrismMap'
import config from '@src/Config'
import { Post } from '@src/Helpers'
import { IPrism } from '@src/Interfaces'
import styles from '@styles/components/Prism.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Prism({
    post,
    setPost,
    onDelete,
}: {
    post: Post
    setPost: (post: Post) => void
    onDelete: () => void
}): JSX.Element {
    const [prismData, setPrismData] = useState<Partial<IPrism>>({})

    function getPrismData() {
        console.log('Prism: getPrismData')
        axios
            .get(`${config.apiURL}/prism-data?postId=${post.id}`)
            .then((res) => setPrismData(res.data))
    }

    useEffect(() => {
        getPrismData()
    }, [post])

    return (
        <div className={styles.prism}>
            <div className={styles.postCardContainer}>
                <PostCard post={post} setPost={setPost} onDelete={onDelete} location='post-page' />
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
            <PrismMap postData={post} prismData={prismData} />
        </div>
    )
}

export default Prism
