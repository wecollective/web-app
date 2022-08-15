import Column from '@components/Column'
import Row from '@components/Row'
import { handleImageError } from '@src/Helpers'
import styles from '@styles/components/cards/BeadCardUrlPreview.module.scss'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'
import React from 'react'

const BeadCardUrlPreview = (props: {
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
                            <Row centerY centerX className={styles.domain}>
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

BeadCardUrlPreview.defaultProps = {
    style: null,
}

export default BeadCardUrlPreview
