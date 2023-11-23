import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import AudioCard from '@components/cards/PostCard/AudioCard'
import config from '@src/Config'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Audio(props: { postId: number; style?: any }): JSX.Element {
    const { postId, style } = props
    const [loading, setLoading] = useState(true)
    const [blocks, setBlocks] = useState<any[]>([])

    function getAudio() {
        axios
            .get(`${config.apiURL}/post-audio?postId=${postId}`)
            .then((res) => {
                setBlocks(res.data) // .sort((a, b) => a.Link.index - b.Link.index)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => getAudio(), [])

    if (loading)
        return (
            <Column centerX style={style}>
                <LoadingWheel size={30} style={{ margin: 20 }} />
            </Column>
        )
    return (
        <Column style={style}>
            {blocks.map((block, i) => (
                <AudioCard
                    id={block.id}
                    url={block.Audio.url}
                    staticBars={400}
                    location={`${block.id}`}
                    style={{ height: 200, margin: '10px 0' }}
                />
            ))}
        </Column>
    )
}

Audio.defaultProps = {
    style: null,
}

export default Audio
