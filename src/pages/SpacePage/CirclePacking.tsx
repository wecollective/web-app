/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-this-in-sfc */
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/pages/SpacePage/CirclePacking.module.scss'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'

const CirclePacking = (props: { spaceMapData: any; params: any }): JSX.Element => {
    const { spaceMapData, params } = props
    const { spaceData, setSpaceMapData, getSpaceMapChildren } = useContext(SpaceContext)
    const [clickedSpaceUUID, setClickedSpaceUUID] = useState('')
    const history = useHistory()
    const { sortBy, sortOrder } = params
    const transitionDuration = 1000
    const circleRadius = useRef(0)
    const transitioning = useRef(false)
    const parentNodes = useRef<any>(null)
    const childNodes = useRef<any>(null)

    const zoom = d3.zoom().on('zoom', () => {
        d3.select('#master-group').attr('transform', d3.event.transform)
        // scale circle and text attributes
        const scale = d3.event.transform.k
        d3.selectAll('.circle,.circle-image').attr('stroke-width', 1 / scale)
        d3.selectAll('.text')
            .attr('font-size', 16 / scale)
            .attr('y', (d) => d.y - d.r - 15 / scale)
            .attr('opacity', (d) => {
                if (scale > 7) return 1
                return d.r > 30 / scale ? 1 : 0
            })
    })

    const colorScale = d3
        .scaleLinear()
        .domain([0, 5])
        .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
        .interpolate(d3.interpolateHcl)

    function resetPosition(duration) {
        const svg = d3.select('#circle-packing-svg')
        const svgWidth = parseInt(svg.style('width'), 10)
        const svgHeight = parseInt(svg.style('height'), 10)
        const x = svgWidth / 2 - circleRadius.current
        const y = svgHeight / 2 - circleRadius.current
        const hasParents =
            spaceMapData.DirectParentSpaces && spaceMapData.DirectParentSpaces.length > 0
        const yOffset = hasParents ? 50 : 0
        svg.on('click', () => resetPosition(transitionDuration))
            .transition()
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity.translate(x, y + yOffset))
            .on('end', () => {
                transitioning.current = false
            })
    }

    function buildCanvas() {
        const svg = d3
            .select('#canvas')
            .append('svg')
            .attr('id', 'circle-packing-svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('display', 'block')
            .on('click', () => resetPosition(transitionDuration))
        // create defs
        svg.append('defs').attr('id', 'imgdefs')
        // set circle radius based on screen height
        circleRadius.current = parseInt(svg.style('height'), 10) / 2 - 80
        // create groups
        const masterGroup = svg.append('g').attr('id', 'master-group')
        masterGroup
            .append('g')
            .attr('id', 'parent-circle-group')
            .attr('transform', `translate(${circleRadius.current},-200)`)
        masterGroup.append('g').attr('id', 'circle-group')
        // .attr('transform', `translate(0,${yOffset})`)
        svg.call(zoom)
    }

    function findFill(d, radius) {
        // check if image already exists in defs
        const existingImage = d3.select(`#image-${d.data.uuid}`)
        const circle = d3.select(`#circle-image-${d.data.uuid}`)
        if (existingImage.node()) {
            // check image size matches circle start size
            const matchingSizes = existingImage.attr('height') / 2 === +circle.attr('r')
            // only include duration if circle present and matching sizes
            existingImage
                .transition()
                .duration(circle.node() && matchingSizes ? transitionDuration : 0)
                .attr('height', radius * 2)
                .attr('width', radius * 2)
        } else {
            // create new pattern
            const pattern = d3
                .select('#imgdefs')
                .append('pattern')
                .attr('id', `pattern-${d.data.uuid}`)
                .attr('height', 1)
                .attr('width', 1)
            // append new image to pattern
            pattern
                .append('image')
                .attr('id', `image-${d.data.uuid}`)
                .attr('height', radius * 2)
                .attr('width', radius * 2)
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .attr('xlink:href', () => {
                    const defaultImage = `${config.publicAssets}/icons/default-space-flag.jpg`
                    return d.data.flagImagePath || defaultImage
                    // const expanderIcon = `${config.publicAssets}/icons/plus-icon.jpg`
                    // const defaultImage = `${config.publicAssets}/icons/default-space-flag.jpg`
                    // return d.data.expander ? expanderIcon : d.data.flagImagePath || defaultImage
                })
                .on('error', () => {
                    // try image proxy
                    const newImage = d3.select(`#image-${d.data.uuid}`)
                    const proxyURL = '//images.weserv.nl/'
                    if (!newImage.attr('xlink:href').includes(proxyURL)) {
                        newImage.attr('xlink:href', `${proxyURL}?url=${d.data.flagImagePath}`)
                    } else {
                        // fall back on placeholder
                        const placeholderURL = 'images/placeholders/broken-image.jpg'
                        newImage.attr('xlink:href', `${config.publicAssets}/${placeholderURL}`)
                    }
                })
        }
        return `url(#pattern-${d.data.uuid})`
    }

    function circleMouseOver(d) {
        d3.event.stopPropagation()
        if (!transitioning.current) {
            const circle = d3.select(`#circle-${d.data.uuid}`)
            const image = d3.select(`#circle-image-${d.data.uuid}`)
            const zoomScale = d3.zoomTransform(d3.select('#master-group').node()).k
            circle
                .transition()
                .duration(transitionDuration / 3)
                .attr('stroke-width', 5 / zoomScale)
                .attr('stroke', 'white')
            image
                .transition()
                .duration(transitionDuration / 3)
                .attr('stroke-width', 5 / zoomScale)
                .attr('stroke', 'white')
                .attr('opacity', 1)
        }
    }

    function circleMouseOut(d) {
        d3.event.stopPropagation()
        if (!transitioning.current) {
            const circle = d3.select(`#circle-${d.data.uuid}`)
            const image = d3.select(`#circle-image-${d.data.uuid}`)
            const zoomScale = d3.zoomTransform(d3.select('#master-group').node()).k
            circle
                .transition()
                .duration(transitionDuration / 3)
                .attr('stroke-width', 1 / zoomScale)
                .attr('stroke', colors.cpGrey)
            image
                .transition()
                .duration(transitionDuration / 2)
                .attr('stroke-width', 1 / zoomScale)
                .attr('stroke', colors.cpGrey)
                .attr('opacity', 0)
        }
    }

    function circleMouseDown(circle) {
        d3.event.stopPropagation()
        transitioning.current = true
        // if main circle, reset position
        if (circle.data.id === childNodes.current[0].data.id) resetPosition(transitionDuration)
        // else, navigate to new space
        else {
            setClickedSpaceUUID(circle.data.uuid)
            history.push(`/s/${circle.data.handle}/spaces`)
        }
    }

    function createParentCircles() {
        d3.select('#parent-circle-group')
            .selectAll('.parent-circle')
            .data(parentNodes.current)
            .join('circle')
            .attr('id', (d) => `circle-image-${d.data.uuid}`)
            .classed('parent-circle', true)
            .attr('r', 25)
            .attr('stroke', colors.cpGrey)
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .attr('transform', (d) => `translate(${d.x},${d.y})`)
            .attr('fill', (d) => findFill(d, 25))
            .on('mousedown', (d) => circleMouseDown(d))
            .transition()
            .duration(transitionDuration)
            .attr('opacity', 1)
    }

    function createParentCircleText() {
        d3.select('#parent-circle-group')
            .selectAll('.parent-text')
            .data(parentNodes.current)
            .join('text')
            .classed('parent-text', true)
            .text((d) => d.data.name)
            .attr('font-size', 16)
            .attr('pointer-events', 'none')
            .attr('opacity', 1)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('y', (d) => d.y - 40)
            .attr('x', (d) => d.x)
    }

    function createCircles() {
        d3.select('#circle-group')
            .selectAll('.circle-group')
            .data(childNodes.current, (d) => d.data.uuid)
            .join(
                (enter) => {
                    const group = enter
                        .append('g')
                        .attr('id', (d) => `circle-group-${d.data.uuid}`)
                        .classed('circle-group', true)
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)
                    // add circle
                    group
                        .append('circle')
                        .attr('id', (d) => `circle-${d.data.uuid}`)
                        .classed('circle', true)
                        .attr('r', (d) => d.r)
                        .attr('stroke', colors.cpGrey)
                        .attr('stroke-width', 1)
                        .attr('opacity', 0)
                        .attr('cursor', 'pointer')
                        .attr('fill', (d) => colorScale(d.depth + 1))
                        .on('mouseover', (d) => circleMouseOver(d))
                        .on('mouseout', (d) => circleMouseOut(d))
                        .on('click', (d) => circleMouseDown(d))
                        .call((circle) =>
                            circle.transition().duration(transitionDuration).attr('opacity', 1)
                        )
                    // add image
                    group
                        .append('circle')
                        .attr('id', (d) => `circle-image-${d.data.uuid}`)
                        .classed('circle-image', true)
                        .attr('r', (d) => d.r)
                        .attr('stroke', colors.cpGrey)
                        .attr('stroke-width', 1)
                        .attr('pointer-events', 'none')
                        .attr('opacity', 0)
                        .attr('fill', (d) => findFill(d, d.r))

                    return group
                },
                (update) => {
                    update
                        .transition()
                        .duration(transitionDuration)
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)

                    update
                        .select('.circle')
                        .on('mouseover', (d) => circleMouseOver(d))
                        .on('mouseout', (d) => circleMouseOut(d))
                        .on('click', (d) => circleMouseDown(d))
                        .transition()
                        .duration(transitionDuration)
                        .attr('r', (d) => d.r)
                        .attr('fill', (d) => colorScale(d.depth + 1))

                    update
                        .select('.circle-image')
                        .transition()
                        .duration(transitionDuration)
                        .attr('r', (d) => d.r)
                        .attr('fill', (d) => findFill(d, d.r))

                    return update
                },
                (exit) => {
                    exit.transition()
                        .duration(transitionDuration / 2)
                        .remove()
                    exit.select('.circle')
                        .transition()
                        .duration(transitionDuration / 2)
                        .attr('opacity', 0)
                    return exit
                }
            )
    }

    function createCircleText() {
        d3.select('#circle-group')
            .selectAll('.text')
            .data(childNodes.current, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .append('text')
                        .classed('text', true)
                        .text((d) => d.data.name)
                        .attr('font-size', 16)
                        .attr('font-weight', (d) => (d.data.id === spaceMapData.id ? 800 : 400))
                        .attr('pointer-events', 'none')
                        .attr('opacity', 0)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('y', (d) => d.y - d.r - 15)
                        .attr('x', (d) => d.x)
                        .call((node) =>
                            node
                                .transition()
                                .duration(transitionDuration)
                                .attr('opacity', (d) => (d.r > 30 && d.depth < 2 ? 1 : 0))
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .transition()
                            .duration(transitionDuration)
                            .attr('font-weight', (d) => (d.data.id === spaceMapData.id ? 800 : 400))
                            .attr('y', (d) => d.y - d.r - 15)
                            .attr('x', (d) => d.x)
                            .attr('opacity', (d) => (d.r > 30 && d.depth < 2 ? 1 : 0))
                    ),
                (exit) =>
                    exit.call((node) =>
                        node
                            .transition()
                            .duration(transitionDuration / 2)
                            .attr('opacity', 0)
                            .remove()
                    )
            )
    }

    function findSpaceById(tree: any, id: number) {
        // recursive function, traverses the node tree to find a space using its space id
        if (tree.data.id === id) return tree
        if (tree.children) {
            for (let i = 0; i < tree.children.length; i += 1) {
                const match = findSpaceById(tree.children[i], id)
                if (match) return match
            }
        }
        return null
    }

    function recursivelyAddUUIDS(oldSpace, newSpace) {
        newSpace.data.uuid = oldSpace.data.uuid
        if (newSpace.children && oldSpace.children) {
            newSpace.children.forEach((child) => {
                const match = oldSpace.children.find((c) => c.data.id === child.data.id)
                if (match) recursivelyAddUUIDS(match, child)
            })
        }
    }

    function buildNodeTree() {
        // build parent nodes
        const parents = d3.hierarchy(spaceMapData, (d) => d.DirectParentSpaces)
        const newParentNodes = d3
            .tree()
            .nodeSize([50, 130])
            .separation(() => 3)(parents)
            .descendants()
            .slice(1)
        // build child nodes
        const hierarchy = d3
            .hierarchy(spaceMapData)
            .sum((d) => d.totalLikes || 1)
            .sort((a, b) => b.totalLikes - a.totalLikes)
        const newChildNodes = d3
            .pack()
            .size([circleRadius.current * 2, circleRadius.current * 2])
            .padding(30)(hierarchy)
            .descendants()
        // update UUIDs for transitions
        const oldSpace = childNodes.current && childNodes.current[0]
        if (oldSpace) {
            const newSpace = newChildNodes[0]
            if (oldSpace.data.id === newSpace.data.id) {
                recursivelyAddUUIDS(oldSpace, newSpace)
            } else {
                // if navigation from click, use uuid to ensure the correct space is chosen, otherwise just the space id
                const id = clickedSpaceUUID || newSpace.data.id
                const idType = clickedSpaceUUID ? 'uuid' : 'id'
                const oldChild = childNodes.current.find((s) => s.data[idType] === id)
                if (oldChild) recursivelyAddUUIDS(oldChild, newSpace)
                else {
                    // if new space neither old parent or child, search for matching spaces by id
                    const matchingChild = findSpaceById(newSpace, oldSpace.data.id)
                    if (matchingChild) recursivelyAddUUIDS(oldSpace, matchingChild)
                }
            }
        }
        setClickedSpaceUUID('')
        parentNodes.current = newParentNodes
        childNodes.current = newChildNodes
    }

    function buildTree() {
        resetPosition(childNodes.current ? transitionDuration : 0)
        buildNodeTree()
        createParentCircles()
        createParentCircleText()
        createCircles()
        createCircleText()
        // mark transition complete after duration
        setTimeout(() => {
            transitioning.current = false
        }, transitionDuration)
    }

    useEffect(() => buildCanvas(), [])

    useEffect(() => {
        if (spaceMapData.id) buildTree()
    }, [spaceMapData])

    return <div id='canvas' className={styles.canvas} />
}

