import Column from '@components/Column'
import Row from '@components/Row'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/UrlPreview.module.scss'
import { LinkIcon } from '@svgs/all'
import React from 'react'

const UrlPreview = (props: {
    url: string
    image: string | null
    domain: string | null
    title: string | null
    description: string | null
    style?: any
}): JSX.Element => {
    const { url, image, domain, title, description, style } = props

    const availableMetaData = image || domain || title || description

    return (
        <a className={styles.wrapper} style={style} href={url} target='_blank' rel='noreferrer'>
            {image && (
                <img
                    src={image}
                    onError={(e) => handleImageError(e, image)}
                    aria-label='URL image'
                />
            )}
            <Column>
                {availableMetaData ? (
                    <Column className={styles.metaData}>
                        {title && <h1>{title}</h1>}
                        {description && <p>{description}</p>}
                        {domain && (
                            <Row centerY className={styles.domain}>
                                <LinkIcon />
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

UrlPreview.defaultProps = {
    style: null,
}

export default UrlPreview
