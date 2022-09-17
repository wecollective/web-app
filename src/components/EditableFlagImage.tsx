import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import ImageFade from '@components/ImageFade'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/components/EditableFlagImage.module.scss'
import React, { useContext } from 'react'

const EditableFlagImage = (props: {
    type: 'space' | 'user' | 'post'
    size: number
    imagePath: string | null
    canEdit: boolean
    className?: string
    style?: any
}): JSX.Element => {
    const { size, type, imagePath, canEdit, className, style } = props
    const { setImageUploadType, setImageUploadModalOpen } = useContext(AccountContext)

    const classes = [styles.wrapper]
    if (className) classes.unshift(className)

    return (
        <div className={classes.join(' ')} style={{ width: size, height: size, ...style }}>
            <ImageFade imagePath={imagePath} speed={1000}>
                <FlagImagePlaceholder type={type} />
            </ImageFade>
            {canEdit && (
                <button
                    type='button'
                    onClick={() => {
                        setImageUploadType(`${type}-flag`)
                        setImageUploadModalOpen(true)
                    }}
                >
                    Add a new <br /> flag image
                </button>
            )}
        </div>
    )
}

EditableFlagImage.defaultProps = {
    className: null,
    style: null,
}

export default EditableFlagImage
