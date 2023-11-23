import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/modals/ImageModal.module.scss'
import { ChevronLeftIcon, ChevronRightIcon } from '@svgs/all'
import React from 'react'

function ImageModal(props: {
    images: any[]
    selectedImage: any
    setSelectedImage?: (image: any) => void
    close: () => void
}): JSX.Element {
    const { images, selectedImage, setSelectedImage, close } = props

    function toggleImage(increment) {
        if (setSelectedImage) setSelectedImage(images[selectedImage.Link.index + increment])
    }

    function findUrl(block) {
        return block.Image.url || URL.createObjectURL(block.file)
    }

    return (
        <Modal close={close} className={styles.wrapper}>
            <Row centerY>
                {images.length > 1 && selectedImage.Link.index !== 0 && (
                    <button
                        className={styles.navButton}
                        type='button'
                        onClick={() => toggleImage(-1)}
                    >
                        <ChevronLeftIcon />
                    </button>
                )}
                <Column centerX>
                    <img
                        className={styles.selectedImage}
                        src={findUrl(selectedImage)}
                        onError={(e) => handleImageError(e, findUrl(selectedImage))}
                        alt=''
                    />
                    {selectedImage.caption && (
                        <ShowMoreLess height={150} style={{ marginTop: 20 }}>
                            <p style={{ width: '100%', textAlign: 'center' }}>
                                {selectedImage.text}
                            </p>
                        </ShowMoreLess>
                    )}
                </Column>
                {images.length > 1 && selectedImage.Link.index !== images.length - 1 && (
                    <button
                        className={styles.navButton}
                        type='button'
                        onClick={() => toggleImage(1)}
                    >
                        <ChevronRightIcon />
                    </button>
                )}
            </Row>
        </Modal>
    )
}

ImageModal.defaultProps = {
    setSelectedImage: null,
}

export default ImageModal
