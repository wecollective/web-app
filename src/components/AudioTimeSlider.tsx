import React, { useState, useEffect } from 'react'
import * as d3 from 'd3'
import styles from '@styles/components/AudioTimeSlider.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'

const AudioTimeSlider = (props: { audioId: string }): JSX.Element => {
    const { audioId } = props
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [sliderPercent, setSliderPercent] = useState(0)
    const [bufferPercent, setBufferPercent] = useState(0)
    const [thumbOffset, setThumbOffset] = useState(0)

    function formatTime(seconds) {
        // output: '00m 00s'
        const mins = Math.floor(seconds / 60)
        const secs = mins ? seconds - mins * 60 : seconds
        return `${mins < 10 ? '0' : ''}${mins}m ${+secs < 10 ? '0' : ''}${secs}s`
    }

    function updateThumbOffset(percent) {
        const thumbWidth = 15
        setThumbOffset(-(thumbWidth / 100) * percent)
    }

    function updateSlider(e) {
        const audio = d3.select(`#${audioId}`).node()
        if (audio) {
            setSliderPercent(e.target.value)
            updateThumbOffset(e.target.value)
            audio.currentTime = (audio.duration / 100) * e.target.value
        }
    }

    function onLoadedData(e) {
        setDuration(+e.currentTarget.duration.toFixed(0))
    }

    function onTimeUpdate(e) {
        const percent = (e.currentTarget.currentTime / e.currentTarget.duration) * 100
        setSliderPercent(percent)
        setCurrentTime(+e.currentTarget.currentTime.toFixed(0))
        updateThumbOffset(percent)
    }

    useEffect(() => {
        const audio = d3.select(`#${audioId}`).node()
        if (audio) {
            d3.select(audio).on('progress', () => {
                if (audio.duration > 0) {
                    for (let i = 0; i < audio.buffered.length; i += 1) {
                        const percent =
                            (audio.buffered.end(audio.buffered.length - 1 - i) / audio.duration) *
                            100
                        setBufferPercent(percent)
                    }
                }
            })
        }
    }, [])

    return (
        <Column className={styles.wrapper}>
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
                <p>{formatTime(currentTime)}</p>
                <p>{formatTime(duration)}</p>
            </Row>
            <audio id={audioId} onLoadedData={onLoadedData} onTimeUpdate={onTimeUpdate}>
                <track kind='captions' />
            </audio>
        </Column>
    )
}

export default AudioTimeSlider
