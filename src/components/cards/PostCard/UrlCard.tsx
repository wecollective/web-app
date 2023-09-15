import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import styles from '@styles/components/cards/PostCard/UrlCard.module.scss'
import { LinkIcon } from '@svgs/all'
import React, { useEffect, useState } from 'react'

function UrlCard(props: {
    type: 'post' | 'bead'
    urlData: any
    loading?: boolean
    style?: any
    remove?: (url?: string) => void
}): JSX.Element {
    const { type, urlData, loading, style, remove } = props
    const { url, image, domain, title, description } = urlData
    const [workingImage, setWorkingImage] = useState('')
    const availableMetaData = image || domain || title || description

    function handleImageError(e) {
        e.target.onerror = null
        // if http address and not already proxied, proxy via images.weserv.nl
        if (!workingImage.includes('https://') && !workingImage.includes('//images.weserv.nl/')) {
            setWorkingImage(`//images.weserv.nl/?url=${workingImage}`)
        } else setWorkingImage('')
    }

    useEffect(() => setWorkingImage(image || ''), [image])

    if (loading)
        return (
            <Row centerX centerY className={styles.loading} style={style}>
                <LoadingWheel size={30} />
            </Row>
        )
    return (
        <Row className={`${styles.wrapper} ${styles[type]}`} style={style}>
            {remove && (
                <CloseButton
                    size={20}
                    onClick={() => remove(url)}
                    style={{ position: 'absolute', top: 5, right: 5 }}
                />
            )}
            <a
                href={url}
                target='_blank'
                rel='noreferrer'
                style={{ pointerEvents: remove ? 'none' : 'auto' }}
            >
                {workingImage.length > 0 ? (
                    <img
                        src={workingImage}
                        onError={(e) => handleImageError(e)}
                        aria-label='URL image'
                    />
                ) : (
                    <Column centerX centerY className={styles.urlIcon}>
                        <LinkIcon />
                    </Column>
                )}
                <Column>
                    {availableMetaData ? (
                        <Column className={styles.metaData}>
                            {title && <h1>{title}</h1>}
                            {description && <p>{description}</p>}
                            {domain && (
                                <Row centerY className={styles.domain}>
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
        </Row>
    )
}

UrlCard.defaultProps = {
    loading: false,
    style: null,
    remove: null,
}

export default UrlCard
