import Column from '@components/Column'
import ImageModal from '@components/modals/ImageModal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import styles from '@styles/components/cards/PostCard/PostTypes/Images.module.scss'
import React, { useState } from 'react'

function Images(props: { images: any }): JSX.Element {
    const { images } = props
    // const { text, PostImages } = postData
    // const images = PostImages.sort((a, b) => a.index - b.index)
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
            {images.length > 0 && (
                <Row centerX>
                    <Scrollbars className={styles.images}>
                        <Row>
                            {images.map((image) => (
                                <Column
                                    centerX
                                    className={`${styles.image} ${styles[findImageSize()]}`}
                                    key={image.index}
                                >
                                    <button type='button' onClick={() => openImageModal(image.id)}>
                                        <img
                                            src={image.url || URL.createObjectURL(image.file)}
                                            alt=''
                                        />
                                    </button>
                                    {image.caption && <p>{image.caption}</p>}
                                </Column>
                            ))}
                        </Row>
                    </Scrollbars>
                </Row>
            )}
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

export default Images
