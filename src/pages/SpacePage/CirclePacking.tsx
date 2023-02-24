/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-this-in-sfc */
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/CirclePacking.module.scss'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'

const CirclePacking = (props: { spaceMapData: any; params: any }): JSX.Element => {
    const { spaceMapData, params } = props
    const { spaceData, setSpaceMapData, getSpaceMapChildren } = useContext(SpaceContext)
    const history = useHistory()
    const { sortBy, sortOrder } = params
    const mainCircleCize = 700
    const duration = 1000
    const transitioning = useRef(false)

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
        // .on('click', () => resetPosition(500))

        const masterGroup = svg.append('g').attr('id', 'master-group')
        masterGroup.append('g').attr('id', 'circle-group')

        svg.call(zoom)
    }

    function hasMatchingAncestor(circle, selectedCircle) {
        // recursively check parents for selectedCircle
        if (!circle.parent) return false
        if (circle.parent.data.id === selectedCircle.data.id) return true
        return hasMatchingAncestor(circle.parent, selectedCircle)
    }

    function zoomToCircle(circle) {
        transitioning.current = true
        // navigate to new space
        history.push(`/s/${circle.data.handle}/spaces`)
        // transition to new circle
        const svg = d3.select('#circle-packing-svg')
        const svgWidth = parseInt(svg.style('width'), 10)
        const svgHeight = parseInt(svg.style('height'), 10)
        const scale = mainCircleCize / (circle.r * 2)
        const x = svgWidth / 2 / scale - circle.x
        const y = svgHeight / 2 / scale - circle.y
        // transition circle stroke width
        d3.selectAll('.circle')
            .transition('circle-transition')
            .duration(duration)
            .attr('stroke-width', 1 / scale)
        // transition font size
        d3.selectAll('.text')
            .transition('text-transition')
            .duration(duration)
            .attr('font-size', 16 / scale)
            .attr('y', (da) => da.y - da.r - 15 / scale)
        // fade out all external nodes
        d3.selectAll('.circle,.text')
            .filter((d) => {
                if (d.depth <= circle.depth && d.data.id !== circle.data.id) return true
                return d.data.id !== circle.data.id && !hasMatchingAncestor(d, circle)
            })
            .transition('fade-transition')
            .duration(duration)
            .attr('opacity', 0)
        // zoom to new circle
        svg.transition()
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity.scale(scale).translate(x, y))
            .on('end', () => {
                // if (transitioning.current) {
                //     buildTree(spaceMapData)
                //     transitioning.current = false
                // }
            })
    }

    function buildTree(data) {
        resetPosition(0)
        const hierarchy = d3
            .hierarchy(data)
            .sum((d) => d.totalLikes || 1)
            .sort((a, b) => b.totalLikes - a.totalLikes)
        const root = d3.pack().size([mainCircleCize, mainCircleCize]).padding(30)(hierarchy)

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
                        .attr('stroke-width', 1)
                        .attr('cursor', 'pointer')
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        .attr('fill', (d) => color(d.depth + 1))
                        .on('click', (d) => zoomToCircle(d))
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
            .data(root.descendants(), (d) => d.data.id)
            .join('text')
            // .filter((d) => {
            //     return d.depth < 2 // && d.children && d.data.totalLikes > 15
            // })
            .classed('text', true)
            .text((d) => d.data.name)
            .attr('font-size', 16)
            .attr('pointer-events', 'none')
            .attr('opacity', 1)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('y', (d) => d.y - d.r - 15)
            .attr('x', (d) => d.x)
    }

    useEffect(() => buildCanvas(), [])

    useEffect(() => {
        if (spaceMapData.id) buildTree(spaceMapData)
    }, [spaceMapData])

    return <div id='canvas' className={styles.canvas} />
}

export default CirclePacking
