import React, { useEffect } from 'react'
import * as d3 from 'd3'

const AudioVisualiser = (props: {
    audioId: string
    // type: 'bars' | 'centered-bars' | 'ring'
    color: string
    style?: any
}): JSX.Element => {
    const { audioId, color, style } = props
    const numberOfBars = 80

    useEffect(() => {
        const audio = d3.select(`#${audioId}`).node()
        if (audio) {
            const { height, width } = d3
                .select(`#${audioId}-visualiser`)
                .node()
                .getBoundingClientRect()

            const ctx = new AudioContext()
            const audioSource = ctx.createMediaElementSource(audio)
            const analyser = ctx.createAnalyser()

            audioSource.connect(analyser)
            audioSource.connect(ctx.destination)

            const frequencyData = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(frequencyData)

            const svg = d3
                .select(`#${audioId}-visualiser`)
                .append('svg')
                .attr('id', 'audio-visualiser-svg')
                .attr('width', '100%')
                .attr('height', '100%')

            for (let i = 0; i < numberOfBars; i += 1) {
                svg.append('rect')
                    .attr('id', `bar-${i}`)
                    .attr('x', (width / numberOfBars) * i)
                    .attr('y', height / 2)
                    .attr('width', width / numberOfBars)
                    .attr('fill', color)
            }

            const renderVisualizer = () => {
                analyser.getByteFrequencyData(frequencyData) // 0 to 255
                for (let i = 0; i < numberOfBars; i += 1) {
                    const barIndex = Math.floor((255 / numberOfBars) * i)
                    const newHeight = (height / 255) * frequencyData[barIndex]
                    svg.select(`#bar-${i}`)
                        .attr('height', newHeight)
                        .attr('y', height / 2 - newHeight / 2)
                }
                window.requestAnimationFrame(renderVisualizer)
            }

            renderVisualizer()
        }
    }, [])

    return <div id={`${audioId}-visualiser`} style={style} />
}

AudioVisualiser.defaultProps = {
    style: null,
}

export default AudioVisualiser
