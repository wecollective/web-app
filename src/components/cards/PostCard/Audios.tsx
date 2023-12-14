import Column from '@components/Column'
import LoadingWheel from '@components/animations/LoadingWheel'
import AudioCard from '@components/cards/PostCard/AudioCard'
import config from '@src/Config'
import styles from '@styles/components/cards/PostCard/Audios.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Audios(props: { postId: number; style?: any }): JSX.Element {
    const { postId, style } = props
    const [loading, setLoading] = useState(true)
    const [blocks, setBlocks] = useState<any[]>([])
    const [totalBlocks, setTotalBlocks] = useState(0)
    const [nextBlocksLoading, setNextBlocksLoading] = useState(false)
    // const [startIndex, setStartIndex] = useState(0)
    // const [modalOpen, setModalOpen] = useState(false)

    function getAudio(offset: number) {
        axios
            .get(`${config.apiURL}/post-audio?postId=${postId}&offset=${offset}`)
            .then((res) => {
                setBlocks(offset ? [...blocks, ...res.data.blocks] : res.data.blocks)
                if (offset) setNextBlocksLoading(false)
                else {
                    setTotalBlocks(res.data.total)
                    setLoading(false)
                }
            })
            .catch((error) => console.log(error))
    }

    // function onScrollRightEnd() {
    //     if (!nextBlocksLoading && totalBlocks > blocks.length) {
    //         setNextBlocksLoading(true)
    //         getAudio(blocks.length)
    //     }
    // }

    useEffect(() => getAudio(0), [])

    if (loading)
        return (
            <Column centerX style={style}>
                <LoadingWheel size={30} style={{ margin: 20 }} />
            </Column>
        )
    return (
        <Column style={style} className={styles.wrapper}>
            {blocks.map((block) => (
                <Column centerX key={block.id}>
                    <AudioCard
                        id={block.id}
                        url={block.Audio.url}
                        staticBars={250}
                        location='post'
                        style={{ height: 160, width: '100%' }}
                    />
                    {block.text && <p>{block.text}</p>}
                </Column>
            ))}
            {/* {modalOpen && (
                <AudioModal
                    audios={blocks}
                    startIndex={startIndex}
                    close={() => setModalOpen(false)}
                />
            )} */}
        </Column>
    )
}

Audios.defaultProps = {
    style: null,
}

export default Audios
