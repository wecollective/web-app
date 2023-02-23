/* eslint-disable react/no-this-in-sfc */
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/CirclePacking.module.scss'
import * as d3 from 'd3'
import React, { useContext, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

const CirclePacking = (props: { spaceMapData: any; params: any }): JSX.Element => {
    const { spaceMapData, params } = props
    const { spaceData, setSpaceMapData, getSpaceMapChildren } = useContext(SpaceContext)
    const history = useHistory()
    const { sortBy, sortOrder } = params
    const mainCircleCize = 700
    const duration = 500

    const zoom = d3
        .zoom()
        .on('zoom', () => d3.select('#master-group').attr('transform', d3.event.transform))

    const color = d3
        .scaleLinear()
        .domain([0, 5])
        .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
        .interpolate(d3.interpolateHcl)

    function resetPosition(dur) {
        const svg = d3.select('#circle-packing-svg')
        const svgWidth = parseInt(svg.style('width'), 10)
        const svgHeight = parseInt(svg.style('height'), 10)
        const x = svgWidth / 2 - mainCircleCize / 2
        const y = svgHeight / 2 - mainCircleCize / 2
        svg.transition().duration(dur).call(zoom.transform, d3.zoomIdentity.translate(x, y))
    }

    function buildCanvas() {
        const svg = d3
            .select('#canvas')
            .append('svg')
            .attr('id', 'circle-packing-svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('display', 'block')
            .style('background', color(0))
        // .on('click', () => resetPosition(500))

        const masterGroup = svg.append('g').attr('id', 'master-group')
        masterGroup.append('g').attr('id', 'circle-group')

        svg.call(zoom)
        resetPosition(0)
    }

    function zoomToCircle(d) {
        const svg = d3.select('#circle-packing-svg')
        const svgWidth = parseInt(svg.style('width'), 10)
        const svgHeight = parseInt(svg.style('height'), 10)
        const scale = mainCircleCize / (d.r * 2)
        const x = svgWidth / 2 / scale - d.x
        const y = svgHeight / 2 / scale - d.y
        svg.transition()
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity.scale(scale).translate(x, y))
    }

    function buildTree() {
        const hierarchy = d3
            .hierarchy(spaceMapData)
            .sum((d) => d.totalLikes || 1)
            .sort((a, b) => b.totalLikes - a.totalLikes)
        const root = d3.pack().size([mainCircleCize, mainCircleCize]).padding(10)(hierarchy)

        d3.select('#circle-group')
            .selectAll('.circle')
            .data(root.descendants(), (d) => d.data.id)
            .join(
                (enter) =>
                    enter
                        .append('circle')
                        .classed('circle', true)
                        .attr('r', (d) => d.r)
                        .attr('stroke', '#000')
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        .attr('fill', (d) => color(d.depth + 1))
                        .on('click', (d) => {
                            zoomToCircle(d)
                            // history.push(`/s/${d.data.handle}/spaces`)
                        })
                        .call((node) => node.transition().duration(duration).attr('opacity', 1)),
                (update) =>
                    update.call((node) =>
                        node
                            .transition()
                            .duration(duration)
                            .attr('r', (d) => d.r)
                            .attr('fill', (d) => color(d.depth + 1))
                            .attr('transform', (d) => `translate(${d.x},${d.y})`)
                    ),
                (exit) =>
                    exit.call((node) =>
                        node
                            .transition()
                            .duration(duration / 2)
                            .attr('opacity', 0)
                            .remove()
                    )
            )

        d3.select('#circle-group')
            .selectAll('.text')
            .data(root.descendants())
            .join('text')
            .classed('text', true)
            .text((d) => d.data.name)
            .attr('font-size', 16)
            .attr('opacity', 1)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('y', (d) => d.y - d.r - 15)
            .attr('x', (d) => d.x)
            .on('click', (d) => console.log('d: ', d))
    }

    useEffect(() => buildCanvas(), [])

    useEffect(() => {
        if (spaceMapData.id) buildTree()
    }, [spaceMapData])

    return <div id='canvas' className={styles.canvas} />
}

export default CirclePacking
