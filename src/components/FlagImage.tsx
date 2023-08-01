import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/FlagImage.module.scss'
import React from 'react'

function FlagImage(props: {
    type: 'space' | 'user' | 'post' | 'stream'
    size: number
    imagePath: string | null
    className?: string
    outline?: boolean
    shadow?: boolean
    style?: any
}): JSX.Element {
    const { size, type, imagePath, className, outline, shadow, style } = props

    const classes = [styles.wrapper]
    if (className) classes.unshift(className)
    if (outline) classes.push(styles.outline)
    if (shadow) classes.push(styles.shadow)
    if (size < 50) classes.push(styles.small)

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
        </div>
    )
}

FlagImage.defaultProps = {
    className: null,
    outline: false,
    shadow: false,
    style: null,
}

export default FlagImage
