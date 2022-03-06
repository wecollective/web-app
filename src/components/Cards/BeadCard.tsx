import React, { useContext, useEffect, useState } from 'react'
import * as d3 from 'd3'
import styles from '@styles/components/cards/BeadCard.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import ImageTitle from '@components/ImageTitle'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'

const BeadCard = (props: {
    postId: number
    index: number
    bead: any
    style?: any
    className?: string
}): JSX.Element => {
    const { postId, index, bead, style, className } = props
    const { accountData } = useContext(AccountContext)
    const [audioPlaying, setAudioPlaying] = useState(false)
    const audioId = `gbg-bead-audio-${postId}-${index}`

    function toggleBeadAudio(beadIndex: number, reset?: boolean): void {
        const beadAudio = d3.select(`#gbg-bead-audio-${postId}-${beadIndex}`).node()
        if (beadAudio) {
            if (!beadAudio.paused) beadAudio.pause()
            else {
                // pause all playing beads
                const allBeads = d3.selectAll('.gbg-bead').select('audio').nodes()
                for (let i = 0; i < allBeads.length; i += 1) {
                    if (!allBeads[i].paused) allBeads[i].pause()
                }
                // start selected bead
                if (reset) beadAudio.currentTime = 0
                beadAudio.play()
            }
        }
    }

    useEffect(() => {
        const audio = d3.select(`#${audioId}`).node()
        if (audio) {
            audio.crossOrigin = 'anonymous'
            audio.src = bead.beadUrl
            d3.select(audio)
                .on('play.beadCard', () => setAudioPlaying(true))
                .on('pause.beadCard', () => setAudioPlaying(false))
                .on('ended.beadCard', () => toggleBeadAudio(index + 1, true))
        }
    }, [])

    return (
        <Column
            id={`gbg-bead-${postId}-${index}`}
            className={`gbg-bead ${styles.bead} ${audioPlaying && styles.focused} ${className}`}
            style={style}
        >
            <ImageTitle
                type='user'
                imagePath={bead.user.flagImagePath}
                title={bead.user.id === accountData.id ? 'You' : bead.user.name}
                fontSize={12}
                imageSize={20}
                style={{ marginRight: 10 }}
            />
            <Row centerX centerY className={styles.centerPanel}>
                <AudioVisualiser
                    audioId={audioId}
                    color='#cbd8ff'
                    style={{ width: '100%', height: 50 }}
                />
                <button
                    className={styles.playButton}
                    type='button'
                    aria-label='toggle-audio'
                    onClick={() => toggleBeadAudio(index)}
                >
                    {audioPlaying ? <PauseIconSVG /> : <PlayIconSVG />}
                </button>
            </Row>
            <AudioTimeSlider audioId={audioId} />
        </Column>
    )
}

BeadCard.defaultProps = {
    style: null,
    className: null,
}

export default BeadCard
