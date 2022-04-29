import React, { useState } from 'react'
import * as d3 from 'd3'
import styles from '@styles/components/cards/StringBeadCard.module.scss'
import colors from '@styles/Colors.module.scss'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import BeadCardUrlPreview from '@components/Cards/BeadCardUrlPreview'
import Markdown from '@components/Markdown'
import Scrollbars from '@components/Scrollbars'
import CloseButton from '@components/CloseButton'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import { ReactComponent as TextIconSVG } from '@svgs/font-solid.svg'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'
import { ReactComponent as AudioIconSVG } from '@svgs/volume-high-solid.svg'
import { ReactComponent as ImageIconSVG } from '@svgs/image-solid.svg'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'
import { ReactComponent as ChevronLeftSVG } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as ChevronRightSVG } from '@svgs/chevron-right-solid.svg'

const StringBeadCard = (props: {
    bead: any
    index: number
    stringLength: number
    removeBead: (index: number) => void
    moveBead: (index: number, increment: number) => void
}): JSX.Element => {
    const { bead, index, stringLength, removeBead, moveBead } = props
    const [audioPlaying, setAudioPlaying] = useState(false)

    function findBeadIcon(beadType) {
        switch (beadType) {
            case 'text':
                return <TextIconSVG />
            case 'url':
                return <LinkIconSVG />
            case 'audio':
                return <AudioIconSVG />
            case 'image':
                return <ImageIconSVG />
            default:
                return null
        }
    }

    function toggleAudio() {
        const beadAudio = d3.select(`#string-bead-audio-${index}`).node()
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

    return (
        <Column spaceBetween className={styles.wrapper} key={index}>
            <Row spaceBetween className={styles.beadHeader}>
                {findBeadIcon(bead.type)}
                <CloseButton size={20} onClick={() => removeBead(index)} />
            </Row>
            <Column className={styles.beadContent}>
                {bead.type === 'text' && (
                    <Scrollbars>
                        <Markdown
                            text={bead.text}
                            style={{
                                padding: '0 5px',
                                fontSize: 10,
                                lineHeight: '13px',
                                width: '100%',
                                textAlign: 'center',
                            }}
                        />
                    </Scrollbars>
                )}
                {bead.type === 'url' && (
                    <Scrollbars>
                        <BeadCardUrlPreview
                            url={bead.url}
                            image={bead.urlData.image}
                            domain={bead.urlData.domain}
                            title={bead.urlData.title}
                            description={bead.urlData.description}
                        />
                    </Scrollbars>
                )}
                {bead.type === 'audio' && (
                    <Column style={{ marginBottom: 20, width: 400 }}>
                        <p>{bead.audioFile.name}</p>
                        <AudioVisualiser
                            audioElementId={`string-bead-audio-${index}`}
                            audioURL={URL.createObjectURL(bead.audioFile)}
                            staticBars={1200}
                            staticColor={colors.audioVisualiserColor}
                            dynamicBars={160}
                            dynamicColor={colors.audioVisualiserColor}
                            style={{ width: '100%', height: 80 }}
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
                                audioElementId={`string-bead-audio-${index}`}
                                audioURL={URL.createObjectURL(bead.audioFile)}
                                onPlay={() => setAudioPlaying(true)}
                                onPause={() => setAudioPlaying(false)}
                                onEnded={() => setAudioPlaying(false)}
                            />
                        </Row>
                    </Column>
                )}
            </Column>
            <Row className={styles.beadFooter}>
                {index !== 0 && (
                    <button type='button' onClick={() => moveBead(index, -1)} style={{ left: 0 }}>
                        <ChevronLeftSVG />
                    </button>
                )}
                {index < stringLength - 1 && (
                    <button type='button' onClick={() => moveBead(index, 1)} style={{ right: 0 }}>
                        <ChevronRightSVG />
                    </button>
                )}
            </Row>
        </Column>
    )
}

export default StringBeadCard
