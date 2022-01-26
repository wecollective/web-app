import React, { useContext } from 'react'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import styles from '@styles/pages/UserPage/UserPageSidebar.module.scss'
import Column from '@components/Column'
import ImageFade from '@components/ImageFade'
import Markdown from '@components/Markdown'
import FlagImagePlaceholder from '@components/FlagImagePlaceholder'

const UserPageSidebar = (): JSX.Element => {
    const { setImageUploadType, setImageUploadModalOpen } = useContext(AccountContext)
    const { userData, isOwnAccount } = useContext(UserContext)
    const { flagImagePath, name, handle, bio } = userData

    function uploadFlagImage() {
        setImageUploadType('user-flag-image')
        setImageUploadModalOpen(true)
    }

    return (
        <Column className={styles.wrapper}>
            <div className={styles.flagImage}>
                <ImageFade imagePath={flagImagePath} speed={1000}>
                    <FlagImagePlaceholder type='user' />
                </ImageFade>
                {isOwnAccount && (
                    <button type='button' className={styles.uploadButton} onClick={uploadFlagImage}>
                        Upload new flag image
                    </button>
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
