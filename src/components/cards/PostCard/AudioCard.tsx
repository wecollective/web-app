import AudioTimeSlider from '@components/AudioTimeSlider'
import AudioVisualiser from '@components/AudioVisualiser'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import Row from '@components/Row'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/cards/PostCard/AudioCard.module.scss'
import { PauseIcon, PlayIcon } from '@svgs/all'
import * as d3 from 'd3'
import React, { useState } from 'react'

function AudioCard(props: {
    id?: number
    index?: number
    url: string
    location: string
    style?: any
    remove?: () => void
}): JSX.Element {
    const { id, index, url, location, style, remove } = props
    const [audioPlaying, setAudioPlaying] = useState(false)

    function toggleAudio() {
        const audio = d3.select(`#post-audio-${location}-${id}-${index}`).node()
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

    function onEnded() {
        setAudioPlaying(false)
        const nextBead = d3.select(`#post-audio-${location}-${id}-${index! + 1}`).node()
        if (nextBead) nextBead.play()
    }

    return (
        <Column style={{ ...style, position: 'relative' }}>
            {remove && (
                <CloseButton
                    size={20}
                    onClick={remove}
                    style={{ position: 'absolute', top: 0, right: 0, zIndex: 5 }}
                />
            )}
            <AudioVisualiser
                audioElementId={`post-audio-${location}-${id}-${index}`}
                audioURL={url}
                staticBars={1200}
                staticColor={colors.audioVisualiserStatic}
                dynamicBars={160}
                dynamicColor={colors.audioVisualiserDynamic}
                style={{ height: location === 'gbg-room' ? 80 : '100%', marginBottom: 10 }}
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
                    audioElementId={`post-audio-${location}-${id}-${index}`}
                    audioURL={url}
                    location={location}
                    onPlay={() => setAudioPlaying(true)}
                    onPause={() => setAudioPlaying(false)}
                    onEnded={onEnded}
                />
            </Row>
        </Column>
    )
}

AudioCard.defaultProps = {
    id: 0,
    index: 0,
    style: null,
    remove: null,
}

export default AudioCard
