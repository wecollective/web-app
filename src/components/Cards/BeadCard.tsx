import React, { useContext, useEffect, useState } from 'react'
import * as d3 from 'd3'
import styles from '@styles/components/cards/BeadCard.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import ImageTitle from '@components/ImageTitle'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
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

            const ctx = new AudioContext()
            const audioSource = ctx.createMediaElementSource(audio)
            const analyser = ctx.createAnalyser()

            audioSource.connect(analyser)
            audioSource.connect(ctx.destination)

            const frequencyData = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(frequencyData)

            const numberOfBars = 60
            const barHeight = 20
            const selectedBead = d3.select(`#gbg-bead-${postId}-${index}`)
            const visualiser = selectedBead
                .select(`.${styles.centerPanel}`)
                .append('svg')
                .attr('id', 'visualiser')
                .attr('width', '100%')
                .attr('height', 60)

            const topBars = visualiser.append('g').attr('id', 'top-bars')
            const bottomBars = visualiser
                .append('g')
                .attr('id', 'bottom-bars')
                .attr('transform', 'scale(1,-1)')

            const createBar = (location, type, i) => {
                location
                    .append('rect')
                    .attr('id', `${type}-bar-${i}`)
                    .attr('x', (120 / numberOfBars) * i)
                    .attr('y', type === 'top' ? 30 : -30)
                    .attr('width', 120 / numberOfBars)
                    .attr('fill', '#cbd8ff')
            }

            for (let i = 0; i < numberOfBars; i += 1) {
                createBar(topBars, 'top', i)
                createBar(bottomBars, 'bottom', i)
            }

            const renderVisualizer = () => {
                analyser.getByteFrequencyData(frequencyData)
                for (let i = 0; i < numberOfBars; i += 1) {
                    const barIndex = Math.floor((255 / numberOfBars) * i)
                    const value = (barHeight / 255) * frequencyData[barIndex] // 0 to 255
                    selectedBead.select(`#top-bar-${i}`).attr('height', value)
                    selectedBead.select(`#bottom-bar-${i}`).attr('height', value)
                }
                window.requestAnimationFrame(renderVisualizer)
            }

            renderVisualizer()
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
