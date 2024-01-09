/* eslint-disable no-nested-ternary */
import Column from '@components/Column'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import LoadingWheel from '@components/animations/LoadingWheel'
import ImageModal from '@components/modals/ImageModal'
import config from '@src/Config'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/Images.module.scss'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Images(props: { postId: number; imageBlocks?: any[]; style?: any }): JSX.Element {
    const { postId, imageBlocks, style } = props
    const [loading, setLoading] = useState(false)
    const [blocks, setBlocks] = useState<any[]>(imageBlocks || [])
    // temporary approach to enable pagination without a total value on initial load:
    // if 4 items, set total blocks to 5 so it attempts to grab the next blocks on scroll right end
    const [totalBlocks, setTotalBlocks] = useState(
        imageBlocks ? (imageBlocks!.length === 4 ? 5 : imageBlocks!.length) : 0
    )
    const [startIndex, setStartIndex] = useState(0)
    const [modalOpen, setModalOpen] = useState(false)

    function getNextImages(offset: number) {
        if (!offset) setLoading(true)
        axios
            .get(`${config.apiURL}/post-images?postId=${postId}&offset=${offset}`)
            .then((res) => {
                setBlocks([...blocks, ...res.data.blocks])
                setTotalBlocks(res.data.total)
                if (!offset) setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function onScrollRightEnd() {
        if (!loading && totalBlocks > blocks.length) getNextImages(blocks.length)
    }

    function findImageSize() {
        if (blocks.length === 1) return 'large'
        if (blocks.length === 2) return 'medium'
        return 'small'
    }

    useEffect(() => {
        // blocks retrieved seperately for comments
        if (!imageBlocks) getNextImages(0)
    }, [])

    if (loading)
        return (
            <Row centerX centerY className={styles.loading} style={style}>
                <LoadingWheel size={30} />
            </Row>
        )
    return (
        <Column className={styles.wrapper} style={style}>
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
    imageBlocks: null,
    style: null,
}

export default Images
