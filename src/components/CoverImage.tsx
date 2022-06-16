import React, { useContext } from 'react'
import styles from '@styles/components/CoverImage.module.scss'
import ImageFade from '@components/ImageFade'
import { AccountContext } from '@src/contexts/AccountContext'

const CoverImage = (props: {
    type: 'user' | 'space'
    image: string
    canEdit: boolean
}): JSX.Element => {
    const { type, image, canEdit } = props
    const { setImageUploadType, setImageUploadModalOpen } = useContext(AccountContext)

    return (
        <div className={styles.wrapper}>
            <ImageFade imagePath={image} speed={1000}>
                <div className={styles.placeholder} />
            </ImageFade>
            {canEdit && (
                <button
                    type='button'
                    className={styles.uploadButton}
                    onClick={() => {
                        setImageUploadType(`${type}-cover`)
                        setImageUploadModalOpen(true)
                    }}
                >
                    Add a new cover image
                </button>
            )}
        </div>
    )
}

export default CoverImage
