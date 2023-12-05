import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import ImageModal from '@components/modals/ImageModal'
import config from '@src/Config'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/Images.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Images(props: { postId: number; style?: any }): JSX.Element {
    const { postId, style } = props
    const [loading, setLoading] = useState(true)
    const [blocks, setBlocks] = useState<any[]>([])
    const [totalBlocks, setTotalBlocks] = useState(0)
    const [nextBlocksLoading, setNextBlocksLoading] = useState(false)
    const [startIndex, setStartIndex] = useState(0)
    const [modalOpen, setModalOpen] = useState(false)

    function getImages(offset: number) {
        axios
            .get(`${config.apiURL}/post-images?postId=${postId}&offset=${offset}`)
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

    function onScrollRightEnd() {
        if (!nextBlocksLoading && totalBlocks > blocks.length) {
            setNextBlocksLoading(true)
            getImages(blocks.length)
        }
    }

    function findImageSize() {
        if (blocks.length === 1) return 'large'
        if (blocks.length === 2) return 'medium'
        return 'small'
    }

    useEffect(() => getImages(0), [])

    if (loading)
        return (
            <Column centerX style={style}>
                <LoadingWheel size={30} style={{ margin: 20 }} />
            </Column>
        )
    return (
        <Column>
            <Row centerX>
                <Scrollbars className={styles.images} onScrollRightEnd={onScrollRightEnd}>
                    <Row>
                        {blocks.map((block, i) => (
                            <Column
                                centerX
                                className={`${styles.image} ${styles[findImageSize()]}`}
                                key={block.id}
                            >
                                <button
                                    type='button'
                                    onClick={() => {
                                        setStartIndex(i)
                                        setModalOpen(true)
                                    }}
                                >
                                    <img
                                        src={block.Image.url}
                                        onError={(e) => handleImageError(e, block.Image.url)}
                                        alt=''
                                    />
                                </button>
                                {block.text && <p>{block.text}</p>}
                            </Column>
                        ))}
                    </Row>
                </Scrollbars>
            </Row>
            {modalOpen && (
                <ImageModal
                    images={blocks}
                    startIndex={startIndex}
                    close={() => setModalOpen(false)}
                />
            )}
        </Column>
    )
}

Images.defaultProps = {
    style: null,
}

export default Images
