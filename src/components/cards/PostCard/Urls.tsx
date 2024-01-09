import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import UrlCard from '@components/cards/PostCard/UrlCard'
import config from '@src/Config'
import styles from '@styles/components/cards/PostCard/Urls.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Urls(props: { postId: number; urlBlocks?: any[]; style?: any }): JSX.Element {
    const { postId, urlBlocks, style } = props
    const [loading, setLoading] = useState(false)
    const [blocks, setBlocks] = useState<any[]>(urlBlocks || [])

    function getNextUrls(offset: number) {
        setLoading(true)
        axios
            .get(`${config.apiURL}/post-urls?postId=${postId}&offset=${offset}`)
            .then((res) => {
                setBlocks(res.data.blocks)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        // blocks retrieved seperately for comments
        if (!urlBlocks) getNextUrls(0)
    }, [])

    if (loading)
        return (
            <Row centerX centerY className={styles.loading} style={style}>
                <LoadingWheel size={30} />
            </Row>
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
    urlBlocks: null,
    style: null,
}

export default Urls
