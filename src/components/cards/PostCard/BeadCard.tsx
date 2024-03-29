/* eslint-disable react/no-array-index-key */
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import StatButton from '@components/StatButton'
import LoadingWheel from '@components/animations/LoadingWheel'
import AudioCard from '@components/cards/PostCard/AudioCard'
import UrlCard from '@components/cards/PostCard/UrlCard'
import DraftText from '@components/draft-js/DraftText'
import ImageModal from '@components/modals/ImageModal'
import LikeModal from '@components/modals/LikeModal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import {
    findEventDuration,
    findEventTimes,
    getDraftPlainText,
    statTitle,
    trimText,
} from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/BeadCard.module.scss'
import {
    CalendarIcon,
    CardIcon,
    CastaliaIcon,
    CommentIcon,
    LikeIcon,
    LinkIcon,
    PollIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

function BeadCard(props: {
    bead: any
    beadIndex?: number
    postId?: number
    location: string // gbg-room, link-modal (temp: drop modal & toyboxitem), post, preview
    selected?: boolean
    toggleBeadComments?: () => void
    removeBead?: (beadIndex: number) => void
    className?: string
    style?: any
}): JSX.Element {
    const {
        bead: beadProp,
        postId,
        beadIndex,
        location,
        selected,
        toggleBeadComments,
        removeBead,
        className,
        style,
    } = props
    const { accountData, updateDragItem } = useContext(AccountContext)
    const [bead, setBead] = useState(beadProp)
    const [isSource, setIsSource] = useState(false)
    const {
        id,
        title,
        text,
        mediaTypes,
        totalLikes,
        totalComments,
        totalLinks,
        accountLike,
        accountComment,
        accountLink,
        color,
        state,
        Creator,
        Event,
        CardSides,
        // preview data
        urls,
        images,
        audios,
    } = bead
    // todo: add preview prop instead of using location?
    const preview = location === 'preview'
    const [loading, setLoading] = useState(true)
    const [urlBlocks, setUrlBlocks] = useState<any[]>(
        preview ? [{ id: uuidv4(), Url: urls[0] }] : []
    )
    const [imageBlocks, setImageBlocks] = useState<any[]>(preview ? [images[0]] : [])
    const [audioBlocks, setAudioBlocks] = useState<any[]>(preview ? [audios[0]] : [])
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const history = useNavigate()
    const isOwnPost = accountData && Creator && accountData.id === Creator.id
    const showFooter = false // location !== 'preview' && state !== 'account-deleted'
    const types = mediaTypes.split(',')
    const type = types[types.length - 1]

    // todo: maybe better to get the data when items retreived instead of after per bead...? (harder query due to nesting...)
    function getUrls() {
        axios
            .get(`${config.apiURL}/post-urls?postId=${id}`)
            .then((res) => {
                setUrlBlocks(res.data.blocks)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getImages() {
        axios
            .get(`${config.apiURL}/post-images?postId=${id}&offset=0`)
            .then((res) => {
                setImageBlocks(res.data.blocks)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getAudio() {
        axios
            .get(`${config.apiURL}/post-audio?postId=${id}&offset=0`)
            .then((res) => {
                setAudioBlocks(res.data.blocks)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getBeadData() {
        if (preview) setLoading(false)
        else if (mediaTypes.includes('url')) getUrls()
        else if (mediaTypes.includes('image')) getImages()
        else if (mediaTypes.includes('audio')) getAudio()
        else setLoading(false)
    }

    function findUserTitle() {
        if (state === 'account-deleted') return '[Account deleted]'
        return isOwnPost ? 'You' : Creator.name
    }

    function openImageModal(imageId) {
        setSelectedImage(imageBlocks.find((image) => image.id === imageId))
        setImageModalOpen(true)
    }

    function addDragEvents() {
        const beadCard = document.getElementById(`bead-${id}`)
        beadCard?.addEventListener('mouseenter', () => {
            let image = ''
            if (type === 'url' && urlBlocks[0]) image = urlBlocks[0].Url.image
            if (type === 'image' && imageBlocks[0]) image = imageBlocks[0].Image.url
            updateDragItem({ type: 'post', data: { ...bead, image } })
        })
        beadCard?.addEventListener('dragstart', (e) => {
            e.stopPropagation()
            const dragItem = document.getElementById('drag-item')
            e.dataTransfer?.setDragImage(dragItem!, 50, 50)
        })
    }

    useEffect(() => {
        setBead(beadProp)
        setIsSource(beadProp.Link && beadProp.Link.relationship === 'source')
    }, [beadProp])

    useEffect(() => getBeadData(), [])

    useEffect(() => {
        if (!loading) addDragEvents()
    }, [loading])

    return (
        <Column
            spaceBetween
            className={`${styles.wrapper} ${className} ${selected && styles.selected} ${
                isSource && styles.source
            } ${location === 'gbg-room' && styles.gbgRoom}`}
            style={{ ...style, backgroundColor: color }}
            draggable={!preview}
            id={`bead-${id}`}
        >
            <div className={styles.watermark} />
            <Row spaceBetween centerY className={styles.header}>
                <ImageTitle
                    type='user'
                    imagePath={Creator.flagImagePath}
                    title={findUserTitle()}
                    fontSize={12}
                    imageSize={20}
                    style={{ marginRight: 10 }}
                />
                <Row centerY>
                    {removeBead && !isSource && (
                        <CloseButton size={20} onClick={() => removeBead(beadIndex || 0)} />
                    )}
                    {!!id && location !== 'preview' && (
                        <Link to={`/p/${id}`} className={styles.id} title='Open post page'>
                            <p className='grey'>ID:</p>
                            <p style={{ marginLeft: 5 }}>{id}</p>
                        </Link>
                    )}
                    {/* {isSource && (
                        <button
                            type='button'
                            title='Open source bead'
                            className={styles.beadRelationship}
                            onClick={() =>
                                !['create-string-modal', 'next-bead-modal', 'preview'].includes(
                                    location
                                ) && history(`/p/${bead.id}`)
                            }
                        >
                            <SourceIcon />
                        </button>
                    )} */}
                </Row>
            </Row>
            {state === 'account-deleted' ? (
                <Column centerY centerX style={{ height: '100%' }}>
                    <p className='grey'>[Account deleted]</p>
                </Column>
            ) : (
                <Column centerY className={styles.content}>
                    {loading ? (
                        <Column centerX>
                            <LoadingWheel size={30} />
                        </Column>
                    ) : (
                        <>
                            {type === 'text' && text && (
                                <Scrollbars
                                    style={{ paddingRight: 10, marginBottom: showFooter ? 0 : 10 }}
                                >
                                    <DraftText text={text} />
                                </Scrollbars>
                            )}
                            {type === 'text' && !text && <h1>{title}</h1>}
                            {type === 'url' && <UrlCard type='bead' urlData={urlBlocks[0].Url} />}
                            {type === 'image' && (
                                <button
                                    className={styles.image}
                                    type='button'
                                    onClick={() => openImageModal(imageBlocks[0].id)}
                                >
                                    <img
                                        src={imageBlocks[0].Image.url}
                                        // onError={(e) => handleImageError(e, Images[0].url)}
                                        alt=''
                                    />
                                </button>
                            )}
                            {type === 'audio' && (
                                <AudioCard
                                    id={postId}
                                    index={beadIndex}
                                    url={audioBlocks[0].Audio.url}
                                    staticBars={110}
                                    dynamicBars={80}
                                    location='bead-card'
                                    style={{ width: '100%', height: '100%' }}
                                />
                            )}
                            {type === 'event' && (
                                <Column centerX>
                                    <h1>{title}</h1>
                                    <Row wrap centerY className={styles.eventTimes}>
                                        <CalendarIcon />
                                        <p>{findEventTimes(Event.startTime, Event.endTime)}</p>
                                        <p>{findEventDuration(Event.startTime, Event.endTime)}</p>
                                    </Row>
                                </Column>
                            )}
                            {type === 'poll' && (
                                <Column centerX className={styles.poll}>
                                    <PollIcon />
                                    <h1>{trimText(title, 30)}</h1>
                                    {text && <p>{trimText(getDraftPlainText(text), 50)}</p>}
                                </Column>
                            )}
                            {type === 'glass-bead-game' && (
                                <Column centerX className={styles.poll}>
                                    <CastaliaIcon />
                                    <h1>{trimText(title, 30)}</h1>
                                    {text && <p>{trimText(getDraftPlainText(text), 50)}</p>}
                                </Column>
                            )}
                            {type === 'card' && (
                                <Column centerX className={styles.card}>
                                    <CardIcon />
                                    {title && <h1>{trimText(title, 30)}</h1>}
                                    {text && <p>{trimText(getDraftPlainText(text), 50)}</p>}
                                    {/* <Row>
                                        {CardSides[0].Images[0] && (
                                            <img
                                                src={CardSides[0].Images[0].url}
                                                alt='card front'
                                            />
                                        )}
                                        {CardSides[1].Images[0] && (
                                            <img src={CardSides[1].Images[0].url} alt='card back' />
                                        )}
                                    </Row> */}
                                </Column>
                            )}
                        </>
                    )}
                </Column>
            )}
            {showFooter && (
                <Row spaceBetween className={styles.footer}>
                    <StatButton
                        icon={<LikeIcon />}
                        iconSize={20}
                        text={totalLikes || ''}
                        title={statTitle('Like', totalLikes || 0)}
                        color={accountLike && 'blue'}
                        // disabled={location === 'preview'}
                        onClick={() => setLikeModalOpen(true)}
                    />
                    {location !== 'gbg-room' && (
                        <StatButton
                            icon={<CommentIcon />}
                            iconSize={20}
                            text={totalComments || ''}
                            title={statTitle('Comment', totalComments || 0)}
                            // color={accountComment && 'blue'}
                            // disabled={location === 'preview'}
                            onClick={() => toggleBeadComments && toggleBeadComments()}
                        />
                    )}
                    <StatButton
                        icon={<LinkIcon />}
                        iconSize={20}
                        text={totalLinks || ''}
                        title={statTitle('Link', totalLinks || 0)}
                        color={accountLink && 'blue'}
                        // disabled={location === 'preview'}
                        onClick={() => history(`/linkmap?item=post&id=${id}`)}
                    />
                </Row>
            )}
            {imageModalOpen && (
                <ImageModal
                    images={imageBlocks}
                    startIndex={0}
                    close={() => setImageModalOpen(false)}
                />
            )}
            {likeModalOpen && (
                <LikeModal
                    itemType='post'
                    itemData={bead}
                    updateItem={() => {
                        setBead({
                            ...bead,
                            totalLikes: totalLikes + (accountLike ? -1 : 1),
                            accountLike: !accountLike,
                        })
                    }}
                    close={() => setLikeModalOpen(false)}
                />
            )}
        </Column>
    )
}

BeadCard.defaultProps = {
    postId: null,
    beadIndex: 0,
    selected: false,
    toggleBeadComments: null,
    removeBead: null,
    className: null,
    style: null,
}

export default BeadCard
