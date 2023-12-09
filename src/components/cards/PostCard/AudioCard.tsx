import AudioVisualiser from '@components/AudioVisualiser'
import Column from '@components/Column'
import Row from '@components/Row'
import { formatTimeMMSS } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/cards/PostCard/AudioCard.module.scss'
import { PauseIcon, PlayIcon } from '@svgs/all'
import * as d3 from 'd3'
import getBlobDuration from 'get-blob-duration'
import React, { useEffect, useState } from 'react'

// todo: pass in height as a prop?
function AudioCard(props: {
    id?: number
    index?: number
    url: string
    staticBars: number
    location: string
    style?: any
    remove?: () => void
}): JSX.Element {
    const { id, index, url, staticBars, location, style, remove } = props
    const [audioPlaying, setAudioPlaying] = useState(false)
    // const [audioLoaded, setAudioLoaded] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [sliderPercent, setSliderPercent] = useState(0)
    const [bufferPercent, setBufferPercent] = useState(0)
    const [thumbOffset, setThumbOffset] = useState(0)
    const audioElementId = `post-audio-${location}-${id}-${index}`

    function toggleAudio() {
        // console.log('toggleAudio')
        const audio = d3.select(`#${audioElementId}`).node()
        if (audio) {
            // // load audio if not loaded
            // if (!audioLoaded) {
            //     console.log('add src and load audio')
            //     // const source = d3.select(`#${audioElementId}-source`).node()
            //     // source.src = url
            //     audio.load()
            //     // d3.select(audio).on('load')
            //     setAudioLoaded(true)
            // }
            if (audio.paused) {
                // pause all playing audio
                d3.selectAll('audio')
                    .nodes()
                    .forEach((node) => node.pause())
                // play audio
                audio.play()
                setAudioPlaying(true)
            } else {
                audio.pause()
                setAudioPlaying(false)
            }
        }
    }

    function updateThumbOffset(percent) {
        const thumbWidth = 15
        setThumbOffset(-(thumbWidth / 100) * percent)
    }

    function updateSlider(e) {
        const audio = d3.select(`#${audioElementId}`).node()
        if (audio) {
            setSliderPercent(e.target.value)
            updateThumbOffset(e.target.value)
            audio.currentTime = (duration / 100) * e.target.value
        }
    }

    async function onLoadedData(e) {
        if (e.currentTarget.duration === Infinity) setDuration(await getBlobDuration(url))
        else setDuration(e.currentTarget.duration)
    }

    function onTimeUpdate(e) {
        const percent = (e.currentTarget.currentTime / duration) * 100
        setSliderPercent(percent)
        setCurrentTime(e.currentTarget.currentTime)
        updateThumbOffset(percent)
    }

    useEffect(() => {
        // console.log('AudioTimeSlider useffect 2')
        // console.log('navigator.userAgent: ', navigator.userAgent)
        const audio = d3.select(`#${audioElementId}`)
        if (audio.node()) {
            // audio.
            // document.body.addEventListener(`touchstart.${audioElementId}`, () => {
            //     console.log(`touchstart.${audioElementId}`)
            //     // if (!audioLoaded) {
            //     //     console.log('touchstart: audio.load()')
            //     //     setAudioLoaded(true)
            //     //     audio.load()
            //     //     // setAudioLoaded(true)
            //     // }
            // })
            // console.log('audioURL: ', audioURL)
            // // audio.currentTime = 0
            // console.log('audio.canPlayType("audio/mpeg"): ', audio.canPlayType('audio/mpeg'))
            // console.log('audio.canPlayType("audio/ogg"): ', audio.canPlayType('audio/ogg'))
            // console.log('audio.canPlayType("audio/wav"): ', audio.canPlayType('audio/wav'))
            audio
                // .on()
                .on('progress.timeSlider', () => {
                    const { buffered } = audio.node()
                    const dur = audio.node().duration
                    if (dur > 0) {
                        for (let i = 0; i < buffered.length; i += 1) {
                            const percent = (buffered.end(buffered.length - 1 - i) / dur) * 100
                            setBufferPercent(percent)
                        }
                    }
                })
                // .on('play.timeSlider', () => setTimeout(() => setAudioPlaying(true), 200))
                // .on('pause.timeSlider', () => setAudioPlaying(false))
                .on('ended.timeSlider', () => {
                    // console.log('timeSlider ended')
                    setAudioPlaying(false)
                    const nextBead = d3.select(`#post-audio-${location}-${id}-${index! + 1}`).node()
                    // console.log('nextBead: ', nextBead)
                    if (nextBead) nextBead.play()
                })
        }
    }, [])

    return (
        <Column style={{ ...style, position: 'relative' }}>
            {/* {remove && (
                <CloseButton
                    size={20}
                    onClick={remove}
                    style={{ position: 'absolute', top: 0, right: 0, zIndex: 5 }}
                />
            )} */}
            <AudioVisualiser
                audioElementId={audioElementId}
                audioURL={url}
                audioPlaying={audioPlaying}
                staticBars={staticBars}
                staticColor={colors.audioVisualiserStatic}
                dynamicBars={160}
                dynamicColor={colors.audioVisualiserDynamic}
                style={{
                    height: location === 'gbg-room' ? 80 : 'calc(100% - 40px)',
                    marginBottom: 10,
                }}
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
                <Column className={styles.timeSlider}>
                    <Row centerY className={`${styles.slider} ${location === 'gbg' && styles.gbg}`}>
                        <div className={styles.progressBarBackground} />
                        <div
                            className={styles.bufferedAmount}
                            style={{ width: `${bufferPercent}%` }}
                        />
                        <div
                            className={styles.progressBar}
                            style={{ width: `${sliderPercent}%` }}
                        />
                        <div
                            className={styles.thumb}
                            style={{ left: `${sliderPercent}%`, marginLeft: `${thumbOffset}px` }}
                        />
                        <input type='range' onClick={updateSlider} onChange={updateSlider} />
                    </Row>
                    <Row centerY spaceBetween className={styles.times}>
                        <p>{formatTimeMMSS(currentTime)}</p>
                        <p>{formatTimeMMSS(duration)}</p>
                    </Row>
                    <audio
                        id={audioElementId}
                        onLoadedData={onLoadedData}
                        onTimeUpdate={onTimeUpdate}
                        crossOrigin='anonymous'
                        // preload='none'
                    >
                        <source src={url} type='audio/mpeg' />
                        {/* src={url} */}
                        <track kind='captions' />
                    </audio>
                </Column>
                {/* <AudioTimeSlider
                    audioElementId={`post-audio-${location}-${id}-${index}`}
                    audioURL={url}
                    location={location}
                    onPlay={() => setAudioPlaying(true)}
                    onPause={() => setAudioPlaying(false)}
                    onEnded={onEnded}
                /> */}
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
