import Column from '@components/Column'
import * as d3 from 'd3'
import React, { CSSProperties, useEffect, useRef } from 'react'

function AudioVisualiser(props: {
    audioId: string
    audioURL: string
    audioPlaying: boolean
    staticBars: number
    staticColor: string
    dynamicBars: number
    dynamicColor: string
    style?: any
}): JSX.Element {
    const {
        audioId,
        audioURL,
        audioPlaying,
        staticBars,
        staticColor,
        dynamicBars,
        dynamicColor,
        style,
    } = props
    const maxStaticBars = 2000
    const maxDynamicBars = 255 // limited by frequency data
    const spacing = 1.5
    const staticAudioContext = useRef<AudioContext | null>(null)
    const dynamicAudioContext = useRef<AudioContext | null>(null)
    const audioSource = useRef<MediaElementAudioSourceNode | null>(null)
    const wrapperStyle = { width: '100%', height: '100%', position: 'absolute' } as CSSProperties

    function findStaticBarData(audioBuffer) {
        const rawData = audioBuffer.getChannelData(0)
        const totalBlocks = Math.min(staticBars, maxStaticBars)
        const blockSize = Math.floor(rawData.length / totalBlocks)
        // add up the values in each block and divide by blockSize to find the average
        const barValues = [] as number[]
        for (let i = 0; i < totalBlocks; i += 1) {
            const blockStart = blockSize * i
            let sum = 0
            for (let v = 0; v < blockSize; v += 1) sum += Math.abs(rawData[blockStart + v])
            barValues.push(sum / blockSize)
        }
        // normalise data so max value = 1
        const multiplier = Math.max(...barValues) ** -1
        return barValues.map((n) => n * multiplier)
    }

    function createStaticWaveform() {
        fetch(audioURL).then(async (response) => {
            staticAudioContext.current = new AudioContext()
            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await staticAudioContext.current.decodeAudioData(arrayBuffer)
            const barData = findStaticBarData(audioBuffer)
            // remove old svg if present
            const oldSVG = d3.select(`#${audioId}-static`).select('svg')
            if (oldSVG.node()) oldSVG.remove()
            // create new svg
            const visualiser = d3.select(`#${audioId}-visualiser`)
            const { height, width } = visualiser.node().getBoundingClientRect()
            const staticVisualiser = d3
                .select(`#${audioId}-static`)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
            // draw bars
            const barWidth = width / (barData.length * spacing)
            for (let i = 0; i < barData.length; i += 1) {
                const barHeight = barData[i] * height
                const x = barWidth * i * spacing
                const y = height / 2 - barHeight / 2
                staticVisualiser
                    .append('rect')
                    .attr('id', `bar-${i}`)
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', barWidth)
                    .attr('height', barHeight)
                    .attr('fill', staticColor)
                // .attr('rx', 2) // border radius
            }
        })
    }

    function renderDynamicWaveform() {
        const audio = d3.select(`#${audioId}`)
        const { height, width } = d3.select(`#${audioId}-visualiser`).node().getBoundingClientRect()
        const totalBars = Math.min(dynamicBars, maxDynamicBars)
        dynamicAudioContext.current = dynamicAudioContext.current || new AudioContext()
        audioSource.current =
            audioSource.current ||
            dynamicAudioContext.current.createMediaElementSource(audio.node())
        const analyser = dynamicAudioContext.current.createAnalyser()
        audioSource.current.connect(analyser)
        audioSource.current.connect(dynamicAudioContext.current.destination)
        const frequencyData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(frequencyData)
        // remove old svg if present
        const oldSVG = d3.select(`#${audioId}-dynamic`).select('svg')
        if (oldSVG.node()) oldSVG.remove()
        // create new svg
        const svg = d3
            .select(`#${audioId}-dynamic`)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
        // create bars
        for (let i = 0; i < totalBars; i += 1) {
            svg.append('rect')
                .attr('id', `bar-${i}`)
                .attr('x', (width / totalBars) * i)
                .attr('y', height / 2)
                .attr('width', width / totalBars)
                .attr('fill', dynamicColor)
                .style('opacity', 1)
        }
        // update bars on each animation frame
        const renderVisualizer = () => {
            analyser.getByteFrequencyData(frequencyData)
            for (let i = 0; i < totalBars; i += 1) {
                const barIndex = Math.floor((255 / totalBars) * i)
                const barHeight = (height / 255) * frequencyData[barIndex] // 0 to 255
                svg.select(`#bar-${i}`)
                    .attr('height', barHeight)
                    .attr('y', height / 2 - barHeight / 2)
            }
            window.requestAnimationFrame(renderVisualizer)
        }
        renderVisualizer()
    }

    useEffect(() => createStaticWaveform(), [])

    useEffect(() => {
        if (audioPlaying) renderDynamicWaveform()
    }, [audioPlaying])

    return (
        <Column id={`${audioId}-visualiser`} style={{ position: 'relative', ...style }}>
            <div id={`${audioId}-dynamic`} style={wrapperStyle} />
            <div id={`${audioId}-static`} style={wrapperStyle} />
        </Column>
    )
}

AudioVisualiser.defaultProps = {
    style: null,
}

export default AudioVisualiser
