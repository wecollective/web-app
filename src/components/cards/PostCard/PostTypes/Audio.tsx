import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import Column from '@components/Column'
import Row from '@components/Row'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/cards/PostCard/PostTypes/Audio.module.scss'
import { PauseIcon, PlayIcon } from '@svgs/all'
import * as d3 from 'd3'
import React, { useState } from 'react'

const Audio = (props: { id: number; url: string; location: string }): JSX.Element => {
    const { id, url, location } = props
    const [audioPlaying, setAudioPlaying] = useState(false)

    function toggleAudio() {
        const audio = d3.select(`#post-audio-${id}-${location}`).node()
        if (audio) {
            if (audio.paused) {
                // pause all playing audio
                d3.selectAll('audio')
                    .nodes()
                    .forEach((node) => node.pause())
                audio.play()
            } else audio.pause()
        }
    }

    return (
        <Column>
            <AudioVisualiser
                audioElementId={`post-audio-${id}-${location}`}
                audioURL={url}
                staticBars={1200}
                staticColor={colors.audioVisualiserStatic}
                dynamicBars={160}
                dynamicColor={colors.audioVisualiserDynamic}
                style={{ height: 80, margin: '20px 0 10px 0' }}
            />
            <Row centerY>
                <button
                    className={styles.playButton}
                    type='button'
                    aria-label='toggle-audio'
                    onClick={toggleAudio}
                >
                    {audioPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <AudioTimeSlider
                    audioElementId={`post-audio-${id}-${location}`}
                    audioURL={url}
                    location={location}
                    onPlay={() => setAudioPlaying(true)}
                    onPause={() => setAudioPlaying(false)}
                    onEnded={() => setAudioPlaying(false)}
                />
            </Row>
        </Column>
    )
}

export default Audio
