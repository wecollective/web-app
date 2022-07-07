import React from 'react'
import styles from '@styles/components/cards/PostCard/PostCardUrlPreview.module.scss'
import Row from '@components/Row'
import Column from '@components/Column'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'

const PostCardUrlPreview = (props: {
    url: string
    image: string | null
    domain: string | null
    title: string | null
    description: string | null
    style?: any
}): JSX.Element => {
    const { url, image, domain, title, description, style } = props

    const availableMetaData = image || domain || title || description

    function handleImageError(e) {
        e.target.onerror = null
        if (!e.target.src.includes('//images.weserv.nl/')) {
            e.target.src = `//images.weserv.nl/?url=${image}`
        } else {
            e.target.src = ''
        }
    }

    return (
        <a className={styles.wrapper} style={style} href={url} target='_blank' rel='noreferrer'>
            {image && (
                <img src={image} onError={(e) => handleImageError(e)} aria-label='URL image' />
            )}
            <Column>
                {availableMetaData ? (
                    <Column className={styles.metaData}>
                        {title && <h1>{title}</h1>}
                        {description && <p>{description}</p>}
                        {domain && (
                            <Row centerY className={styles.domain}>
                                <LinkIconSVG />
                                <p>{domain}</p>
                            </Row>
                        )}
                    </Column>
                ) : (
                    <Column style={{ padding: 10 }}>
                        <p style={{ fontWeight: 800 }}>{url}</p>
                    </Column>
                )}
            </Column>
        </a>
    )
}

PostCardUrlPreview.defaultProps = {
    style: null,
}

export default PostCardUrlPreview
