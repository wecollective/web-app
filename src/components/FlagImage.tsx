import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/FlagImage.module.scss'
import React from 'react'

const FlagImage = (props: {
    type: 'space' | 'user' | 'post'
    size: number
    imagePath: string | null
    className?: string
    outline?: boolean
    shadow?: boolean
    // canEdit?: boolean
    style?: any
}): JSX.Element => {
    const { size, type, imagePath, className, outline, shadow, style } = props
    // const { setImageUploadType, setImageUploadModalOpen } = useContext(AccountContext)

    const classes = [styles.wrapper]
    if (className) classes.unshift(className)
    if (outline) classes.push(styles.outline)
    if (shadow) classes.push(styles.shadow)
    if (size < 50) classes.push(styles.small)

    // function uploadImage() {
    //     setImageUploadType(type === 'space' ? 'holon-flag-image' : 'user-flag-image')
    //     setImageUploadModalOpen(true)
    // }

    return (
        <div className={classes.join(' ')} style={{ width: size, height: size, ...style }}>
            {imagePath ? (
                <>
                    <div className={styles.background} />
                    <img
                        className={styles.flagImage}
                        src={imagePath}
                        onError={(e) => handleImageError(e, imagePath)}
                        alt=''
                    />
                </>
            ) : (
                <FlagImagePlaceholder type={type} />
            )}
            {/* {canEdit && (
                <button className={styles.uploadButton} type='button' onClick={uploadImage}>
                    Upload new flag image
                </button>
            )} */}
        </div>
    )
}

FlagImage.defaultProps = {
    className: null,
    outline: false,
    shadow: false,
    // canEdit: false,
    style: null,
}

export default FlagImage
