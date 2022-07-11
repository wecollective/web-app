/* eslint-disable react/no-array-index-key */
import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import BeadCardUrlPreview from '@components/cards/BeadCardUrlPreview'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Markdown from '@components/Markdown'
import ImageModal from '@components/modals/ImageModal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { AccountContext } from '@src/contexts/AccountContext'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/cards/PostCard/StringBeadCard2.module.scss'
import { ReactComponent as TextIcon } from '@svgs/font-solid.svg'
import { ReactComponent as ImageIcon } from '@svgs/image-solid.svg'
import { ReactComponent as LinkIcon } from '@svgs/link-solid.svg'
import { ReactComponent as PauseIcon } from '@svgs/pause-solid.svg'
import { ReactComponent as PlayIcon } from '@svgs/play-solid.svg'
import { ReactComponent as AudioIcon } from '@svgs/volume-high-solid.svg'
import * as d3 from 'd3'
import React, { useContext, useState } from 'react'

const StringBeadCard = (props: {
    bead: any
    postId?: number
    postType?: string
    beadIndex: number
    location: string
    removeBead?: (beadIndex: number) => void
    style?: any
}): JSX.Element => {
    const { bead, postId, postType, beadIndex, location, removeBead, style } = props
    const { accountData } = useContext(AccountContext)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const images = bead.PostImages ? bead.PostImages.sort((a, b) => a.index - b.index) : []

    function findBeadIcon(beadType) {
        switch (beadType) {
            case 'string-text':
                return <TextIcon />
            case 'string-url':
                return <LinkIcon />
            case 'string-audio':
                return <AudioIcon />
            case 'string-image':
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

    return (
        <Column className={styles.wrapper} style={{ ...style, backgroundColor: bead.color }}>
            <Row spaceBetween className={styles.beadHeader}>
                {postType && ['glass-bead-game', 'weave'].includes(postType) && (
                    <ImageTitle
                        type='user'
                        imagePath={bead.Creator.flagImagePath}
                        title={bead.Creator.id === accountData.id ? 'You' : bead.Creator.name}
                        fontSize={12}
                        imageSize={20}
                        style={{ marginRight: 10 }}
                    />
                )}
                {findBeadIcon(bead.type)}
                {removeBead && <CloseButton size={20} onClick={() => removeBead(beadIndex)} />}
            </Row>
            <Column centerY className={styles.beadContent}>
                {bead.type === 'string-text' && (
                    <Scrollbars>
                        <Markdown
                            text={bead.text}
                            className={styles.markdown}
                            style={{
                                padding: '0 10px 2px 10px',
                                fontSize: 14,
                                lineHeight: '18px',
                                width: '100%',
                                textAlign: 'center',
                            }}
                        />
                    </Scrollbars>
                )}
                {bead.type === 'string-url' && (
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
                {bead.type === 'string-audio' && (
                    <Column key={beadIndex} spaceBetween style={{ height: '100%' }}>
                        <AudioVisualiser
                            audioElementId={`string-bead-audio-${postId}-${beadIndex}-${location}`}
                            audioURL={bead.url}
                            staticBars={400}
                            staticColor={colors.audioVisualiserColor}
                            dynamicBars={60}
                            dynamicColor={colors.audioVisualiserColor}
                            style={{ width: '100%', height: 100, marginTop: 20 }}
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
                {bead.type === 'string-image' && (
                    <Row centerX>
                        <Scrollbars style={{ paddingBottom: 5 }} className='row'>
                            {images.map((image, i) => (
                                <button
                                    className={styles.image}
                                    key={i}
                                    type='button'
                                    onClick={() => openImageModal(image.id)}
                                >
                                    <img src={image.url} alt='' />
                                </button>
                            ))}
                        </Scrollbars>
                    </Row>
                )}
            </Column>
            {imageModalOpen && (
                <ImageModal
                    images={images}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    close={() => setImageModalOpen(false)}
                />
            )}
        </Column>
    )
}

StringBeadCard.defaultProps = {
    postId: null,
    postType: null,
    removeBead: null,
    style: null,
}

export default StringBeadCard
