import Column from '@components/Column'
// import LoadingWheel from '@components/animations/LoadingWheel'
import UrlCard from '@components/cards/PostCard/UrlCard'
import config from '@src/Config'
import styles from '@styles/components/cards/PostCard/Urls.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Urls(props: { postId: number; style?: any }): JSX.Element {
    const { postId, style } = props
    const [loading, setLoading] = useState(true)
    const [blocks, setBlocks] = useState<any[]>([])

    function getUrls() {
        axios
            .get(`${config.apiURL}/post-urls?postId=${postId}`)
            .then((res) => {
                setBlocks(res.data.blocks)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => getUrls(), [])

    if (loading)
        return (
            <Column centerX className={styles.loading} style={style}>
                {/* <LoadingWheel size={30} style={{ margin: 20 }} /> */}
            </Column>
        )
    return (
        <Column style={style} className={styles.wrapper}>
            {blocks.map((block, i) => (
                <Column centerX key={block.id}>
                    <Link to={`/p/${block.id}`} className={styles.id} title='Open post page'>
                        <p className='grey'>ID:</p>
                        <p style={{ marginLeft: 5 }}>{block.id}</p>
                    </Link>
                    <UrlCard type='post' urlData={block.Url} />
                </Column>
            ))}
        </Column>
    )
}

Urls.defaultProps = {
    style: null,
}

export default Urls
