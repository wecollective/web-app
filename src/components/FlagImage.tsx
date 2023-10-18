import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/FlagImage.module.scss'
import React from 'react'
import { Link } from 'react-router-dom'

function FlagImage(props: {
    type: 'space' | 'user' | 'post' | 'stream'
    imagePath: string | null
    size?: number
    outline?: number
    link?: string | null
    className?: string
    style?: any
}): JSX.Element {
    const { type, imagePath, size, outline, link, className, style } = props

    if (link) {
        return (
            <Link
                to={link}
                className={`${styles.wrapper} ${className}`}
                style={{ width: size, height: size, border: `${outline}px solid white`, ...style }}
            >
                {imagePath ? (
                    <img
                        className={styles.flagImage}
                        src={imagePath}
                        onError={(e) => handleImageError(e, imagePath)}
                        alt=''
                    />
                ) : (
                    <FlagImagePlaceholder type={type} />
                )}
            </Link>
        )
    }

    return (
        <div
            className={`${styles.wrapper} ${className}`}
            style={{ width: size, height: size, border: `${outline}px solid white`, ...style }}
        >
            {imagePath ? (
                <img
                    className={styles.flagImage}
                    src={imagePath}
                    onError={(e) => handleImageError(e, imagePath)}
                    alt=''
                />
            ) : (
                <FlagImagePlaceholder type={type} />
            )}
        </div>
    )
}

FlagImage.defaultProps = {
    size: 30,
    outline: 0,
    link: null,
    className: '',
    style: null,
}

export default FlagImage
