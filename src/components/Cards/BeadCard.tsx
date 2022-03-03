import React, { useContext, useEffect, useState } from 'react'
import * as d3 from 'd3'
import styles from '@styles/components/cards/BeadCard.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import ImageTitle from '@components/ImageTitle'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
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
    const [sliderPercent, setSliderPercent] = useState(0)
    const [bufferPercent, setBufferPercent] = useState(0)
    const [thumbOffset, setThumbOffset] = useState(0)
    const [duration, setDuration] = useState('00m 00s')
    const [currentTime, setCurrentTime] = useState('00m 00s')
    const audio = d3.select(`#gbg-bead-${postId}-${index}`).select('audio').node()

    function toggleBeadAudio(beadIndex: number, reset?: boolean): void {
        const beadAudio = d3.select(`#gbg-bead-${postId}-${beadIndex}`).select('audio').node()
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

    function formatTime(seconds) {
        // format: '00m 00s'
        const mins = Math.floor(seconds / 60)
        const secs = mins ? seconds - mins * 60 : seconds
        return `${mins < 10 ? '0' : ''}${mins}m ${+secs < 10 ? '0' : ''}${secs}s`
    }

    function updateThumbOffset(percent) {
        const thumbWidth = 15
        setThumbOffset(-(thumbWidth / 100) * percent)
    }

    function updateSlider(e) {
        setSliderPercent(e.target.value)
        updateThumbOffset(e.target.value)
        audio.currentTime = (audio.duration / 100) * e.target.value
    }

    function onLoadedData(e) {
        setDuration(formatTime(+e.currentTarget.duration.toFixed(0)))
    }

    function onTimeUpdate(e) {
        const percent = (e.currentTarget.currentTime / e.currentTarget.duration) * 100
        setSliderPercent(percent)
        setCurrentTime(formatTime(+e.currentTarget.currentTime.toFixed(0)))
        updateThumbOffset(percent)
    }

    useEffect(() => {
        if (audio) {
            audio.src = bead.beadUrl
            d3.select(audio)
                .on('play.beadCard', () => setAudioPlaying(true))
                .on('pause.beadCard', () => setAudioPlaying(false))
                .on('ended.beadCard', () => toggleBeadAudio(index + 1, true))
                .on('progress.beadCard', () => {
                    if (audio && audio.duration > 0) {
                        for (let i = 0; i < audio.buffered.length; i += 1) {
                            const percent =
                                (audio.buffered.end(audio.buffered.length - 1 - i) /
                                    audio.duration) *
                                100
                            setBufferPercent(percent)
                        }
                    }
                })
        }
    }, [audio])

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
                <img src='/icons/gbg/sound-wave.png' alt='sound-wave' />
                <button
                    className={styles.playButton}
                    type='button'
                    aria-label='toggle-audio'
                    onClick={() => toggleBeadAudio(index)}
                >
                    {audioPlaying ? <PauseIconSVG /> : <PlayIconSVG />}
                </button>
            </Row>
            <Row centerY className={styles.slider}>
                <div className={styles.progressBarBackground} />
                <div className={styles.bufferedAmount} style={{ width: `${bufferPercent}%` }} />
                <div className={styles.progressBar} style={{ width: `${sliderPercent}%` }} />
                <div
                    className={styles.thumb}
                    style={{ left: `${sliderPercent}%`, marginLeft: `${thumbOffset}px` }}
                />
                <input type='range' onClick={updateSlider} onChange={updateSlider} />
            </Row>
            <Row centerY spaceBetween className={styles.times}>
                <p>{currentTime}</p>
                <p>{duration}</p>
            </Row>
            <audio onLoadedData={onLoadedData} onTimeUpdate={onTimeUpdate}>
                <track kind='captions' />
            </audio>
        </Column>
    )
}

BeadCard.defaultProps = {
    style: null,
    className: null,
}

export default BeadCard