export default CirclePacking

// function hasMatchingAncestor(circle, selectedCircle) {
//     // recursively check parents for selectedCircle
//     if (!circle.parent) return false
//     if (circle.parent.data.id === selectedCircle.data.id) return true
//     return hasMatchingAncestor(circle.parent, selectedCircle)
// }

// // zoom to new circle
// const svg = d3.select('#circle-packing-svg')
// const svgWidth = parseInt(svg.style('width'), 10)
// const svgHeight = parseInt(svg.style('height'), 10)
// const scale = (circleRadius.current * 2) / (circle.r * 2)
// const x = svgWidth / 2 / scale - circle.x
// const y = svgHeight / 2 / scale - circle.y + 50
// // transition circle stroke width
// d3.selectAll('.circle')
//     .transition('circle-transition')
//     .duration(transitionDuration)
//     .attr('stroke-width', 1 / scale)
// // transition font size
// d3.selectAll('.text')
//     .transition('text-transition')
//     .duration(transitionDuration)
//     .attr('font-size', 16 / scale)
//     .attr('y', (da) => da.y - da.r - 15 / scale)
// // fade out all external nodes
// d3.selectAll('.circle,.text')
//     .filter((d) => {
//         if (d.depth <= circle.depth && d.data.id !== circle.data.id) return true
//         return d.data.id !== circle.data.id && !hasMatchingAncestor(d, circle)
//     })
//     .transition('fade-transition')
//     .duration(transitionDuration)
//     .attr('opacity', 0.25)
// // // zoom master group
// svg.transition()
//     .duration(transitionDuration)
//     .call(zoom.transform, d3.zoomIdentity.scale(scale).translate(x, y))
//     .on('end', () => {
//         // buildTree(spaceMapData)
//         // transitioning.current = false
//     })
