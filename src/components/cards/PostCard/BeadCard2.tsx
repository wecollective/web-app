/* eslint-disable react/no-array-index-key */
import AudioCard from '@components/cards/PostCard/PostTypes/Audio'
import UrlPreview from '@components/cards/PostCard/UrlPreview'
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
import { statTitle } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/BeadCard2.module.scss'
import {
    CommentIcon,
    EditIcon,
    LikeIcon,
    LinkIcon,
    SourceIcon,
    VerticalEllipsisIcon,
} from '@svgs/all'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function BeadCard(props: {
    bead: any
    // todo: remove post type?
    postType?: string
    beadIndex: number
    postId?: number
    location: string
    selected?: boolean
    toggleBeadComments?: () => void
    removeBead?: (beadIndex: number) => void
    style?: any
}): JSX.Element {
    const {
        bead: sourceBead,
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
    const [bead, setBead] = useState(sourceBead)
    const {
        id,
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

    // if (type === 'url') console.log('sourceBead: ', sourceBead)

    useEffect(() => setBead(sourceBead), [sourceBead])

    return (
        <Column
            spaceBetween
            className={`${styles.wrapper} ${selected && styles.selected} ${
                bead.Link.relationship === 'source' && styles.source
            } ${location === 'gbg-room' && styles.gbgRoom}`}
            style={{ ...style, backgroundColor: bead.color }}
        >
            <div className={styles.watermark} />
            <Row spaceBetween centerY className={styles.header}>
                {/* {postType && ['glass-bead-game', 'weave'].includes(postType) && ( */}
                <ImageTitle
                    type='user'
                    imagePath={bead.Creator.flagImagePath}
                    title={findUserTitle()}
                    fontSize={12}
                    imageSize={20}
                    style={{ marginRight: 10 }}
                />
                {/* )} */}
                {/* <Row centerX centerY className={styles.beadType}>
                    {postTypeIcons[type]}
                </Row> */}
                <Row centerY>
                    {removeBead && beadIndex !== 0 && (
                        <CloseButton size={20} onClick={() => removeBead(beadIndex)} />
                    )}
                    {!!id && (
                        <Link to={`/p/${id}`} className={styles.id} title='Open post page'>
                            <p className='grey'>ID:</p>
                            <p style={{ marginLeft: 5 }}>{id}</p>
                        </Link>
                    )}
                    {/* <a hr className={styles.id}>
                        <p className='grey'>ID:</p>
                        <p style={{ marginLeft: 5 }}>{id}</p>
                    </button> */}
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
            </Row>
            {bead.state === 'account-deleted' ? (
                <Column centerY centerX style={{ height: '100%' }}>
                    <p className='grey'>[Account deleted]</p>
                </Column>
            ) : (
                <Column centerY className={styles.content}>
                    {type === 'text' && (
                        <Scrollbars style={{ marginBottom: showFooter ? 0 : 10 }}>
                            <DraftText stringifiedDraft={bead.text} />
                        </Scrollbars>
                    )}
                    {type === 'url' && <UrlPreview type='bead' urlData={Urls[0]} />}
                    {type === 'audio' && Audios && (
                        <AudioCard
                            id={location === 'gbg-room' ? beadIndex : id}
                            url={Audios[0].url || URL.createObjectURL(Audios[0].file)}
                            location={location}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
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

BeadCard.defaultProps = {
    postId: null,
    postType: null,
    selected: false,
    toggleBeadComments: null,
    removeBead: null,
    style: null,
}

export default BeadCard
