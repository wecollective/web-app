import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import ImageModal from '@components/modals/ImageModal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import ShowMoreLess from '@components/ShowMoreLess'
import styles from '@styles/components/cards/PostCard/PostTypes/Image.module.scss'
import React, { useState } from 'react'

const Image = (props: { postData: any }): JSX.Element => {
    const { postData } = props
    const { text, PostImages } = postData
    const images = PostImages.sort((a, b) => a.index - b.index)
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any>(null)

    function openImageModal(imageId) {
        setSelectedImage(images.find((image) => image.id === imageId))
        setImageModalOpen(true)
    }

    function findImageSize() {
        if (images.length === 1) return 'large'
        if (images.length === 2) return 'medium'
        return 'small'
    }

    return (
        <Column>
            {text && (
                <ShowMoreLess height={150}>
                    <DraftText stringifiedDraft={text} />
                </ShowMoreLess>
            )}
            <Row centerX>
                {images.length === 1 ? (
                    <Row className={styles.images}>
                        <Column
                            centerX
                            className={`${styles.image} ${styles[findImageSize()]}`}
                            key={images[0].index}
                        >
                            <button type='button' onClick={() => openImageModal(images[0].id)}>
                                <img src={images[0].url} alt='' />
                            </button>
                            {images[0].caption && <p>{images[0].caption}</p>}
                        </Column>
                    </Row>
                ) : (
                    <Scrollbars className={`${styles.images} row`}>
                        {images.map((image) => (
                            <Column
                                centerX
                                className={`${styles.image} ${styles[findImageSize()]}`}
                                key={image.index}
                            >
                                <button type='button' onClick={() => openImageModal(image.id)}>
                                    <img src={image.url} alt='' />
                                </button>
                                {image.caption && <p>{image.caption}</p>}
                            </Column>
                        ))}
                    </Scrollbars>
                )}
            </Row>
            {imageModalOpen && (
                <ImageModal
                    images={images}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    close={() => setImageModalOpen(false)}
                />
            )}
        </Column>
    )
}

export default Image
