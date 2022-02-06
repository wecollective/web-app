import React, { useContext, useState } from 'react'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/UserPageSidebar.module.scss'
import Column from '@components/Column'
import ImageFade from '@components/ImageFade'
import Markdown from '@components/Markdown'
import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import ImageUploadModal from '@components/modals/ImageUploadModal'

const UserPageSidebar = (): JSX.Element => {
    const { userData, setUserData, isOwnAccount } = useContext(UserContext)
    const { id, handle, name, bio, flagImagePath } = userData
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)

    return (
        <Column className={styles.wrapper}>
            <div className={styles.flagImage}>
                <ImageFade imagePath={flagImagePath} speed={1000}>
                    <FlagImagePlaceholder type='user' />
                </ImageFade>
                {isOwnAccount && (
                    <button
                        type='button'
                        className={styles.uploadButton}
                        onClick={() => setImageUploadModalOpen(true)}
                    >
                        Upload a new flag image
                    </button>
                )}
                {imageUploadModalOpen && (
                    <ImageUploadModal
                        type='user-flag'
                        shape='square'
                        id={id}
                        title='Add a new flag image'
                        mbLimit={2}
                        onSaved={(imageURL) =>
                            setUserData({ ...userData, flagImagePath: imageURL })
                        }
                        close={() => setImageUploadModalOpen(false)}
                    />
                )}
            </div>
            <Column className={styles.content}>
                <h1>{name}</h1>
                <p className='grey'>{`u/${handle}`}</p>
                <Markdown text={bio} />
            </Column>
        </Column>
    )
}

export default UserPageSidebar
