/* eslint-disable jsx-a11y/control-has-associated-label */
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import AudioCard from '@components/cards/PostCard/AudioCard'
import PostSpaces from '@components/cards/PostCard/PostSpaces'
import config from '@src/Config'
import {
    dateCreated,
    getDraftPlainText,
    timeSinceCreated,
    timeSinceCreatedShort,
    trimText,
} from '@src/Helpers'
import LoadingWheel from '@src/components/animations/LoadingWheel'
import styles from '@styles/components/cards/PostCard/PostCardPreview.module.scss'
import { CalendarIcon, CardIcon, LinkIcon, PollIcon } from '@svgs/all'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function PostCardPreview(props: {
    post: any
    link: string
    onClick?: () => void
    style?: any
}): JSX.Element {
    const { post, link, onClick, style } = props
    const {
        id,
        type,
        mediaTypes,
        title,
        text,
        createdAt,
        updatedAt,
        Creator,
        DirectSpaces,
        GlassBeadGame,
    } = post
    const [loading, setLoading] = useState(true)
    const [url, setUrl] = useState<any>(null)
    const [image, setImage] = useState<any>(null)
    const [audio, setAudio] = useState<any>(null)
    const mobileView = document.documentElement.clientWidth < 900
    const imageSize = 28

    function getPreviewData() {
        const isBlock = ['url', 'image', 'audio'].includes(type)
        if (isBlock) {
            if (type === 'url') setUrl(post.Url)
            if (type === 'image') setUrl(post.Image)
            if (type === 'audio') setUrl(post.Audio)
            setLoading(false)
        } else {
            axios
                .get(`${config.apiURL}/post-preview-data?postId=${id}`)
                .then((res) => {
                    setUrl(res.data.url)
                    setImage(res.data.image)
                    setAudio(res.data.audio)
                    setLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => {
        const hasMedia = ['url', 'image', 'audio'].some((media) => mediaTypes.includes(media))
        if (hasMedia) getPreviewData()
        else setLoading(false)
    }, [])

    return (
        <Link to={link} onClick={onClick} className={styles.post} style={style}>
            <Row spaceBetween centerY className={styles.header}>
                <Row centerY>
                    <ImageTitle
                        type='user'
                        imagePath={Creator.flagImagePath}
                        imageSize={imageSize}
                        title={Creator.name}
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
                {loading ? (
                    <Column centerX className={styles.block}>
                        <LoadingWheel size={24} />
                    </Column>
                ) : (
                    <Row style={{ width: '100%' }}>
                        {mediaTypes.includes('poll') && (
                            <Column centerY centerX className={styles.typeIcon}>
                                <PollIcon />
                            </Column>
                        )}
                        {mediaTypes.includes('event') && (
                            <Column centerY centerX className={styles.typeIcon}>
                                <CalendarIcon />
                            </Column>
                        )}
                        {mediaTypes.includes('card') && (
                            <Column centerY centerX className={styles.typeIcon}>
                                <CardIcon />
                            </Column>
                        )}
                        <Column style={{ width: '100%' }}>
                            {!mediaTypes.includes('glass-bead-game') && title && (
                                <p className={styles.title}>{trimText(title, 50)}</p>
                            )}
                            {mediaTypes.includes('glass-bead-game') && (
                                <Row centerY className={styles.gbg}>
                                    {GlassBeadGame.topicImage && (
                                        <img src={GlassBeadGame.topicImage} alt='topic' />
                                    )}
                                    {title && (
                                        <p className={styles.title} style={{ margin: 0 }}>
                                            {trimText(title, 30)}
                                        </p>
                                    )}
                                </Row>
                            )}
                            {text && (
                                <p className={styles.text}>
                                    {trimText(getDraftPlainText(text), 80)}
                                </p>
                            )}
                            {mediaTypes.includes('url') && (
                                <Row centerY className={`${styles.block} ${styles.url}`}>
                                    {url.image ? (
                                        <img
                                            src={url.image}
                                            alt='URL'
                                            onError={() => setUrl({ ...url, image: null })}
                                        />
                                    ) : (
                                        <LinkIcon />
                                    )}
                                    <Column>
                                        {url.title && (
                                            <p className={styles.urlTitle}>
                                                {trimText(url.title, 60)}
                                            </p>
                                        )}
                                        {url.description && (
                                            <p className={styles.description}>
                                                {trimText(url.description, 60)}
                                            </p>
                                        )}
                                        {!url.title && !url.description && (
                                            <p className={styles.description}>
                                                {trimText(url.url, 60)}
                                            </p>
                                        )}
                                    </Column>
                                </Row>
                            )}
                            {mediaTypes.includes('image') && (
                                <Row centerX className={`${styles.block} ${styles.image}`}>
                                    <img src={image.url} alt='' />
                                </Row>
                            )}
                            {mediaTypes.includes('audio') && (
                                <Row centerX className={`${styles.block} ${styles.image}`}>
                                    <AudioCard
                                        id={audio.id}
                                        url={audio.url}
                                        staticBars={250}
                                        location='post-preview'
                                        style={{ height: 160, width: '100%' }}
                                    />
                                </Row>
                            )}
                        </Column>
                    </Row>
                )}
            </Row>
        </Link>
    )
}

PostCardPreview.defaultProps = {
    style: null,
    onClick: null,
}

export default PostCardPreview

/* {mediaTypes.includes('card') && (
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
{mediaTypes.includes('card-face') && (
    <Row centerY className={styles.card}>
        <Row className={styles.cardFace}>
            {Images[0] && <img src={Images[0].url} alt='card front' />}
        </Row>
    </Row>
)} */
