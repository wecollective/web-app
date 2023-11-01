/* eslint-disable react/no-array-index-key */
import CloseButton from '@components/CloseButton'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import StatButton from '@components/StatButton'
import AudioCard from '@components/cards/PostCard/AudioCard'
import UrlPreview from '@components/cards/PostCard/UrlCard'
import DraftText from '@components/draft-js/DraftText'
import EditPostModal from '@components/modals/EditPostModal'
import ImageModal from '@components/modals/ImageModal'
import LikeModal from '@components/modals/LikeModal'
import { AccountContext } from '@contexts/AccountContext'
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
    CastaliaIcon,
    CommentIcon,
    EditIcon,
    LikeIcon,
    LinkIcon,
    PollIcon,
    VerticalEllipsisIcon,
} from '@svgs/all'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function BeadCard(props: {
    bead: any
    // todo: remove post type?
    postType?: string
    beadIndex?: number
    postId?: number
    location: string
    selected?: boolean
    toggleBeadComments?: () => void
    removeBead?: (beadIndex: number) => void
    className?: string
    style?: any
}): JSX.Element {
    const {
        bead: beadProp,
        postId,
        postType,
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
        // type,
        totalLikes,
        totalComments,
        totalLinks,
        accountLike,
        accountComment,
        accountLink,
        Creator,
        Links,
        Urls,
        Audios,
        Images,
        Event,
        CardSides,
    } = bead
    const [menuOpen, setMenuOpen] = useState(false)
    const [editPostModalOpen, setEditPostModalOpen] = useState(false)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const history = useNavigate()

    const images = bead.Images ? bead.Images.sort((a, b) => a.index - b.index) : []
    const type = bead.type.replace('gbg-', '')
    // const isSource = bead.Link && bead.Link.relationship === 'source'
    // const sourceBead = bead.index === 0

    const isOwnPost = accountData && bead.Creator && accountData.id === bead.Creator.id
    const showDropDown =
        isOwnPost &&
        type === 'text' &&
        beadIndex !== 0 &&
        !['create-string-modal', 'next-bead-modal', 'preview'].includes(location)

    const showFooter = location !== 'preview' && bead.state !== 'account-deleted'
    // postType !== 'glass-bead-game' &&
    // !['create-string-modal', 'next-bead-modal'].includes(location)

    function findUserTitle() {
        if (bead.state === 'account-deleted') return '[Account deleted]'
        return isOwnPost ? 'You' : bead.Creator.name
    }

    function toggleBeadAudio(index: number, reset?: boolean): void {
        const beadAudio = d3.select(`#string-bead-audio-${postId}-${index}-${location}`).node()
        if (beadAudio) {
            if (!beadAudio.paused) beadAudio.pause()
            else {
                // pause all playing audio
                d3.selectAll('audio')
                    .nodes()
                    .forEach((node) => node.pause())
                // start selected bead
                if (reset) beadAudio.currentTime = 0
                beadAudio.play()
            }
        }
    }

    function openImageModal(imageId) {
        setSelectedImage(images.find((image) => image.id === imageId))
        setImageModalOpen(true)
    }

    useEffect(() => {
        setBead(beadProp)
        setIsSource(beadProp.Link && beadProp.Link.relationship === 'source')
    }, [beadProp])

    useEffect(() => {
        const beadCard = document.getElementById(`bead-${id}`)
        if (beadCard) {
            beadCard.addEventListener('mouseenter', () =>
                updateDragItem({ type: 'bead', data: bead })
            )
            beadCard.addEventListener('dragstart', (e) => {
                e.stopPropagation()
                const dragItem = document.getElementById('drag-item')
                e.dataTransfer?.setDragImage(dragItem!, 50, 50)
            })
        }
    }, [])

    return (
        <Column
            spaceBetween
            className={`${styles.wrapper} ${className} ${selected && styles.selected} ${
                isSource && styles.source
            } ${location === 'gbg-room' && styles.gbgRoom}`}
            style={{ ...style, backgroundColor: bead.color }}
            draggable
            id={`bead-${id}`}
        >
            <div className={styles.watermark} />
            <Row spaceBetween centerY className={styles.header}>
                <ImageTitle
                    type='user'
                    imagePath={bead.Creator.flagImagePath}
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
                    {showDropDown && (
                        <Row>
                            <button
                                type='button'
                                className={styles.menuButton}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                <VerticalEllipsisIcon />
                            </button>
                            {menuOpen && (
                                <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                                    <Column className={styles.menu}>
                                        {isOwnPost && (
                                            <Column>
                                                <button
                                                    type='button'
                                                    onClick={() => setEditPostModalOpen(true)}
                                                >
                                                    <EditIcon />
                                                    Edit text
                                                </button>
                                            </Column>
                                        )}
                                    </Column>
                                </CloseOnClickOutside>
                            )}
                        </Row>
                    )}
                </Row>
            </Row>
            {bead.state === 'account-deleted' ? (
                <Column centerY centerX style={{ height: '100%' }}>
                    <p className='grey'>[Account deleted]</p>
                </Column>
            ) : (
                <Column centerY className={styles.content}>
                    {type === 'text' && (
                        <Scrollbars style={{ paddingRight: 10, marginBottom: showFooter ? 0 : 10 }}>
                            <DraftText stringifiedDraft={bead.text} />
                        </Scrollbars>
                    )}
                    {type === 'url' && <UrlPreview type='bead' urlData={Urls[0]} />}
                    {type === 'image' && Images && (
                        <button
                            className={styles.image}
                            type='button'
                            onClick={() => openImageModal(Images[0].id)}
                        >
                            <img
                                src={Images[0].url || URL.createObjectURL(Images[0].file)}
                                // onError={(e) => handleImageError(e, Images[0].url)}
                                alt=''
                            />
                        </button>
                    )}
                    {type === 'audio' && Audios && (
                        <AudioCard
                            id={postId}
                            index={beadIndex}
                            url={Audios[0].url || URL.createObjectURL(Audios[0].file)}
                            location={location}
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
                            {bead.text && <p>{trimText(getDraftPlainText(bead.text), 50)}</p>}
                        </Column>
                    )}
                    {type === 'glass-bead-game' && (
                        <Column centerX className={styles.poll}>
                            <CastaliaIcon />
                            <h1>{trimText(title, 30)}</h1>
                            {bead.text && <p>{trimText(getDraftPlainText(bead.text), 50)}</p>}
                        </Column>
                    )}
                    {type === 'card' && (
                        <Column centerX className={styles.card}>
                            {title && <h1>{trimText(title, 30)}</h1>}
                            {bead.text && <p>{trimText(getDraftPlainText(bead.text), 50)}</p>}
                            <Row>
                                {CardSides[0].Images[0] && (
                                    <img src={CardSides[0].Images[0].url} alt='card front' />
                                )}
                                {CardSides[1].Images[0] && (
                                    <img src={CardSides[1].Images[0].url} alt='card back' />
                                )}
                            </Row>
                        </Column>
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
                    images={images}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
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
                            totalLikes: bead.totalLikes + (bead.accountLike ? -1 : 1),
                            accountLike: !bead.accountLike,
                        })
                    }}
                    close={() => setLikeModalOpen(false)}
                />
            )}
            {editPostModalOpen && (
                <EditPostModal
                    postData={bead}
                    setPostData={setBead}
                    close={() => setEditPostModalOpen(false)}
                />
            )}
        </Column>
    )
}

BeadCard.defaultProps = {
    postId: null,
    beadIndex: 0,
    postType: null,
    selected: false,
    toggleBeadComments: null,
    removeBead: null,
    className: null,
    style: null,
}

export default BeadCard
