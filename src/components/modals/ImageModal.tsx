import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/modals/ImageModal.module.scss'
import { ChevronLeftIcon, ChevronRightIcon } from '@svgs/all'
import React, { useState } from 'react'

function ImageModal(props: { images: any[]; startIndex: number; close: () => void }): JSX.Element {
    const { images, startIndex, close } = props
    const [index, setIndex] = useState(startIndex)

    function findUrl(image) {
        return image.url || URL.createObjectURL(image.file)
    }

    return (
        <Modal close={close} className={styles.wrapper}>
            <Row centerY>
                {index > 0 && (
                    <button
                        className={styles.navButton}
                        type='button'
                        onClick={() => setIndex(index - 1)}
                    >
                        <ChevronLeftIcon />
                    </button>
                )}
                <Column centerX>
                    <img
                        className={styles.image}
                        src={findUrl(images[index].Image)}
                        onError={(e) => handleImageError(e, findUrl(images[index].Image))}
                        alt=''
                    />
                    {images[index].text && (
                        <ShowMoreLess height={150} style={{ marginTop: 20 }}>
                            <p style={{ width: '100%', textAlign: 'center' }}>
                                {images[index].text}
                            </p>
                        </ShowMoreLess>
                    )}
                </Column>
                {index !== images.length - 1 && (
                    <button
                        className={styles.navButton}
                        type='button'
                        onClick={() => setIndex(index + 1)}
                    >
                        <ChevronRightIcon />
                    </button>
                )}
            </Row>
        </Modal>
    )
}

export default ImageModal
