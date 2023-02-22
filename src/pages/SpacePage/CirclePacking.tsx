/* eslint-disable react/no-this-in-sfc */
import { SpaceContext } from '@contexts/SpaceContext'
import circlePackingData from '@src/CirclePackingData'
import styles from '@styles/pages/SpacePage/CirclePacking.module.scss'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef } from 'react'

const CirclePacking = (props: { spaceMapData: any; params: any }): JSX.Element => {
    const { spaceMapData, params } = props
    const { spaceData, setSpaceMapData, getSpaceMapChildren } = useContext(SpaceContext)

    const focus = useRef<any>(null)
    const width = 700
    const height = 700

    const zoom = d3
        .zoom()
        .on('zoom', () => d3.select('#circle-group').attr('transform', d3.event.transform))

    const color = d3
        .scaleLinear()
        .domain([0, 5])
        .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
        .interpolate(d3.interpolateHcl)

    function pack(data) {
        return d3.pack().size([width, height]).padding(3)(
            d3
                .hierarchy(data)
                .sum((d) => d.value)
                .sort((a, b) => b.value - a.value)
        )
    }

    function buildCanvas() {
        const root = pack(circlePackingData) as any
        focus.current = root

        const svg = d3
            .select('#canvas')
            .append('svg')
            .attr('id', 'circle-packing-svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `-${width / 2} -${height / 2} ${width} ${height}`)
            .style('display', 'block')
            .style('margin', '0 -14px')
            .style('background', color(0))
            .style('cursor', 'pointer')
            .on('click', () => svg.call(zoom))

        svg.append('g')
            .attr('id', 'circle-group')
            .attr('transform', (d) => `translate(${-width / 2},${-height / 2})`)
            .selectAll('circle')
            .data(root.descendants().slice(1))
            .join('circle')
            .attr('r', (d) => d.r)
            .attr('transform', (d) => `translate(${d.x},${d.y})`)
            .attr('fill', (d) => (d.children ? color(d.depth) : 'white'))
            .attr('pointer-events', (d) => (!d.children ? 'none' : null))
            .on('mouseover', function (this: any) {
                d3.select(this).attr('stroke', '#000')
            })
            .on('mouseout', function (this: any) {
                d3.select(this).attr('stroke', null)
            })
            .on('click', (d) => {
                svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, 50))
            })
    }

    useEffect(() => {
        buildCanvas()
    }, [])

    return <div id='canvas' className={styles.canvas} />
}

export default CirclePacking
