/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react'
import * as d3 from 'd3'
import styles from '@styles/components/cards/PostCard/StringBeadCard2.module.scss'
import colors from '@styles/Colors.module.scss'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import BeadCardUrlPreview from '@components/Cards/BeadCardUrlPreview'
import Markdown from '@components/Markdown'
import Scrollbars from '@components/Scrollbars'
import ImageModal from '@components/modals/ImageModal'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import { ReactComponent as TextIconSVG } from '@svgs/font-solid.svg'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'
import { ReactComponent as AudioIconSVG } from '@svgs/volume-high-solid.svg'
import { ReactComponent as ImageIconSVG } from '@svgs/image-solid.svg'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'

const StringBeadCard = (props: {
    bead: any
    postId: number
    beadIndex: number
    location: string
}): JSX.Element => {
    const { bead, postId, beadIndex, location } = props
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const images = bead.PostImages.sort((a, b) => a.index - b.index)

    function findBeadIcon(beadType) {
        switch (beadType) {
            case 'string-text':
                return <TextIconSVG />
            case 'string-url':
                return <LinkIconSVG />
            case 'string-audio':
                return <AudioIconSVG />
            case 'string-image':
                return <ImageIconSVG />
            default:
                return null
        }
    }

    function toggleAudio() {
        const beadAudio = d3.select(`#string-bead-audio-${postId}-${beadIndex}-${location}`).node()
        if (beadAudio) {
            if (!beadAudio.paused) beadAudio.pause()
            else {
                // pause all playing audio
                d3.selectAll('audio')
                    .nodes()
                    .forEach((node) => node.pause())
                // start selected bead
                beadAudio.play()
            }
        }
    }

    function openImageModal(imageId) {
        setSelectedImage(images.find((image) => image.id === imageId))
        setImageModalOpen(true)
    }

    return (
        <Column className={styles.wrapper}>
            <Row spaceBetween className={styles.beadHeader}>
                {findBeadIcon(bead.type)}
            </Row>
            <Column centerY className={styles.beadContent}>
                {bead.type === 'string-text' && (
                    <Scrollbars>
                        <Markdown
                            text={bead.text}
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
                                aria-label='toggle-audio'
                                onClick={toggleAudio}
                            >
                                {audioPlaying ? <PauseIconSVG /> : <PlayIconSVG />}
                            </button>
                            <AudioTimeSlider
                                audioElementId={`string-bead-audio-${postId}-${beadIndex}-${location}`}
                                audioURL={bead.url}
                                onPlay={() => setAudioPlaying(true)}
                                onPause={() => setAudioPlaying(false)}
                                onEnded={() => setAudioPlaying(false)}
                            />
                        </Row>
                    </Column>
                )}
                {bead.type === 'string-image' && (
                    <Row centerX>
                        <Scrollbars style={{ paddingBottom: 5 }}>
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

export default StringBeadCard
