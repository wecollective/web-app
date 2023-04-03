import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/cards/BeadCard.module.scss'
import { PauseIcon, PlayIcon, ShareIcon } from '@svgs/all'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'

function BeadCard(props: {
    postId: number
    location: 'space-posts' | 'user-posts' | 'post-page' | 'space-post-map' | 'gbg' | 'preview'
    index: number
    bead: any
    highlight?: boolean
    style?: any
    className?: string
}): JSX.Element {
    const { postId, location, index, bead, highlight, style, className } = props
    const { accountData } = useContext(AccountContext)
    const [firstRun, setFirstRun] = useState(true)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const [highlighted, setHighlighted] = useState(highlight)
    const audioId = `gbg-bead-audio-${postId}-${index}-${location}`

    const [beadUrlModalOpen, setBeadUrlModalOpen] = useState(false)

    function toggleBeadAudio(beadIndex: number, reset?: boolean): void {
        const beadAudio = d3.select(`#gbg-bead-audio-${postId}-${beadIndex}-${location}`).node()
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

    useEffect(() => {
        if (firstRun) setFirstRun(false)
        else if (audioPlaying) setHighlighted(true)
        else setHighlighted(false)
    }, [audioPlaying])

    return (
        <Column
            id={`gbg-bead-${postId}-${index}-${location}`}
            className={`gbg-bead ${styles.bead} ${highlighted && styles.focused} ${className}`}
            style={style}
        >
            <Row spaceBetween>
                <ImageTitle
                    type='user'
                    imagePath={bead.user.flagImagePath}
                    title={bead.user.id === accountData.id ? 'You' : bead.user.name}
                    fontSize={12}
                    imageSize={20}
                    style={{ marginRight: 10, overflow: 'hidden' }}
                />
                <button
                    type='button'
                    onClick={() => setBeadUrlModalOpen(true)}
                    className={styles.shareButton}
                >
                    <ShareIcon />
                </button>
                {beadUrlModalOpen && (
                    <Modal centered close={() => setBeadUrlModalOpen(false)}>
                        <h1>Bead Url</h1>
                        <p>{`https://weco.io/p/${postId}?bead=${index}`}</p>
                    </Modal>
                )}
            </Row>
            <Row centerX centerY className={styles.centerPanel}>
                <AudioVisualiser
                    audioElementId={audioId}
                    audioURL={bead.beadUrl}
                    staticBars={400}
                    staticColor={location === 'gbg' ? '#666' : colors.audioVisualiserColor}
                    dynamicBars={80}
                    dynamicColor={location === 'gbg' ? '#666' : colors.audioVisualiserColor}
                    style={{ width: '100%', height: 50 }}
                />
                <button
                    className={styles.playButton}
                    style={{ color: location === 'gbg' ? '#000' : '#82bdff' }}
                    type='button'
                    aria-label='toggle-audio'
                    onClick={() => toggleBeadAudio(index)}
                >
                    {audioPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
            </Row>
            <AudioTimeSlider
                audioElementId={audioId}
                audioURL={bead.beadUrl}
                location={location}
                onPlay={() => setAudioPlaying(true)}
                onPause={() => setAudioPlaying(false)}
                onEnded={() => toggleBeadAudio(index + 1, true)}
            />
        </Column>
    )
}

BeadCard.defaultProps = {
    highlight: false,
    style: null,
    className: null,
}

export default BeadCard
