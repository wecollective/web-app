import FlagImage from '@components/FlagImage'
import styles from '@styles/components/FlagImageHighlights.module.scss'
import React from 'react'

// todo: pass in items instead of image strings so id included and can be used instead of index for the key
// required for socket users where duplicates are allowed if multiple tabs open
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
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
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
