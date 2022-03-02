import React, { useContext, useEffect, useState, useRef } from 'react'
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
    const [thumbOffset, setThumbOffset] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)

    function toggleBeadAudio(beadIndex: number, reset?: boolean): void {
        const audio = d3.select(`#gbg-bead-${postId}-${beadIndex}`).select('audio').node()
        if (audio) {
            if (!audio.paused) audio.pause()
            else {
                // pause all playing beads
                const allBeads = d3.selectAll('.gbg-bead').select('audio').nodes()
                for (let i = 0; i < allBeads.length; i += 1) {
                    if (!allBeads[i].paused) allBeads[i].pause()
                }
                // start selected bead
                if (reset) audio.currentTime = 0
                audio.play()
            }
        }
    }

    function updateSlider(e) {
        // setSliderPercent(e.target.value)
        // const thumbWidth = 15
        // const offset = (thumbWidth / 100) * e.target.value * -1
        // setThumbOffset(offset)
    }

    function onLoadedData(e) {
        console.log('duration: ', e.currentTarget.duration.toFixed(0))
    }

    function onTimeUpdate(e) {
        // console.log('curentTime: ', e.currentTarget.currentTime)
        const percent = (e.currentTarget.currentTime / e.currentTarget.duration) * 100
        setSliderPercent(+percent)
        setCurrentTime(e.currentTarget.currentTime)

        const thumbWidth = 15
        const offset = (thumbWidth / 100) * percent * -1
        setThumbOffset(offset)
    }

    useEffect(() => {
        if (audioRef && audioRef.current) {
            audioRef.current.src = bead.beadUrl
            audioRef.current.addEventListener('play', () => setAudioPlaying(true))
            audioRef.current.addEventListener('pause', () => setAudioPlaying(false))
            audioRef.current.addEventListener('ended', () => toggleBeadAudio(index + 1, true))
        }
    }, [])

    return (
        <Column
            spaceBetween
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
            <img src='/icons/gbg/sound-wave.png' alt='sound-wave' />
            <Row centerY className={styles.controls}>
                <button
                    className={styles.playButton}
                    type='button'
                    aria-label='toggle-audio'
                    onClick={() => toggleBeadAudio(index)}
                >
                    {audioPlaying ? <PauseIconSVG /> : <PlayIconSVG />}
                </button>
                <div className={styles.slider}>
                    <div className={styles.progressBarBackground} />
                    <div className={styles.progressBar} style={{ width: `${sliderPercent}%` }} />
                    <div
                        className={styles.thumb}
                        style={{ left: `${sliderPercent}%`, marginLeft: `${thumbOffset}px` }}
                    />
                    <input type='range' onChange={updateSlider} />
                </div>
            </Row>
            <audio ref={audioRef} onLoadedData={onLoadedData} onTimeUpdate={onTimeUpdate}>
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
