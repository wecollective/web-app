import FlagImage from '@components/FlagImage'
import styles from '@styles/components/FlagImageHighlights.module.scss'
import React from 'react'

function FlagImageHighlights(props: {
    type: 'user' | 'space' | 'post'
    imagePaths: string[]
    imageSize?: number
    text?: string
    style?: any
    outline?: boolean
    shadow?: boolean
    onClick?: () => void
}): JSX.Element {
    const { type, imagePaths, imageSize, text, style, outline, shadow, onClick } = props
    return (
        <button
            className={`${styles.wrapper} ${onClick && styles.clickable}`}
            type='button'
            style={style}
            onClick={onClick}
        >
            {imagePaths.length > 0 && (
                <div className={styles.item1}>
                    <FlagImage
                        type={type}
                        imagePath={imagePaths[0]}
                        size={imageSize!}
                        shadow={shadow}
                        outline={outline}
                    />
                </div>
            )}
            {imagePaths.length > 1 && (
                <div className={styles.item2}>
                    <FlagImage
                        type={type}
                        imagePath={imagePaths[1]}
                        size={imageSize!}
                        shadow={shadow}
                        outline={outline}
                    />
                </div>
            )}
            {imagePaths.length > 2 && (
                <div className={styles.item3}>
                    <FlagImage
                        type={type}
                        imagePath={imagePaths[2]}
                        size={imageSize!}
                        shadow={shadow}
                        outline={outline}
                    />
                </div>
            )}
            {!!text && <p style={{ marginLeft: imageSize! / 6 }}>{text}</p>}
        </button>
    )
}

FlagImageHighlights.defaultProps = {
    imageSize: 35,
    text: null,
    style: null,
    outline: false,
    shadow: false,
    onClick: null,
}

export default FlagImageHighlights
