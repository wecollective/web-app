import Column from '@components/Column'
import Markdown from '@components/Markdown'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/modals/ImageModal.module.scss'
import { ChevronLeftIcon, ChevronRightIcon } from '@svgs/all'
import React from 'react'

const ImageModal = (props: {
    images: any[]
    selectedImage: any
    setSelectedImage: (image: any) => void
    close: () => void
}): JSX.Element => {
    const { images, selectedImage, setSelectedImage, close } = props

    function toggleImage(increment) {
        setSelectedImage(images[selectedImage.index + increment])
    }

    return (
        <Modal close={close} className={styles.wrapper}>
            <Row centerY>
                {selectedImage.index !== 0 && (
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
                        src={selectedImage.url || URL.createObjectURL(selectedImage.file)}
                        onError={(e) =>
                            handleImageError(
                                e,
                                selectedImage.url || URL.createObjectURL(selectedImage.file)
                            )
                        }
                        alt=''
                    />
                    {selectedImage.caption && (
                        <ShowMoreLess height={150}>
                            <Markdown
                                text={selectedImage.caption}
                                style={{ textAlign: 'center', marginTop: 20 }}
                            />
                        </ShowMoreLess>
                    )}
                </Column>
                {selectedImage.index !== images.length - 1 && (
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

export default ImageModal
