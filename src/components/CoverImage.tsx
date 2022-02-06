import React, { useContext, useState } from 'react'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/components/CoverImage.module.scss'
import ImageFade from '@components/ImageFade'
import ImageUploadModal from '@components/modals/ImageUploadModal'

const CoverImage = (props: {
    type: 'user' | 'space'
    image: string
    canEdit: boolean
}): JSX.Element => {
    const { type, image, canEdit } = props
    const { userData, setUserData } = useContext(UserContext)
    const { spaceData, setSpaceData } = useContext(SpaceContext)
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)

    function updateUI(imageURL) {
        if (type === 'user') setUserData({ ...userData, coverImagePath: imageURL })
        else setSpaceData({ ...spaceData, coverImagePath: imageURL })
    }

    return (
        <div className={styles.wrapper}>
            <ImageFade imagePath={image} speed={1000}>
                <div className={styles.placeholder} />
            </ImageFade>
            {canEdit && (
                <button
                    type='button'
                    className={styles.uploadButton}
                    onClick={() => setImageUploadModalOpen(true)}
                >
                    Add a new cover image
                </button>
            )}
            {imageUploadModalOpen && (
                <ImageUploadModal
                    type={type === 'user' ? 'user-cover' : 'space-cover'}
                    shape='rectangle'
                    id={type === 'user' ? userData.id : spaceData.id}
                    title='Add a new cover image'
                    mbLimit={2}
                    onSaved={(imageURL) => updateUI(imageURL)}
                    close={() => setImageUploadModalOpen(false)}
                />
            )}
        </div>
    )
}

export default CoverImage
