import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import UrlCard from '@components/cards/PostCard/UrlCard'
import config from '@src/Config'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Urls(props: { postId: number; style?: any }): JSX.Element {
    const { postId, style } = props
    const [loading, setLoading] = useState(true)
    const [urls, setUrls] = useState<any[]>([])

    function getUrls() {
        axios
            .get(`${config.apiURL}/post-urls?postId=${postId}`)
            .then((res) => {
                setUrls(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => getUrls(), [])

    if (loading)
        return (
            <Column centerX style={style}>
                <LoadingWheel size={30} style={{ margin: 20 }} />
            </Column>
        )
    return (
        <Column style={style}>
            {urls.map((data, i) => (
                <UrlCard
                    key={data.id}
                    type='post'
                    urlData={data.Url}
                    style={{ marginTop: i > 0 ? 10 : 0 }}
                />
            ))}
        </Column>
    )
}

Urls.defaultProps = {
    style: null,
}

export default Urls
