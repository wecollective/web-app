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
    const [selectedBlock, setSelectedBlock] = useState<any>(null)
    const [modalOpen, setModalOpen] = useState(false)

    function getImages(offset: number) {
        axios
            .get(`${config.apiURL}/post-images?postId=${postId}&offset=${offset}`)
            .then((res) => {
                const { imageBlocks, total } = res.data
                const sortedBlocks = imageBlocks.sort((a, b) => a.Link.index - b.Link.index)
                setBlocks(offset ? [...blocks, ...sortedBlocks] : sortedBlocks)
                if (offset) setNextBlocksLoading(false)
                else {
                    setTotalBlocks(total)
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

    function openModal(blockId) {
        setSelectedBlock(blocks.find((block) => block.id === blockId))
        setModalOpen(true)
    }

    function findImageSize() {
        if (blocks.length === 1) return 'large'
        if (blocks.length === 2) return 'medium'
        return 'small'
    }

    function findUrl(block) {
        return block.Image.url || URL.createObjectURL(block.file)
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
                        {blocks.map((block) => (
                            <Column
                                centerX
                                className={`${styles.image} ${styles[findImageSize()]}`}
                                key={block.id}
                            >
                                <button type='button' onClick={() => openModal(block.id)}>
                                    <img
                                        src={findUrl(block)}
                                        onError={(e) => handleImageError(e, findUrl(block))}
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
                    selectedImage={selectedBlock}
                    setSelectedImage={setSelectedBlock}
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
