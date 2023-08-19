import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/FlagImage.module.scss'
import React from 'react'
import { Link } from 'react-router-dom'

function FlagImage(props: {
    type: 'space' | 'user' | 'post' | 'stream'
    imagePath: string | null
    size?: number
    outline?: boolean
    shadow?: boolean
    link?: string | null
    className?: string
    style?: any
}): JSX.Element {
    const { type, imagePath, size, outline, shadow, link, className, style } = props

    const classes = [styles.wrapper]
    if (className) classes.unshift(className)
    if (outline) classes.push(styles.outline)
    if (shadow) classes.push(styles.shadow)
    if (!size || size < 50) classes.push(styles.small)

    if (link) {
        return (
            <Link
                to={link}
                className={classes.join(' ')}
                style={{ width: size, height: size, ...style }}
            >
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
            </Link>
        )
    }

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
    size: 30,
    outline: false,
    shadow: false,
    link: null,
    className: null,
    style: null,
}

export default FlagImage
