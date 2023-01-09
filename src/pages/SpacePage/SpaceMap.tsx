/* eslint-disable no-param-reassign */
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import Row from '@components/Row'
import StatButton from '@components/StatButton'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/SpaceMap.module.scss'
import { CommentIcon, PostIcon, ReactionIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'

// todo: big clean up!
// + big clean up! removed unused code + simplify
// + create private space overlay and fade on hover
// + load space data on hover
const SpaceMap = (props: { spaceMapData: any; params: any }): JSX.Element => {
    const { spaceMapData, params } = props
    const { spaceData, setSpaceMapData, getSpaceMapChildren } = useContext(SpaceContext)
    // const [width, setWidth] = useState<number | string>(700)
    const [firstRun, setFirstRun] = useState(true)
    const [highlightedSpace, setHighlightedSpace] = useState<any>(null)
    const [highlightedSpacePosition, setHighlightedSpacePosition] = useState<any>({})
    const spaceTransitioning = useRef<boolean>(false)
    const history = useHistory()
    const circleRadius = 25
    const maxTextLength = 14
    const duration = 1000

    function getHighlightedSpaceData(space) {
        axios.get(`${config.apiURL}/space-map-space-data?spaceId=${space.id}`).then((res) => {
            setHighlightedSpace({ ...space, ...res.data })
        })
    }

    const findParent = (tree: any, itemId: string): any => {
        if (tree.uuid === itemId) return tree
        if (tree.children) {
            for (let i = 0; i < tree.children.length; i += 1) {
                const match = findParent(tree.children[i], itemId)
                if (match) return match
            }
        }
        return null
    }

    function toggleChildren(d) {
        if (d.children) {
            d.hiddenChildren = d.children
            d.children = null
        } else {
            d.children = d.hiddenChildren
            d.hiddenChildren = null
        }
    }

    function findRadius(d) {
        if (d.data.id === spaceData.id) return circleRadius * 2
        return circleRadius
    }

    function isRoot(d) {
        return d.data.id === spaceData.id
    }

    function findFill(d) {
        // todo: update image if privacy changes during log-out/in
        const existingImage = d3.select(`#image-${d.data.id}`)
        if (existingImage.node()) {
            // scale and reposition existing image (if no imageCircle, transition size instantly)
            const existingImageCircle = d3.select(`#image-circle-${d.data.id}`).node()
            existingImage
                .transition()
                .duration(existingImageCircle ? duration : 0)
                .attr('height', findRadius(d) * 2)
                .attr('width', findRadius(d) * 2)
        } else {
            // create new pattern
            const pattern = d3
                .select('#imgdefs')
                .append('pattern')
                .attr('id', `pattern-${d.data.id}`)
                .attr('height', 1)
                .attr('width', 1)
            // append new image to pattern
            pattern
                .append('image')
                .attr('id', `image-${d.data.id}`)
                .attr('height', findRadius(d) * 2)
                .attr('width', findRadius(d) * 2)
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .attr('xlink:href', () => {
                    if (d.data.expander) return `${config.publicAssets}/icons/plus-icon.jpg`
                    if (d.data.privacy === 'private' && d.data.spaceAccess !== 'active')
                        return `${config.publicAssets}/icons/lock-icon.png`
                    return (
                        d.data.flagImagePath ||
                        `${config.publicAssets}/icons/default-space-flag.jpg`
                    )
                })
            // .on('error', () => {
            //     const newImage = d3.select(`#image-${d.id}`)
            //     // try image proxy
            //     if (!newImage.attr('xlink:href').includes('//images.weserv.nl/')) {
            //         newImage.attr('xlink:href', `//images.weserv.nl/?url=${d.urlImage}`)
            //     } else {
            //         // fall back on placeholder
            //         newImage.attr('xlink:href', `${config.publicAssets}/images/placeholders/broken-image-left.jpg')
            //     }
            // })
        }
        return `url(#pattern-${d.data.id})`
    }

    const zoom = d3
        .zoom()
        .on('zoom', () =>
            d3.select('#space-map-master-group').attr('transform', d3.event.transform)
        )

    function resetTreePosition() {
        // console.log('resetTreePosition')
        const svg = d3.select('#space-map-svg')
        const svgWidth = parseInt(svg.style('width'), 10)
        // const svgHeight = parseInt(svg.style('height'), 10)
        const yOffset = spaceData.DirectParentSpaces!.length ? 180 : 80
        // d3.select('#post-map-svg')
        //     .transition()
        //     .duration(2000)
        //     .call(
        //         zoom.transform,
        //         d3.zoomIdentity.scale(scale).translate(svgWidth / scale / 2, height / scale / 2)
        // )
        // // reset tree position
        svg.transition()
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity.scale(1).translate(svgWidth / 2, yOffset))

        // // when transition complete, calculate new scale and adjust zoom to fit tree in canvas
        // setTimeout(() => {
        //     // const svg = d3.select('#space-map-svg')
        //     // const svgWidth = parseInt(svg.style('width'), 10)
        //     // const svgHeight = parseInt(svg.style('height'), 10)
        //     const treeBBox = d3.select('#space-map-master-group').node().getBBox()
        //     // console.log('svg width: ', svgWidth)
        //     // console.log('svg height: ', svgHeight)
        //     // console.log('treeBBox: ', treeBBox)
        //     // if tree width or height greater than svg width or height sclae
        //     // if both tree width and tree height greater than svg pick the one that has more difference
        //     const widthRatio = svgWidth / treeBBox.width
        //     const heightRatio = svgHeight / treeBBox.height
        //     // console.log('widthRatio: ', widthRatio)
        //     // console.log('heightRatio: ', heightRatio)
        //     // console.log('spacedata: ', spaceData)
        //     const yOffset = spaceData.DirectParentSpaces.length ? 180 : 80
        //     // if (widthRatio < 1 || heightRatio < 1) {
        //     if (widthRatio < heightRatio) {
        //         // console.log('scale to width')
        //         const ratioOffset = 0.1 // widthRatio < 1 ? 0.1 : 0.3
        //         const xOffset = svgWidth / 2 / (widthRatio - ratioOffset)
        //         d3.select('#space-map-svg')
        //             .transition()
        //             .duration(duration)
        //             .call(
        //                 zoom.transform,
        //                 d3.zoomIdentity.scale(widthRatio - ratioOffset).translate(xOffset, yOffset)
        //             )
        //     } else {
        //         // console.log('scale to height')
        //         const ratioOffset = 0.1 // heightRatio < 1 ? 0.1 : 0.3
        //         const xOffset = svgWidth / 2 / (heightRatio - ratioOffset)
        //         d3.select('#space-map-svg')
        //             .transition()
        //             .duration(duration)
        //             .call(
        //                 zoom.transform,
        //                 d3.zoomIdentity.scale(heightRatio - ratioOffset).translate(xOffset, yOffset)
        //             )
        //     }
        // }, duration + 500)
    }

    function createCanvas() {
        const width = '100%'
        const height = '100%' // window.innerHeight - (window.innerWidth < 1500 ? 250 : 330)
        const yOffset = spaceData.DirectParentSpaces.length ? 180 : 80
        const svg = d3
            .select('#canvas')
            .append('svg')
            .attr('id', 'space-map-svg')
            .attr('width', width)
            .attr('height', height)
        // .attr('transform', () => {
        //     const newWidth = parseInt(d3.select('#space-map-svg').style('width'), 10)
        //     return `translate(${newWidth / 2},${yOffset})`
        // })

        const newWidth = parseInt(svg.style('width'), 10)

        svg.append('defs').attr('id', 'imgdefs')

        const masterGroup = svg.append('g').attr('id', 'space-map-master-group')

        masterGroup.append('g').attr('id', 'link-group')
        masterGroup
            .append('g')
            .attr('id', 'parent-link-group')
            .attr('transform', `translate(0,0),rotate(180,0,0)`)
        masterGroup
            .append('g')
            .attr('id', 'parent-node-group')
            .attr('transform', `translate(0,0),rotate(180,0,0)`)
        masterGroup.append('g').attr('id', 'node-group')

        svg.call(zoom)
        svg.call(zoom.transform, d3.zoomIdentity.translate(newWidth / 2, yOffset))
    }

    // function updateCanvasSize() {
    //     d3.select('#canvas').style('width', width)
    //     d3.select('#space-map-svg').attr('width', width)

    //     // const offset = spaceData.id
    //     // console.log(spaceData)

    //     // const newWidth = parseInt(d3.select('#space-map-svg').style('width'), 10)
    //     // const transform = `translate(${newWidth / 2},${yOffset})`
    //     // const parentTransform = `translate(${newWidth / 2},${yOffset}),rotate(180,0,0)`
    //     const transform = `translate(0,0)`
    //     const parentTransform = `translate(0,0),rotate(180,0,0)`

    //     d3.select('#link-group').attr('transform', transform)
    //     d3.select('#node-group').attr('transform', transform)
    //     d3.select('#parent-link-group').attr('transform', parentTransform)
    //     d3.select('#parent-node-group').attr('transform', parentTransform)
    // }

    function interruptRunningTransitions(data) {
        d3.selectAll('.background-circle').each((d) => {
            if (!findParent(data, d.data.id)) {
                d3.select(`#background-circle-${d.data.id}`).interrupt('background-circle-enter')
            }
        })
        d3.selectAll('.image-background-circle').each((d) => {
            if (!findParent(data, d.data.id)) {
                d3.select(`#image-background-circle-${d.data.id}`).interrupt(
                    'image-background-circle-enter'
                )
            }
        })
        d3.selectAll('.image-circle').each((d) => {
            if (!findParent(data, d.data.id)) {
                d3.select(`#image-circle-${d.data.id}`).interrupt('image-circle-enter')
            }
        })
        d3.selectAll('.node-text').each((d) => {
            if (!findParent(data, d.data.id)) {
                d3.select(`#node-text-${d.data.id}`).interrupt('node-text-enter')
            }
        })
    }

    function updateTree(data, resetPosition) {
        if (resetPosition) resetTreePosition()

        setTimeout(() => {
            d3.selectAll('.background-circle').classed('transitioning', false)
            spaceTransitioning.current = false
        }, duration + 100)

        // create parent tree
        const parents = d3.hierarchy(data, (d) => {
            return d.DirectParentSpaces
        })
        const parentTree = d3
            .tree()
            .nodeSize([50, 130])
            .separation(() => {
                return 2 // ((a, b) => { return a.parent == b.parent ? 2 : 1 })
            })
        parentTree(parents).links()
        const parentLinks = parents.descendants().slice(1)
        const parentNodes = parents.descendants().slice(1)

        // create main tree
        const root = d3.hierarchy(data, (d) => {
            return d.children
        })
        const tree = d3
            .tree()
            .nodeSize([50, 200])
            .separation(() => {
                return 2 // ((a, b) => { return a.parent == b.parent ? 2 : 1 })
            })

        tree(root).links()
        const links = root.descendants().slice(1)
        const nodes = root.descendants()

        interruptRunningTransitions(data)

        function getChildren(node) {
            getSpaceMapChildren(
                node.data.id,
                node.children.length - 1,
                params,
                node.data.id === spaceData.id
            )
                .then((res) => {
                    const match = findParent(data, node.data.uuid)
                    match.children = match.children.filter((child) => !child.expander)
                    match.children.push(...res.data)
                    updateTree(data, false)
                })
                .catch((error) => console.log(error))
        }

        function findTransitonId(d) {
            // space id used during space transitions (allows duplicates)
            if (spaceTransitioning.current) return d.data.id
            // unique id used when expanding spaces (no duplicates)
            return d.data.uuid
        }

        // const newWidth = parseInt(d3.select('#space-map-svg').style('width'), 10)
        // const transform = `translate(${newWidth / 2},${
        //     data.DirectParentSpaces.length ? yOffset : 80
        // })`

        // d3.select('#link-group').transition().duration(duration).attr('transform', transform)
        // d3.select('#node-group').transition().duration(duration).attr('transform', transform)

        // const parentTransform = `translate(${newWidth / 2},${
        //     data.DirectParentSpaces.length ? yOffset : 80
        // }),rotate(180,0,0)`

        // d3.select('#parent-link-group')
        //     .transition()
        //     .duration(duration)
        //     .attr('transform', parentTransform)
        // d3.select('#parent-node-group')
        //     .transition()
        //     .duration(duration)
        //     .attr('transform', parentTransform)

        function createLinkArrows(nodeData, isParent) {
            const { id } = nodeData.data
            // add arrow to links
            const arrow = d3
                .select(`#${isParent ? 'parent-' : ''}link-group`)
                .append('path')
                .attr('id', `arrow-${id}`)
                .attr('opacity', 0)
                .attr('transform', () => {
                    if (isParent) return 'translate(0, 2.5),rotate(180,0,0)'
                    return 'translate(0, -2.5)'
                })
                .attr('d', 'M 0 0 L 5 2.5 L 0 5 z')
                .style('fill', '#ccc')
            // position arrow at half way point along line
            arrow
                .append('animateMotion')
                .attr('calcMode', 'linear')
                .attr('dur', 'infinite')
                .attr('repeatCount', 'infinite')
                .attr('rotate', 'auto')
                .attr('keyPoints', () => {
                    if (isParent) return '0.35;0.35'
                    return '0.5;0.5'
                })
                .attr('keyTimes', '0.0;1.0')
                .append('mpath')
                .attr('xlink:href', `#line-${id}`)
            // fade in arrows
            arrow.transition().duration(duration).attr('opacity', 1)
        }

        function createLinks(linkGroup, linkData) {
            const isParent = linkGroup === '#parent-link-group'
            d3.select(linkGroup)
                .selectAll('.link')
                .data(linkData, (d) => findTransitonId(d))
                .join(
                    (enter) =>
                        enter
                            .append('path')
                            .classed('link', true)
                            .attr('id', (d) => `line-${d.data.id}`)
                            .attr('stroke', 'black')
                            .attr('fill', 'none')
                            .attr('opacity', 0)
                            .attr('d', (d) => {
                                return `M${d.x},${d.y}C${d.x},${(d.y + d.parent.y) / 2} ${
                                    d.parent.x
                                },${(d.y + d.parent.y) / 2} ${d.parent.x},${d.parent.y}`
                            })
                            .call((node) => {
                                node.transition()
                                    .duration(duration)
                                    .attr('opacity', 0.2)
                                    .on('end', (d) => createLinkArrows(d, isParent))
                            }),
                    (update) =>
                        update.call((node) =>
                            node
                                .transition('link-update')
                                .duration(duration)
                                .attr('d', (d) => {
                                    return `M${d.x},${d.y}C${d.x},${(d.y + d.parent.y) / 2} ${
                                        d.parent.x
                                    },${(d.y + d.parent.y) / 2} ${d.parent.x},${d.parent.y}`
                                })
                                .on('start', (d) => d3.select(`#arrow-${d.data.id}`).remove())
                                .on('end', (d) => createLinkArrows(d, isParent))
                        ),
                    (exit) =>
                        exit.call((node) =>
                            node
                                .transition()
                                .duration(duration / 2)
                                .attr('opacity', 0)
                                .on('start', (d) => d3.select(`#arrow-${d.data.id}`).remove())
                                .remove()
                        )
                )
        }

        function findStartRadius(d, name, isParent, offset) {
            // if parent and match, return match radius
            const match = d3.select(`#${isParent ? '' : 'parent-'}${name}-${d.data.id}`)
            if (match.node()) return match.attr('r')
            return findRadius(d) + offset
        }

        function findStartOpacity(d, name, isParent) {
            // if parent and match, start at full opacity
            const match = d3.select(`#${isParent ? '' : 'parent-'}${name}-${d.data.id}`)
            if (match.node()) return 1
            return 0
        }

        function findStartFontSize(d, name, isParent) {
            // if parent and match, return match font size
            const match = d3.select(`#${isParent ? '' : 'parent-'}${name}-${d.data.id}`)
            if (match.node()) return match.attr('font-size')
            return isRoot(d) ? 16 : 12
        }

        function findStartTransform(d, name, isParent) {
            // if parent, rotate transform
            // if also match, copy and invert translation then remove match
            const match = d3.select(`#${isParent ? '' : 'parent-'}${name}-${d.data.id}`)
            if (match.node()) {
                const t = match.attr('transform').split(/[(,)]/)
                const x = +t[1]
                const y = +t[2]
                match.remove()
                return `translate(${-x || 0},${-y || 0})${isParent ? ',rotate(180,0,0)' : ''}`
            }
            return `translate(${d.x},${d.y})${isParent ? ',rotate(180,0,0)' : ''}`
        }

        function createBackgroundCircles(nodeGroup, nodeData) {
            const isParent = nodeGroup === '#parent-node-group'
            d3.select(nodeGroup)
                .selectAll('.background-circle')
                .data(nodeData, (d) => findTransitonId(d))
                .join(
                    (enter) =>
                        enter
                            .append('circle')
                            .classed('background-circle', true)
                            .classed('transitioning', (d) => {
                                const match = d3.select(
                                    `#${isParent ? '' : 'parent-'}background-circle-${d.data.id}`
                                )
                                if (match.node()) return true
                                return false
                            })
                            .attr(
                                'id',
                                (d) => `${isParent ? 'parent-' : ''}background-circle-${d.data.id}`
                            )
                            .attr('opacity', (d) =>
                                findStartOpacity(d, 'background-circle', isParent)
                            )
                            .attr('r', (d) => findStartRadius(d, 'background-circle', isParent, 2))
                            .attr('fill', '#aaa')
                            .attr('stroke-width', 3)
                            .attr('transform', (d) =>
                                findStartTransform(d, 'background-circle', isParent)
                            )
                            .style('cursor', 'pointer')
                            .on('mouseover', (d) => {
                                const node = d3.select(
                                    `#${isParent ? 'parent-' : ''}background-circle-${d.data.id}`
                                )
                                if (!node.classed('transitioning')) {
                                    // highlight node
                                    node.transition()
                                        .duration(duration / 5)
                                        .attr(
                                            'fill',
                                            d.data.id === spaceData.id ? '#61f287' : '#8ad1ff'
                                        )
                                        .attr('r', findRadius(d) + 6)
                                    // display space info
                                    getHighlightedSpaceData(d.data)
                                    const { top, left } = node.node().getBoundingClientRect()
                                    setHighlightedSpacePosition({ top, left })
                                }
                            })
                            .on('mouseout', (d) => {
                                const node = d3.select(
                                    `#${isParent ? 'parent-' : ''}background-circle-${d.data.id}`
                                )
                                if (!node.classed('transitioning')) {
                                    node.transition()
                                        .duration(duration / 2)
                                        .attr('fill', '#aaa')
                                        .attr('r', findRadius(d) + 2)
                                    // hide space info
                                    setHighlightedSpace(null)
                                }
                            })
                            .on('mousedown', (d) => {
                                setHighlightedSpace(null)
                                if (!spaceTransitioning.current) {
                                    if (d.data.expander) {
                                        getChildren(d.parent)
                                    } else if (d.parent) {
                                        spaceTransitioning.current = true
                                        history.push(`/s/${d.data.handle}/spaces`)
                                        d3.selectAll('.background-circle').classed(
                                            'transitioning',
                                            true
                                        )
                                    } else {
                                        history.push(`/s/${d.data.handle}/posts`)
                                    }
                                }
                            })
                            .call((node) =>
                                node
                                    .transition('background-circle-enter')
                                    .duration(duration)
                                    .attr('opacity', 1)
                                    .attr('r', (d) => findRadius(d) + 2)
                                    .attr('transform', (d) => `translate(${d.x},${d.y})`)
                                    .on('end', () => {
                                        // console.log('end')
                                        // d3.selectAll('.background-circle').classed(
                                        //     'transitioning',
                                        //     false
                                        // )
                                        // spaceTransitioning.current = false
                                    })
                            ),
                    (update) =>
                        update.call((node) =>
                            node
                                .on('mouseover', (d) => {
                                    const node2 = d3.select(
                                        `#${isParent ? 'parent-' : ''}background-circle-${
                                            d.data.id
                                        }`
                                    )
                                    if (node2.node() && !node2.classed('transitioning')) {
                                        // highlight node
                                        node2
                                            .transition()
                                            .duration(duration / 5)
                                            .attr(
                                                'fill',
                                                d.data.id === spaceData.id ? '#61f287' : '#8ad1ff'
                                            )
                                            .attr('r', findRadius(d) + 6)
                                        // display space info
                                        getHighlightedSpaceData(d.data)
                                        const { top, left } = node2.node().getBoundingClientRect()
                                        setHighlightedSpacePosition({ top, left })
                                    }
                                })
                                .on('mouseout', (d) => {
                                    const node2 = d3.select(
                                        `#${isParent ? 'parent-' : ''}background-circle-${
                                            d.data.id
                                        }`
                                    )
                                    if (node2.node() && !node2.classed('transitioning')) {
                                        node2
                                            .transition()
                                            .duration(duration / 2)
                                            .attr('fill', '#aaa')
                                            .attr('r', findRadius(d) + 2)
                                        // hide space info
                                        setHighlightedSpace(null)
                                    }
                                })
                                .transition('background-circle-update')
                                .duration(duration)
                                .attr('r', (d) => findRadius(d) + 2)
                                .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        ),
                    (exit) =>
                        exit.call((node) =>
                            node
                                .transition('background-circle-exit')
                                .duration(duration / 2)
                                .attr('opacity', 0)
                                .remove()
                        )
                )
        }

        function createImageBackgrounds(nodeGroup, nodeData) {
            const isParent = nodeGroup === '#parent-node-group'
            d3.select(nodeGroup)
                .selectAll('.image-background-circle')
                .data(nodeData, (d) => findTransitonId(d))
                .join(
                    (enter) =>
                        enter
                            .append('circle')
                            .classed('image-background-circle', true)
                            .attr(
                                'id',
                                (d) =>
                                    `${isParent ? 'parent-' : ''}image-background-circle-${
                                        d.data.id
                                    }`
                            )
                            .attr('opacity', (d) =>
                                findStartOpacity(d, 'image-background-circle', isParent)
                            )
                            .attr('r', (d) =>
                                findStartRadius(d, 'image-background-circle', isParent, -0.1)
                            )
                            .attr('pointer-events', 'none')
                            .style('fill', 'white')
                            .attr('transform', (d) =>
                                findStartTransform(d, 'image-background-circle', isParent)
                            )
                            .call((node) =>
                                node
                                    // .transition('image-background-circle-enter')
                                    .transition()
                                    .duration(duration)
                                    .attr('opacity', 1)
                                    .attr('transform', (d) => `translate(${d.x},${d.y})`)
                                    .attr('r', (d) => findRadius(d) - 0.1)
                            ),
                    (update) =>
                        update.call((node) =>
                            node
                                // .transition('image-background-circle-update')
                                .transition()
                                .duration(duration)
                                .attr('r', (d) => findRadius(d) - 0.1)
                                .attr('transform', (d) => {
                                    return `translate(${d.x},${d.y})`
                                })
                        ),
                    (exit) =>
                        exit.call((node) =>
                            node
                                // .transition('image-background-circle-exit')
                                .transition()
                                .duration(duration / 2)
                                .attr('opacity', 0)
                                .remove()
                        )
                )
        }

        function createImages(nodeGroup, nodeData) {
            const isParent = nodeGroup === '#parent-node-group'
            d3.select(nodeGroup)
                .selectAll('.image-circle')
                .data(nodeData, (d) => findTransitonId(d))
                .join(
                    (enter) =>
                        enter
                            .append('circle')
                            .classed('image-circle', true)
                            .attr('id', (d) => `image-circle-${d.data.id}`)
                            .attr(
                                'id',
                                (d) => `${isParent ? 'parent-' : ''}image-circle-${d.data.id}`
                            )
                            .attr('opacity', (d) => findStartOpacity(d, 'image-circle', isParent))
                            .attr('r', (d) => findStartRadius(d, 'image-circle', isParent, 0))
                            .attr('pointer-events', 'none')
                            .style('fill', (d) => findFill(d))
                            .attr('transform', (d) =>
                                findStartTransform(d, 'image-circle', isParent)
                            )
                            .call((node) =>
                                node
                                    .transition('image-circle-enter')
                                    .duration(duration)
                                    .attr('opacity', 1)
                                    .attr('r', (d) => findRadius(d))
                                    .attr('transform', (d) => {
                                        if (isParent)
                                            return `translate(${d.x},${d.y}),rotate(180,0,0)`
                                        return `translate(${d.x},${d.y})`
                                    })
                            ),
                    (update) =>
                        update.call(
                            (node) =>
                                node
                                    .transition('image-circle-update')
                                    .duration(duration)
                                    .attr('r', (d) => findRadius(d))
                                    .style('fill', (d) => findFill(d))
                                    .attr('transform', (d) => {
                                        if (isParent)
                                            return `translate(${d.x},${d.y}),rotate(180,0,0)`
                                        return `translate(${d.x},${d.y})`
                                    })
                            // .attr('transform', (d) =>
                            //     findStartTransform(d, 'image-circle', isParent)
                            // )
                            // .attr('transform', (d) => {
                            //     return `translate(${d.x},${d.y})`
                            // })
                        ),
                    (exit) =>
                        exit.call((node) =>
                            node
                                .transition('image-circle-exit')
                                .duration(duration / 2)
                                .attr('opacity', 0)
                                .remove()
                        )
                )
        }

        function createText(nodeGroup, nodeData) {
            const isParent = nodeGroup === '#parent-node-group'
            d3.select(nodeGroup)
                .selectAll('.node-text')
                .data(nodeData, (d) => findTransitonId(d))
                .join(
                    (enter) =>
                        enter
                            .append('text')
                            .classed('node-text', true)
                            .attr('id', (d) => `${isParent ? 'parent-' : ''}node-text-${d.data.id}`)
                            .text((d) => {
                                const croppedText =
                                    d.data.name && d.data.name.length > maxTextLength
                                        ? `${d.data.name.substring(0, maxTextLength - 3)}...`
                                        : d.data.name
                                return isRoot(d) ? d.data.name : croppedText
                            })
                            .attr('font-size', (d) => findStartFontSize(d, 'node-text', isParent)) // (isRoot(d) ? 16 : 12))
                            .attr('opacity', (d) => findStartOpacity(d, 'node-text', isParent))
                            .attr('text-anchor', 'middle')
                            .attr('dominant-baseline', 'central')
                            .attr('y', (d) => {
                                const match = d3.select(
                                    `#${isParent ? '' : 'parent-'}node-text-${d.data.id}`
                                )
                                if (match.node()) return match.attr('y')
                                return isRoot(d) ? -65 : -40
                            })
                            .attr('x', 0)
                            .attr('transform', (d) => findStartTransform(d, 'node-text', isParent))
                            .call((node) =>
                                node
                                    .transition('node-text-enter')
                                    .duration(duration)
                                    .attr('opacity', 1)
                                    .attr('y', (d) => (isRoot(d) ? -65 : -40))
                                    .attr('font-size', (d) => (isRoot(d) ? 16 : 12))
                                    .attr('transform', (d) => {
                                        if (isParent)
                                            return `translate(${d.x},${d.y}),rotate(180,0,0)`
                                        return `translate(${d.x},${d.y})`
                                    })
                            ),
                    (update) =>
                        update.call((node) =>
                            node
                                .transition('node-text-update')
                                .duration(duration)
                                .attr('y', (d) => (isRoot(d) ? -65 : -40))
                                .attr('font-size', (d) => (isRoot(d) ? 16 : 12))
                                .attr('transform', (d) => {
                                    return `translate(${d.x},${d.y})${
                                        isParent ? ',rotate(180,0,0)' : ''
                                    }`
                                })
                                .text((d) => {
                                    const croppedText =
                                        d.data.name && d.data.name.length > maxTextLength
                                            ? `${d.data.name.substring(0, maxTextLength - 3)}...`
                                            : d.data.name
                                    return isRoot(d) ? d.data.name : croppedText
                                })
                        ),
                    (exit) =>
                        exit.call((node) =>
                            node
                                .transition('node-text-exit')
                                .duration(duration / 2)
                                .attr('opacity', 0)
                                .remove()
                        )
                )
        }

        function createPlusMinusButtons(nodeGroup, nodeData) {
            d3.select(nodeGroup)
                .selectAll('.node-button')
                .data(nodeData, (d) => d.data.uuid)
                .join(
                    (enter) =>
                        enter
                            .filter((d) => {
                                return (
                                    d.data.totalResults > 0 &&
                                    d.depth > 0 &&
                                    d.data.privacy !== 'private'
                                )
                            })
                            .append('svg:image')
                            .attr('xlink:href', (d) => {
                                return d.data.collapsed === true
                                    ? `${config.publicAssets}/icons/plus.svg`
                                    : `${config.publicAssets}/icons/minus-solid.svg`
                            })
                            .classed('node-button', true)
                            .attr('id', (d) => `node-button-${d.data.id}`)
                            .attr('opacity', 0)
                            .attr('width', 15)
                            .attr('height', 15)
                            .attr('y', -7)
                            .attr('x', 32)
                            .attr('transform', (d) => {
                                return `translate(${d.x},${d.y})`
                            })
                            .style('cursor', 'pointer')
                            .on('click', (d) => {
                                const match = findParent(data, d.data.uuid)
                                if (d.data.collapsed === true) match.collapsed = false
                                else match.collapsed = true
                                toggleChildren(match)
                                updateTree(data, false)
                            })
                            .call((node) =>
                                node
                                    .transition('node-button-enter')
                                    .duration(duration)
                                    .attr('opacity', 0.15)
                            ),
                    (update) =>
                        update.call((node) =>
                            node
                                .transition('node-text-update')
                                .duration(duration)
                                .attr('xlink:href', (d) => {
                                    return d.data.collapsed === true
                                        ? `${config.publicAssets}/icons/plus.svg`
                                        : `${config.publicAssets}/icons/minus-solid.svg`
                                })
                                .attr('transform', (d) => {
                                    return `translate(${d.x},${d.y})`
                                })
                        ),
                    (exit) =>
                        exit.call((node) =>
                            node
                                .transition('node-text-exit')
                                .duration(duration / 2)
                                .attr('opacity', 0)
                                .remove()
                        )
                )
        }

        createLinks('#link-group', links)
        createLinks('#parent-link-group', parentLinks)

        createBackgroundCircles('#node-group', nodes)
        createImageBackgrounds('#node-group', nodes)
        createImages('#node-group', nodes)
        createText('#node-group', nodes)
        createPlusMinusButtons('#node-group', nodes)

        createBackgroundCircles('#parent-node-group', parentNodes)
        createImageBackgrounds('#parent-node-group', parentNodes)
        createImages('#parent-node-group', parentNodes)
        createText('#parent-node-group', parentNodes)
    }

    useEffect(() => createCanvas(), [])

    useEffect(() => {
        if (spaceMapData.id) {
            if (firstRun) setFirstRun(false)
            else spaceTransitioning.current = true
            updateTree(spaceMapData, true)
        }
    }, [spaceMapData])

    useEffect(() => () => setSpaceMapData({}), [])

    function findModalPosition() {
        if (highlightedSpacePosition.left) {
            const zoomScale = d3.zoomTransform(d3.select('#space-map-master-group').node()).k
            const isMainSpace = highlightedSpace.id === spaceData.id
            const top = highlightedSpacePosition.top + zoomScale * (isMainSpace ? 52 : 26) - 30
            const left = highlightedSpacePosition.left + zoomScale * (isMainSpace ? 115 : 65) + 10
            return { top, left }
        }
        return null
    }

    return (
        <div id='canvas' className={styles.canvas}>
            {highlightedSpace && (
                <Column className={styles.spaceInfoModal} style={findModalPosition()}>
                    <div className={styles.pointer} />
                    <h1>{highlightedSpace.name}</h1>
                    {highlightedSpace.handle ? (
                        <>
                            <h2>s/{highlightedSpace.handle}</h2>
                            <DraftText
                                stringifiedDraft={highlightedSpace.description}
                                className={styles.draft}
                                markdownStyles={styles.markdown}
                            />
                            <Row className={styles.stats}>
                                <StatButton
                                    icon={<UsersIcon />}
                                    text={highlightedSpace.totalFollowers}
                                />
                                <StatButton
                                    icon={<PostIcon />}
                                    text={highlightedSpace.totalPosts}
                                />
                                <StatButton
                                    icon={<CommentIcon />}
                                    text={highlightedSpace.totalComments}
                                />
                                <StatButton
                                    icon={<ReactionIcon />}
                                    text={highlightedSpace.totalReactions}
                                />
                            </Row>
                        </>
                    ) : (
                        <h2 style={{ marginTop: 5 }}>Click to expand</h2>
                    )}
                </Column>
            )}
        </div>
    )
}

export default SpaceMap
