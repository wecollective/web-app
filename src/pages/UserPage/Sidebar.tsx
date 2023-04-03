import Column from '@components/Column'
import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import ImageFade from '@components/ImageFade'
import Markdown from '@components/Markdown'
import ImageUploadModal from '@components/modals/ImageUploadModal'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/Sidebar.module.scss'
import React, { useContext, useState } from 'react'

function Sidebar(): JSX.Element {
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
                        Add a new flag image
                    </button>
                )}
                {imageUploadModalOpen && (
                    <ImageUploadModal
                        type='user-flag'
                        shape='square'
                        id={id}
                        title='Add a new flag image'
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

export default Sidebar
