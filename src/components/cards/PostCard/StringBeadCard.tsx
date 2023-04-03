/* eslint-disable react/no-array-index-key */
import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import BeadCardUrlPreview from '@components/cards/BeadCardUrlPreview'
import CloseButton from '@components/CloseButton'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import ImageTitle from '@components/ImageTitle'
import ImageModal from '@components/modals/ImageModal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import StatButton from '@components/StatButton'
import { AccountContext } from '@contexts/AccountContext'
import LikeModal from '@src/components/cards/PostCard/LikeModal'
import LinkModal from '@src/components/cards/PostCard/LinkModal'
import EditPostModal from '@src/components/modals/EditPostModal'
import { handleImageError, statTitle } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/cards/PostCard/StringBeadCard.module.scss'
import {
    AudioIcon,
    CommentIcon,
    EditIcon,
    ImageIcon,
    LikeIcon,
    LinkIcon,
    PauseIcon,
    PlayIcon,
    SourceIcon,
    TextIcon,
    VerticalEllipsisIcon,
} from '@svgs/all'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function StringBeadCard(props: {
    bead: any
    postId?: number
    postType?: string
    beadIndex: number
    location: string
    selected?: boolean
    toggleBeadComments?: () => void
    removeBead?: (beadIndex: number) => void
    style?: any
}): JSX.Element {
    const {
        bead: sourceBeadData,
        postId,
        postType,
        beadIndex,
        location,
        selected,
        toggleBeadComments,
        removeBead,
        style,
    } = props
    const { accountData } = useContext(AccountContext)
    const [bead, setBead] = useState(sourceBeadData)
    const { totalLikes, totalComments, totalLinks, accountLike, accountComment, accountLink } = bead
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
    const isSource = bead.Link && bead.Link.relationship === 'source'
    const isOwnPost = accountData && bead.Creator && accountData.id === bead.Creator.id
    const showDropDown =
        isOwnPost &&
        type === 'text' &&
        bead.Link.relationship !== 'source' &&
        !['create-string-modal', 'next-bead-modal', 'preview'].includes(location)

    const showFooter =
        bead.state !== 'account-deleted' &&
        // postType !== 'glass-bead-game' &&
        !['create-string-modal', 'next-bead-modal'].includes(location)

    function findUserTitle() {
        if (bead.state === 'account-deleted') return '[Account deleted]'
        return isOwnPost ? 'You' : bead.Creator.name
    }

    function findBeadIcon(beadType) {
        switch (beadType) {
            case 'text':
                return <TextIcon />
            case 'url':
                return <LinkIcon />
            case 'audio':
                return <AudioIcon />
            case 'image':
                return <ImageIcon />
            default:
                return null
        }
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

    useEffect(() => setBead(sourceBeadData), [sourceBeadData])

    return (
        <Column
            spaceBetween
            className={`${styles.wrapper} ${selected && styles.selected} ${
                isSource && styles.source
            }`}
            style={{ ...style, backgroundColor: bead.color }}
        >
            {/* <div className={styles.watermark} /> */}
            <Row spaceBetween centerY className={styles.header}>
                {postType && ['glass-bead-game', 'weave'].includes(postType) && (
                    <ImageTitle
                        type='user'
                        imagePath={bead.Creator.flagImagePath}
                        title={findUserTitle()}
                        fontSize={12}
                        imageSize={20}
                        style={{ marginRight: 10 }}
                    />
                )}
                <Row centerX centerY className={styles.beadType}>
                    {findBeadIcon(type)}
                </Row>
                {removeBead && bead.Link.relationship !== 'source' && (
                    <CloseButton size={20} onClick={() => removeBead(beadIndex)} />
                )}
                {bead.Link.relationship === 'source' && (
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
                )}
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
            {bead.state === 'account-deleted' ? (
                <Column centerY centerX style={{ height: '100%' }}>
                    <p className='grey'>[Account deleted]</p>
                </Column>
            ) : (
                <Column centerY className={styles.content}>
                    {type === 'text' && (
                        <Scrollbars>
                            <DraftText stringifiedDraft={bead.text} />
                        </Scrollbars>
                    )}
                    {type === 'url' && (
                        <Scrollbars>
                            <BeadCardUrlPreview
                                url={bead.url}
                                image={bead.urlImage}
                                domain={bead.urlDomain}
                                title={bead.urlTitle}
                                description={bead.urlDescription}
                            />
                        </Scrollbars>
                    )}
                    {type === 'audio' && (
                        <Column key={beadIndex} spaceBetween style={{ height: '100%' }}>
                            <AudioVisualiser
                                audioElementId={`string-bead-audio-${postId}-${beadIndex}-${location}`}
                                audioURL={bead.url}
                                staticBars={200}
                                staticColor={colors.audioVisualiserStatic}
                                dynamicBars={100}
                                dynamicColor={colors.audioVisualiserDynamic}
                                style={{
                                    width: '100%',
                                    height: 150,
                                    marginTop: showFooter ? 10 : 20,
                                }}
                            />
                            <Row centerY>
                                <button
                                    className={styles.playButton}
                                    type='button'
                                    onClick={() => toggleBeadAudio(beadIndex)}
                                >
                                    {audioPlaying ? <PauseIcon /> : <PlayIcon />}
                                </button>
                                <AudioTimeSlider
                                    audioElementId={`string-bead-audio-${postId}-${beadIndex}-${location}`}
                                    audioURL={bead.url}
                                    location='space-posts'
                                    onPlay={() => setAudioPlaying(true)}
                                    onPause={() => setAudioPlaying(false)}
                                    onEnded={() => toggleBeadAudio(beadIndex + 1, true)}
                                />
                            </Row>
                        </Column>
                    )}
                    {type === 'image' && (
                        <Row centerX>
                            <Scrollbars style={{ paddingBottom: 5 }} className='row'>
                                <Row>
                                    {images.map((image, i) => (
                                        <button
                                            className={styles.image}
                                            key={i}
                                            type='button'
                                            onClick={() => openImageModal(image.id)}
                                        >
                                            <img
                                                src={image.url}
                                                onError={(e) => handleImageError(e, image.url)}
                                                alt=''
                                            />
                                        </button>
                                    ))}
                                </Row>
                            </Scrollbars>
                        </Row>
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
                        disabled={location === 'preview'}
                        onClick={() => setLikeModalOpen(true)}
                    />
                    <StatButton
                        icon={<CommentIcon />}
                        iconSize={20}
                        text={totalComments || ''}
                        title={statTitle('Comment', totalComments || 0)}
                        // color={accountComment && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => toggleBeadComments && toggleBeadComments()}
                    />
                    <StatButton
                        icon={<LinkIcon />}
                        iconSize={20}
                        text={totalLinks || ''}
                        title={statTitle('Link', totalLinks || 0)}
                        color={accountLink && 'blue'}
                        disabled={location === 'preview'}
                        onClick={() => setLinkModalOpen(true)}
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
                    close={() => setLikeModalOpen(false)}
                    postData={bead}
                    setPostData={setBead}
                />
            )}
            {linkModalOpen && (
                <LinkModal
                    type='bead'
                    location={location}
                    postId={postId}
                    postData={bead}
                    setPostData={setBead}
                    close={() => setLinkModalOpen(false)}
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

StringBeadCard.defaultProps = {
    postId: null,
    postType: null,
    selected: false,
    toggleBeadComments: null,
    removeBead: null,
    style: null,
}

export default StringBeadCard
