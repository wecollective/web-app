import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/modals/ImageModal.module.scss'
import { ChevronLeftIcon, ChevronRightIcon } from '@svgs/all'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function ImageModal(props: { images: any[]; startIndex: number; close: () => void }): JSX.Element {
    const { images, startIndex, close } = props
    const [index, setIndex] = useState(startIndex)

    return (
        <Modal close={close} className={styles.wrapper}>
            <Link to={`/p/${images[index].id}`} className={styles.id} title='Open post page'>
                <p className='grey'>ID:</p>
                <p style={{ marginLeft: 5 }}>{images[index].id}</p>
            </Link>
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
                        src={images[index].Image.url}
                        onError={(e) => handleImageError(e, images[index].Image.url)}
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
