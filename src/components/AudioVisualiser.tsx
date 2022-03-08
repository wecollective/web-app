import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const AudioVisualiser = (props: {
    audioId: string
    // type: 'bars' | 'centered-bars' | 'ring'
    numberOfBars: number
    color: string
    style?: any
}): JSX.Element => {
    const { audioId, numberOfBars, color, style } = props
    const barCount = Math.min(numberOfBars, 255)
    const ctx = useRef<AudioContext | null>(null)
    const audioSource = useRef<MediaElementAudioSourceNode | null>(null)

    useEffect(() => {
        const audio = d3.select(`#${audioId}`)
        if (audio.node()) {
            audio.on('play.visualiser', () => {
                const { height, width } = d3
                    .select(`#${audioId}-visualiser`)
                    .node()
                    .getBoundingClientRect()

                ctx.current = ctx.current || new AudioContext()
                audioSource.current =
                    audioSource.current || ctx.current.createMediaElementSource(audio.node())
                const analyser = ctx.current.createAnalyser()

                audioSource.current.connect(analyser)
                audioSource.current.connect(ctx.current.destination)

                const frequencyData = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(frequencyData)

                const oldSVG = d3.select(`#${audioId}-visualiser`).select('svg')
                if (oldSVG.node()) oldSVG.remove()

                const svg = d3
                    .select(`#${audioId}-visualiser`)
                    .append('svg')
                    .attr('id', 'audio-visualiser-svg')
                    .attr('width', '100%')
                    .attr('height', '100%')

                for (let i = 0; i < barCount; i += 1) {
                    svg.append('rect')
                        .attr('id', `bar-${i}`)
                        .attr('x', (width / barCount) * i)
                        .attr('y', height / 2)
                        .attr('width', width / barCount)
                        .attr('fill', color)
                }

                const renderVisualizer = () => {
                    analyser.getByteFrequencyData(frequencyData) // 0 to 255
                    for (let i = 0; i < barCount; i += 1) {
                        const barIndex = Math.floor((255 / barCount) * i)
                        const newHeight = (height / 255) * frequencyData[barIndex]
                        svg.select(`#bar-${i}`)
                            .attr('height', newHeight)
                            .attr('y', height / 2 - newHeight / 2)
                    }
                    window.requestAnimationFrame(renderVisualizer)
                }
                renderVisualizer()
            })
        }
    }, [])

    return <div id={`${audioId}-visualiser`} style={style} />
}

AudioVisualiser.defaultProps = {
    style: null,
}

export default AudioVisualiser
