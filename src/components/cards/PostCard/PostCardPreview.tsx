/* eslint-disable jsx-a11y/control-has-associated-label */
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import {
    dateCreated,
    getDraftPlainText,
    postTypeIcons,
    timeSinceCreated,
    timeSinceCreatedShort,
    trimText,
} from '@src/Helpers'
import PostSpaces from '@src/components/cards/PostCard/PostSpaces'
import styles from '@styles/components/cards/PostCard/PostCardPreview.module.scss'
import React, { useContext } from 'react'

function PostCardPreview(props: { postData: any; onClick?: () => void; style?: any }): JSX.Element {
    const { postData, onClick, style } = props
    const {
        id,
        type,
        title,
        text,
        createdAt,
        updatedAt,
        DirectSpaces,
        Urls,
        Images,
        GlassBeadGame: GBG,
        CardSides,
    } = postData
    const { accountData } = useContext(AccountContext)
    const mobileView = document.documentElement.clientWidth < 900
    const imageSize = 28

    return (
        <Column className={styles.post} style={style}>
            {onClick && <button className={styles.button} type='button' onClick={onClick} />}
            <Row spaceBetween centerY className={styles.header}>
                <Row centerY>
                    <ImageTitle
                        type='user'
                        imagePath={accountData.flagImagePath}
                        imageSize={imageSize}
                        title={accountData.name}
                        style={{ marginRight: 5 }}
                        shadow
                    />
                    <PostSpaces spaces={DirectSpaces} size={imageSize} preview />
                    <Row className={styles.time}>
                        <p className='grey' title={`Posted at ${dateCreated(createdAt)}`}>
                            {mobileView
                                ? timeSinceCreatedShort(createdAt)
                                : timeSinceCreated(createdAt)}
                        </p>
                        {createdAt !== updatedAt && (
                            <p
                                className='grey'
                                title={`Edited at ${dateCreated(updatedAt)}`}
                                style={{ paddingLeft: 5 }}
                            >
                                *
                            </p>
                        )}
                    </Row>
                </Row>
                <Row>
                    <p className='grey'>ID:</p>
                    <p style={{ marginLeft: 5 }}>{id}</p>
                </Row>
            </Row>
            <Row className={styles.content}>
                <Column centerY style={{ height: '100%' }}>
                    <Column centerX centerY className={styles.typeIcon}>
                        {postTypeIcons[type]}
                    </Column>
                </Column>
                <Column style={{ width: '100%' }}>
                    {title && <h1 className={styles.title}>{trimText(title, 50)}</h1>}
                    {type === 'glass-bead-game' && (
                        <Row centerY className={styles.gbg}>
                            {GBG.topicImage && <img src={GBG.topicImage} alt='topic' />}
                            {GBG.topic && (
                                <h1 className={styles.title}>{trimText(GBG.topic, 30)}</h1>
                            )}
                        </Row>
                    )}
                    {text && <p className={styles.text}>{trimText(getDraftPlainText(text), 80)}</p>}
                    {type === 'card' && (
                        <Row centerY className={styles.card}>
                            <Row className={styles.cardFace}>
                                {CardSides[0].Images[0] && (
                                    <img src={CardSides[0].Images[0].url} alt='card front' />
                                )}
                            </Row>
                            <Row className={styles.cardFace}>
                                {CardSides[1].Images[0] && (
                                    <img src={CardSides[1].Images[0].url} alt='card back' />
                                )}
                            </Row>
                        </Row>
                    )}
                    {Urls[0] && (
                        <Row centerY className={styles.url}>
                            <img src={Urls[0].image} alt='URL' />
                            <Column>
                                {Urls[0].title && (
                                    <p className={styles.urlTitle}>{trimText(Urls[0].title, 60)}</p>
                                )}
                                {Urls[0].description && (
                                    <p className={styles.urlDescription}>
                                        {trimText(Urls[0].description, 60)}
                                    </p>
                                )}
                            </Column>
                        </Row>
                    )}
                    {type === 'image' && (
                        <Row centerY className={styles.images}>
                            {Images.map((image) => (
                                <img key={image.id} src={image.url} alt='' />
                            ))}
                        </Row>
                    )}
                </Column>
            </Row>
        </Column>
    )
}

PostCardPreview.defaultProps = {
    style: null,
    onClick: null,
}

export default PostCardPreview
