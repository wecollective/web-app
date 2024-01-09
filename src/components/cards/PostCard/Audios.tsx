import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import AudioCard from '@components/cards/PostCard/AudioCard'
import config from '@src/Config'
import styles from '@styles/components/cards/PostCard/Audios.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Audios(props: { postId: number; audioBlocks?: any[]; style?: any }): JSX.Element {
    const { postId, audioBlocks, style } = props
    const [loading, setLoading] = useState(false)
    const [blocks, setBlocks] = useState<any[]>(audioBlocks || [])
    const [totalBlocks, setTotalBlocks] = useState(0)
    // const [startIndex, setStartIndex] = useState(0)
    // const [modalOpen, setModalOpen] = useState(false)

    function getNextAudios(offset: number) {
        setLoading(true)
        axios
            .get(`${config.apiURL}/post-audio?postId=${postId}&offset=${offset}`)
            .then((res) => {
                setBlocks([...blocks, ...res.data.blocks])
                setTotalBlocks(res.data.total)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    // function onScrollRightEnd() {
    //     if (!nextBlocksLoading && totalBlocks > blocks.length) {
    //         setNextBlocksLoading(true)
    //         getAudio(blocks.length)
    //     }
    // }

    useEffect(() => {
        // blocks retrieved seperately for comments
        if (!audioBlocks) getNextAudios(0)
    }, [])

    if (loading)
        return (
            <Row centerX centerY className={styles.loading} style={style}>
                <LoadingWheel size={30} />
            </Row>
        )

    return (
        <Column style={style} className={styles.wrapper}>
            {blocks.map((block) => (
                <Column centerX key={block.id}>
                    <Link to={`/p/${block.id}`} className={styles.id} title='Open post page'>
                        <p className='grey'>ID:</p>
                        <p style={{ marginLeft: 5 }}>{block.id}</p>
                    </Link>
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
    audioBlocks: null,
    style: null,
}

export default Audios
