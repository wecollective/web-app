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
    const [selectedBlock, setSelectedBlock] = useState<any>(null)
    const [modalOpen, setModalOpen] = useState(false)

    function getImages() {
        axios
            .get(`${config.apiURL}/post-images?postId=${postId}`)
            .then((res) => {
                setBlocks(res.data.sort((a, b) => a.Link.index - b.Link.index))
                setLoading(false)
            })
            .catch((error) => console.log(error))
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

    useEffect(() => getImages(), [])

    if (loading)
        return (
            <Column centerX style={style}>
                <LoadingWheel size={30} style={{ margin: 20 }} />
            </Column>
        )
    return (
        <Column>
            <Row centerX>
                <Scrollbars className={styles.images}>
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
