import FlagImage from '@components/FlagImage'
import styles from '@styles/components/FlagImageHighlights.module.scss'
import React from 'react'

function FlagImageHighlights(props: {
    type: 'user' | 'space' | 'post'
    images: string[]
    imageSize?: number
    text?: string
    style?: any
    outline?: number
    onClick?: () => void
}): JSX.Element {
    const { type, images, imageSize, text, style, outline, onClick } = props
    return (
        <button
            className={`${styles.wrapper} ${onClick && styles.clickable}`}
            type='button'
            style={style}
            onClick={onClick}
        >
            {images.map((image, index) => (
                <FlagImage
                    key={image}
                    type={type}
                    imagePath={image}
                    size={imageSize!}
                    outline={outline}
                    style={{ marginLeft: index === 0 ? 0 : -10 }}
                />
            ))}
            {!!text && <p style={{ marginLeft: imageSize! / 6 }}>{text}</p>}
        </button>
    )
}

FlagImageHighlights.defaultProps = {
    imageSize: 35,
    text: null,
    style: null,
    outline: 0,
    onClick: null,
}

export default FlagImageHighlights
