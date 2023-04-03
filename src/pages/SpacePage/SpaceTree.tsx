/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import Row from '@components/Row'
import StatButton from '@components/StatButton'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/SpaceTree.module.scss'
import { CommentIcon, LockIcon, PostIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SpaceTree(props: { spaceTreeData: any; params: any }): JSX.Element {
    const { spaceTreeData, params } = props
    const { spaceData, setSpaceTreeData, getSpaceMapChildren } = useContext(SpaceContext)
    const [clickedSpaceUUID, setClickedSpaceUUID] = useState('')
    const [showSpaceModal, setShowSpaceModal] = useState(false)
    const [highlightedSpace, setHighlightedSpace] = useState<any>(null)
    const [highlightedSpacePosition, setHighlightedSpacePosition] = useState<any>({})
    const spaceTransitioning = useRef<boolean>(true)
    const parentNodes = useRef<any>(null)
    const parentLinks = useRef<any>(null)
    const childNodes = useRef<any>(null)
    const childLinks = useRef<any>(null)
    const history = useNavigate()
    const circleRadius = 25
    const maxTextLength = 14
    const duration = 1000
    const zoom = d3
        .zoom()
        .on('zoom', (event) =>
            d3.select('#space-tree-master-group').attr('transform', event.transform)
        )

    function getHighlightedSpaceData(space) {
        axios
            .get(`${config.apiURL}/space-map-space-data?spaceId=${space.id}`)
            .then((res) => setHighlightedSpace({ ...space, ...res.data }))
            .catch((error) => console.log(error))
    }

    function findSpaceByUUID(tree: any, uuid: string) {
        // recursive function, traverses the raw tree to find a space using its uuid
        if (tree.uuid === uuid) return tree
        if (tree.children) {
            for (let i = 0; i < tree.children.length; i += 1) {
                const match = findSpaceByUUID(tree.children[i], uuid)
                if (match) return match
            }
        }
        return null
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

    function isRoot(d) {
        return d.data.id === spaceData.id
    }

    function oppositeType(type) {
        return type === 'child' ? 'parent' : 'child'
    }

    function findRadius(d) {
        // double sized circle for main space
        if (d.data.id === spaceData.id) return circleRadius * 2
        return circleRadius
    }

    function findStartRadius(d, name, type, offset) {
        // if match in opposite tree, use match radius
        const match = d3.select(`#${oppositeType(type)}-${name}-${d.data.uuid}`)
        return match.node() ? match.attr('r') : findRadius(d) + offset
    }

    function findStartOpacity(d, name, type) {
        // if match in opposite tree, start at full opacity
        const match = d3.select(`#${oppositeType(type)}-${name}-${d.data.uuid}`)
        return match.node() ? 1 : 0
    }

    function findStartFontSize(d, name, type) {
        // if match in opposite tree, use match font size
        const match = d3.select(`#${oppositeType(type)}-${name}-${d.data.uuid}`)
        if (match.node()) return match.attr('font-size')
        return isRoot(d) ? 16 : 12
    }

    function findStartTransform(d, name, type) {
        // if match in opposite tree, use match transform
        const match = d3.select(`#${oppositeType(type)}-${name}-${d.data.uuid}`)
        const rotation = type === 'child' ? '' : ',rotate(180,0,0)'
        if (match.node()) {
            const t = match.attr('transform').split(/[(,)]/)
            const x = +t[1]
            const y = +t[2]
            match.remove()
            return `translate(${-x || 0},${-y || 0})${rotation}`
        }
        return `translate(${d.x},${d.y})${rotation}`
    }

    function findFill(d, type) {
        // check if image already exists in defs
        const existingImage = d3.select(`#image-${d.data.uuid}`)
        const circle = d3.select(`#${type}-image-circle-${d.data.uuid}`)
        if (existingImage.node()) {
            // check image size matches circle start size
            const matchingSizes = existingImage.attr('height') / 2 === +circle.attr('r')
            // only include duration if circle present and matching sizes
            existingImage
                .transition()
                .duration(circle.node() && matchingSizes ? duration : 0)
                .attr('height', findRadius(d) * 2)
                .attr('width', findRadius(d) * 2)
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
                .attr('height', findRadius(d) * 2)
                .attr('width', findRadius(d) * 2)
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .attr('xlink:href', () => {
                    const expanderIcon = `${config.publicAssets}/icons/plus-icon.jpg`
                    const defaultImage = `${config.publicAssets}/icons/default-space-flag.jpg`
                    return d.data.expander ? expanderIcon : d.data.flagImagePath || defaultImage
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

    function circleMouseOver(d, type) {
        if (!spaceTransitioning.current) {
            // highlight selected circle
            const circle = d3.select(`#${type}-background-circle-${d.data.uuid}`)
            circle
                .transition()
                .duration(duration / 5)
                .attr('fill', d.data.id === spaceData.id ? '#61f287' : '#8ad1ff')
                .attr('r', findRadius(d) + 6)
            // highlight other circles
            d3.selectAll(`.background-circle-${d.data.id}`)
                .filter((c) => c.data.uuid !== d.data.uuid)
                .transition()
                .duration(duration / 5)
                .attr('fill', '#a090f7')
                .attr('r', findRadius(d) + 6)
            // fade in privacy image if required
            if (d.data.privacy === 'private' && !d.data.spaceAccess) {
                d3.select(`#node-privacy-${d.data.uuid}`)
                    .transition()
                    .duration(duration / 5)
                    .attr('opacity', 1)
            }
            // display space info
            getHighlightedSpaceData(d.data)
            setShowSpaceModal(true)
            const { top, left } = circle.node().getBoundingClientRect()
            setHighlightedSpacePosition({ top, left })
        }
    }

    function circleMouseOut(d) {
        if (!spaceTransitioning.current) {
            // fade out privacy image if required
            if (d.data.privacy === 'private' && !d.data.spaceAccess) {
                d3.select(`#node-privacy-${d.data.uuid}`)
                    .transition()
                    .duration(duration / 5)
                    .attr('opacity', 0)
            }
            // fade out all highlighted circles
            d3.selectAll(`.background-circle-${d.data.id}`)
                .transition()
                .duration(duration / 5)
                .attr('fill', '#aaa')
                .attr('r', findRadius(d) + 2)
            // hide space info
            setShowSpaceModal(false)
            setHighlightedSpace(null)
        }
    }

    function circleMouseDown(d) {
        if (!spaceTransitioning.current) {
            spaceTransitioning.current = true
            setShowSpaceModal(false)
            setHighlightedSpace(null)
            // if current space, open post page
            if (!d.parent) history(`/s/${d.data.handle}/posts`)
            else if (d.data.expander) {
                // if expander, fetch next set of children
                const spaceId = d.parent.data.id
                const offset = d.parent.children.length - 1
                const isParent = d.parent.data.id === spaceData.id
                getSpaceMapChildren(spaceId, offset, params, isParent)
                    .then((res) => {
                        const parent = findSpaceByUUID(spaceTreeData, d.parent.data.uuid)
                        parent.children = parent.children.filter((child) => !child.expander)
                        parent.children.push(...res.data)
                        updateTree(false)
                    })
                    .catch((error) => console.log(error))
            } else {
                // otherwise navigate to new space
                setClickedSpaceUUID(d.data.uuid)
                history(`/s/${d.data.handle}/spaces?lens=Tree`)
            }
        }
    }

    function plusMinusMouseDown(d) {
        if (!spaceTransitioning.current) {
            spaceTransitioning.current = true
            const match = findSpaceByUUID(spaceTreeData, d.data.uuid)
            if (d.data.collapsed) {
                // expand children
                match.collapsed = false
                if (match.hiddenChildren) {
                    // show hidden children
                    match.children = match.hiddenChildren
                    match.hiddenChildren = null
                    updateTree(false)
                } else {
                    // get new children
                    getSpaceMapChildren(d.data.id, 0, params, false)
                        .then((res) => {
                            match.children.push(...res.data.children)
                            updateTree(false)
                        })
                        .catch((error) => console.log(error))
                }
            } else {
                // collapse children
                match.collapsed = true
                match.hiddenChildren = match.children
                match.children = null
                updateTree(false)
            }
        }
    }

    function plusMinusImage(d) {
        // if space has children but none loaded due to tree depth, set collapsed to true
        const hasChildren = d.data.totalResults || d.data.totalChildren
        if (hasChildren && !d.children) d.data.collapsed = true
        return d.data.collapsed
            ? `${config.publicAssets}/icons/plus-solid.svg`
            : `${config.publicAssets}/icons/minus-solid.svg`
    }

    function createLinkArrows(nodeData, type) {
        const { id } = nodeData.data
        const isChild = type === 'child'
        const transform = isChild ? 'translate(0, -2.5)' : 'translate(0, 2.5),rotate(180,0,0)'
        const keyPoints = isChild ? '0.5;0.5' : '0.35;0.35'
        // add arrow to links
        const arrow = d3
            .select(`#${type}-link-group`)
            .append('path')
            .attr('id', `arrow-${id}`)
            .attr('opacity', 0)
            .attr('transform', transform)
            .attr('d', 'M 0 0 L 5 2.5 L 0 5 z')
            .style('fill', '#ccc')
        // position arrow at half way point along line
        arrow
            .append('animateMotion')
            .attr('calcMode', 'linear')
            .attr('dur', 'infinite')
            .attr('repeatCount', 'infinite')
            .attr('rotate', 'auto')
            .attr('keyPoints', keyPoints)
            .attr('keyTimes', '0.0;1.0')
            .append('mpath')
            .attr('xlink:href', `#line-${id}`)
        // fade in arrows
        arrow.transition().duration(duration).attr('opacity', 1)
    }

    function findPathCoordinates(d) {
        return `M${d.x},${d.y}C${d.x},${(d.y + d.parent.y) / 2} ${d.parent.x},${
            (d.y + d.parent.y) / 2
        } ${d.parent.x},${d.parent.y}`
    }

    function findCircleText(d) {
        const { name } = d.data
        if (name.length < maxTextLength || isRoot(d)) return name
        return `${name.substring(0, maxTextLength - 3)}...`
    }

    function createLinks(type: 'child' | 'parent') {
        const linkData = type === 'child' ? childLinks.current : parentLinks.current
        d3.select(`#${type}-link-group`)
            .selectAll('.link')
            .data(linkData, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .append('path')
                        .classed('link', true)
                        .attr('id', (d) => `line-${d.data.id}`)
                        .attr('stroke', 'black')
                        .attr('fill', 'none')
                        .attr('opacity', 0)
                        .attr('d', (d) => findPathCoordinates(d))
                        .call((node) => {
                            node.transition()
                                .duration(duration)
                                .attr('opacity', 0.2)
                                .on('end', (d) => createLinkArrows(d, type))
                        }),
                (update) =>
                    update.call((node) =>
                        node
                            .transition('link-update')
                            .duration(duration)
                            .attr('d', (d) => findPathCoordinates(d))
                            .on('start', (d) => d3.select(`#arrow-${d.data.id}`).remove())
                            .on('end', (d) => createLinkArrows(d, type))
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

    function createBackgroundCircles(type) {
        const nodeData = type === 'child' ? childNodes.current : parentNodes.current
        d3.select(`#${type}-node-group`)
            .selectAll('.background-circle')
            .data(nodeData, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .append('circle')
                        .attr('id', (d) => `${type}-background-circle-${d.data.uuid}`)
                        .attr('class', (d) => `background-circle background-circle-${d.data.id}`)
                        .attr('opacity', (d) => findStartOpacity(d, 'background-circle', type))
                        .attr('r', (d) => findStartRadius(d, 'background-circle', type, 2))
                        .attr('fill', '#aaa')
                        .attr('stroke-width', 3)
                        .attr('transform', (d) => findStartTransform(d, 'background-circle', type))
                        .style('cursor', 'pointer')
                        .on('mouseover', (e, d) => circleMouseOver(d, type))
                        .on('mouseout', (e, d) => circleMouseOut(d))
                        .on('mousedown', (e, d) => circleMouseDown(d))
                        .call((node) =>
                            node
                                .transition('background-circle-enter')
                                .duration(duration)
                                .attr('opacity', 1)
                                .attr('r', (d) => findRadius(d) + 2)
                                .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .on('mouseover', (e, d) => circleMouseOver(d, type))
                            .on('mouseout', (e, d) => circleMouseOut(d))
                            .on('mousedown', (e, d) => circleMouseDown(d))
                            .transition('background-circle-update')
                            .duration(duration)
                            .attr('r', (d) => findRadius(d) + 2)
                            .attr('fill', '#aaa')
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

    function createImageBackgrounds(type) {
        const nodeData = type === 'child' ? childNodes.current : parentNodes.current
        d3.select(`#${type}-node-group`)
            .selectAll('.image-background-circle')
            .data(nodeData, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .append('circle')
                        .classed('image-background-circle', true)
                        .attr('id', (d) => `${type}-image-background-circle-${d.data.uuid}`)
                        .attr('opacity', (d) =>
                            findStartOpacity(d, 'image-background-circle', type)
                        )
                        .attr('r', (d) => findStartRadius(d, 'image-background-circle', type, -0.1))
                        .attr('pointer-events', 'none')
                        .style('fill', 'white')
                        .attr('transform', (d) =>
                            findStartTransform(d, 'image-background-circle', type)
                        )
                        .call((node) =>
                            node
                                .transition()
                                .duration(duration)
                                .attr('opacity', 1)
                                .attr('transform', (d) => `translate(${d.x},${d.y})`)
                                .attr('r', (d) => findRadius(d) - 0.1)
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .transition()
                            .duration(duration)
                            .attr('r', (d) => findRadius(d) - 0.1)
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
    }

    function createImages(type) {
        const nodeData = type === 'child' ? childNodes.current : parentNodes.current
        const rotation = type === 'child' ? '' : ',rotate(180,0,0)'
        d3.select(`#${type}-node-group`)
            .selectAll('.image-circle')
            .data(nodeData, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .append('circle')
                        .classed('image-circle', true)
                        .attr('id', (d) => `${type}-image-circle-${d.data.uuid}`)
                        .attr('opacity', (d) => findStartOpacity(d, 'image-circle', type))
                        .attr('r', (d) => findStartRadius(d, 'image-circle', type, 0))
                        .attr('pointer-events', 'none')
                        .style('fill', (d) => findFill(d, type))
                        .attr('transform', (d) => findStartTransform(d, 'image-circle', type))
                        .call((node) =>
                            node
                                .transition('image-circle-enter')
                                .duration(duration)
                                .attr('opacity', 1)
                                .attr('r', (d) => findRadius(d))
                                .attr('transform', (d) => `translate(${d.x},${d.y})${rotation}`)
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .transition('image-circle-update')
                            .duration(duration)
                            .attr('r', (d) => findRadius(d))
                            .style('fill', (d) => findFill(d, type))
                            .attr('transform', (d) => `translate(${d.x},${d.y})${rotation}`)
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

    function createText(type) {
        const nodeData = type === 'child' ? childNodes.current : parentNodes.current
        const rotation = type === 'child' ? '' : ',rotate(180,0,0)'
        d3.select(`#${type}-node-group`)
            .selectAll('.node-text')
            .data(nodeData, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .append('text')
                        .classed('node-text', true)
                        .attr('id', (d) => `${type}-node-text-${d.data.uuid}`)
                        .text((d) => findCircleText(d))
                        .attr('font-size', (d) => findStartFontSize(d, 'node-text', type))
                        .attr('opacity', (d) => findStartOpacity(d, 'node-text', type))
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('y', (d) => {
                            const match = d3.select(
                                `#${oppositeType(type)}-node-text-${d.data.uuid}`
                            )
                            if (match.node()) return match.attr('y')
                            return isRoot(d) ? -65 : -40
                        })
                        .attr('x', 0)
                        .attr('transform', (d) => findStartTransform(d, 'node-text', type))
                        .call((node) =>
                            node
                                .transition('node-text-enter')
                                .duration(duration)
                                .attr('opacity', 1)
                                .attr('y', (d) => (isRoot(d) ? -65 : -40))
                                .attr('font-size', (d) => (isRoot(d) ? 16 : 12))
                                .attr('transform', (d) => `translate(${d.x},${d.y})${rotation}`)
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .transition('node-text-update')
                            .duration(duration)
                            .attr('y', (d) => (isRoot(d) ? -65 : -40))
                            .attr('font-size', (d) => (isRoot(d) ? 16 : 12))
                            .attr('transform', (d) => `translate(${d.x},${d.y})${rotation}`)
                            .text((d) => findCircleText(d))
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

    function createPlusMinusButtons() {
        d3.select('#child-node-group')
            .selectAll('.node-button')
            .data(childNodes.current, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .filter((d) => {
                            const hasChildren = d.data.totalResults || d.data.totalChildren
                            const accessGranted = d.data.privacy === 'public' || d.data.spaceAccess
                            return !isRoot(d) && hasChildren && accessGranted
                        })
                        .append('svg:image')
                        .attr('xlink:href', (d) => plusMinusImage(d))
                        .classed('node-button', true)
                        .attr('id', (d) => `node-button-${d.data.uuid}`)
                        .attr('opacity', 0)
                        .attr('width', 15)
                        .attr('height', 15)
                        .attr('y', -7)
                        .attr('x', 32)
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        .style('cursor', 'pointer')
                        .on('mousedown', (e, d) => plusMinusMouseDown(d))
                        .call((node) =>
                            node
                                .transition('node-button-enter')
                                .duration(duration)
                                .attr('opacity', (d) => (isRoot(d) ? 0 : 0.15))
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .filter((d) => {
                                const access = d.data.privacy === 'public' || d.data.spaceAccess
                                if (!access) {
                                    // remove button if access no longer granted after log out
                                    d3.select(`#node-button-${d.data.uuid}`)
                                        .transition()
                                        .duration(duration / 3)
                                        .attr('opacity', 0)
                                        .remove()
                                }
                                return access
                            })
                            .attr('pointer-events', (d) => (isRoot(d) ? 'none' : 'auto'))
                            .on('mousedown', (e, d) => plusMinusMouseDown(d))
                            .transition('node-text-update')
                            .duration(duration)
                            .attr('xlink:href', (d) => plusMinusImage(d))
                            .attr('transform', (d) => `translate(${d.x},${d.y})`)
                            .attr('opacity', (d) => (isRoot(d) ? 0 : 0.15))
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

    function createPrivacyCircles() {
        d3.select('#child-node-group')
            .selectAll('.node-privacy')
            .data(childNodes.current, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .filter((d) => d.data.privacy === 'private' && !d.data.spaceAccess)
                        .append('circle')
                        .classed('node-privacy', true)
                        .attr('id', (d) => `node-privacy-${d.data.uuid}`)
                        .attr('opacity', 0)
                        .attr('r', circleRadius)
                        .attr('pointer-events', 'none')
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        .style('fill', 'url(#private-space-pattern')
                        .call((node) =>
                            node
                                .transition()
                                .duration(duration)
                                .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .transition()
                            .duration(duration)
                            .attr('transform', (d) => `translate(${d.x},${d.y})`)
                    ),
                (exit) =>
                    exit.call((node) =>
                        node
                            .transition()
                            .duration(duration / 2)
                            .remove()
                    )
            )
    }

    function createCanvas() {
        let width: string | number = '100%'
        const height = '100%'
        const yOffset = spaceData.DirectParentSpaces.length ? 180 : 80
        const svg = d3
            .select('#space-tree-canvas')
            .append('svg')
            .attr('id', 'space-tree-svg')
            .attr('width', width)
            .attr('height', height)
        width = parseInt(svg.style('width'), 10)
        // create image defs
        const defs = svg.append('defs').attr('id', 'imgdefs')
        // create privacy image
        const privacyPattern = defs
            .append('pattern')
            .attr('id', 'private-space-pattern')
            .attr('height', 1)
            .attr('width', 1)
        privacyPattern
            .append('image')
            .attr('id', 'private-space-image')
            .attr('height', circleRadius * 2)
            .attr('width', circleRadius * 2)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .attr('xlink:href', `${config.publicAssets}/images/lock-image-2.png`)
        // build master groups
        const masterGroup = svg.append('g').attr('id', 'space-tree-master-group')
        masterGroup.append('g').attr('id', 'child-link-group')
        masterGroup
            .append('g')
            .attr('id', 'parent-link-group')
            .attr('transform', `translate(0,0),rotate(180,0,0)`)
        masterGroup
            .append('g')
            .attr('id', 'parent-node-group')
            .attr('transform', `translate(0,0),rotate(180,0,0)`)
        masterGroup.append('g').attr('id', 'child-node-group')
        // set up zoom
        svg.call(zoom).on('dblclick.zoom', null)
        svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, yOffset))
    }

    function findModalPosition() {
        if (highlightedSpacePosition.left) {
            const zoomScale = d3.zoomTransform(d3.select('#space-tree-master-group').node()).k
            const isMainSpace = highlightedSpace.id === spaceData.id
            const top = highlightedSpacePosition.top + zoomScale * (isMainSpace ? 52 : 26) - 30
            const left = highlightedSpacePosition.left + zoomScale * (isMainSpace ? 115 : 65) + 10
            return { top, left }
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

    function buildTrees(resetPosition) {
        // build new parent tree
        const parents = d3.hierarchy(spaceTreeData, (d) => d.DirectParentSpaces)
        const parentTree = d3
            .tree()
            .nodeSize([50, 130])
            .separation(() => 2)
        parentTree(parents).links()
        const newParentLinks = parents.descendants().slice(1)
        const newParentNodes = parents.descendants().slice(1)

        // build new child tree
        const root = d3.hierarchy(spaceTreeData, (d) => d.children)
        const tree = d3
            .tree()
            .nodeSize([50, 200])
            .separation(() => 2)
        tree(root).links()
        const newChildLinks = root.descendants().slice(1)
        const newChildNodes = root.descendants()

        // update UUIDs for transitions
        const oldSpace = childNodes.current && childNodes.current[0]
        if (oldSpace && resetPosition) {
            const newSpace = newChildNodes[0]
            if (oldSpace.data.id === newSpace.data.id) {
                // if filters changes, match parent and child nodes
                newParentNodes.forEach((n, i) => {
                    n.data.uuid = parentNodes.current[i].data.uuid
                })
                recursivelyAddUUIDS(oldSpace, newSpace)
            } else {
                // search for new space in old parent and child nodes
                // if navigation from click, use uuid to ensure the correct space is chosen, otherwise just the space id
                const id = clickedSpaceUUID || newSpace.data.id
                const idType = clickedSpaceUUID ? 'uuid' : 'id'
                const oldParent = parentNodes.current.find((s) => s.data[idType] === id)
                const oldChild = childNodes.current.find((s) => s.data[idType] === id)
                if (oldParent) {
                    // link old parent to new space
                    newSpace.data.uuid = oldParent.data.uuid
                    // search for old space in new children and recursively add uuids if present
                    const newParent = newSpace.children.find((c) => c.data.id === oldSpace.data.id)
                    if (newParent) recursivelyAddUUIDS(oldSpace, newParent)
                } else if (oldChild) {
                    // link old child's parent if present
                    const parent = newParentNodes.find((s) => s.data.id === oldChild.parent.data.id)
                    if (parent) parent.data.uuid = oldChild.parent.data.uuid
                    // recursively add old child's uuids to new space
                    recursivelyAddUUIDS(oldChild, newSpace)
                } else {
                    // if new space neither old parent or child, search for matching spaces by id
                    const matchingChild = findSpaceById(newSpace, oldSpace.data.id)
                    if (matchingChild) {
                        recursivelyAddUUIDS(oldSpace, matchingChild)
                        // search for matchingChild's parent in old parents and link if present
                        const parent = parentNodes.current.find(
                            (s) => s.data.id === matchingChild.parent.data.id
                        )
                        if (parent) matchingChild.parent.data.uuid = parent.data.uuid
                    }
                }
            }
        }

        setClickedSpaceUUID('')
        parentLinks.current = newParentLinks
        parentNodes.current = newParentNodes
        childLinks.current = newChildLinks
        childNodes.current = newChildNodes
    }

    function resetTreePosition() {
        const svg = d3.select('#space-tree-svg')
        const svgWidth = parseInt(svg.style('width'), 10)
        const yOffset = spaceTreeData && spaceTreeData.DirectParentSpaces.length ? 180 : 80
        svg.transition()
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity.scale(1).translate(svgWidth / 2, yOffset))
    }

    function updateTree(resetPosition) {
        if (resetPosition) resetTreePosition()
        buildTrees(resetPosition)
        // create parent tree elements
        createLinks('parent')
        createBackgroundCircles('parent')
        createImageBackgrounds('parent')
        createImages('parent')
        createText('parent')
        // create child tree elements
        createLinks('child')
        createBackgroundCircles('child')
        createImageBackgrounds('child')
        createImages('child')
        createText('child')
        createPlusMinusButtons()
        createPrivacyCircles()
        // mark transition complete after duration
        setTimeout(() => {
            spaceTransitioning.current = false
        }, duration)
    }

    useEffect(() => {
        createCanvas()
        return () => setSpaceTreeData({})
    }, [])

    useEffect(() => {
        if (spaceTreeData.id) updateTree(true)
    }, [spaceTreeData])

    return (
        <div id='space-tree-canvas' className={styles.canvas}>
            {showSpaceModal && highlightedSpace && (
                <Column className={styles.spaceInfoModal} style={findModalPosition()}>
                    <div className={styles.pointer} />
                    <Row centerY className={styles.title}>
                        {highlightedSpace.privacy === 'private' && <LockIcon />}
                        <h1>{highlightedSpace.name}</h1>
                    </Row>
                    {highlightedSpace.expander ? (
                        <h2 style={{ marginTop: 5 }}>Click to expand</h2>
                    ) : (
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
                            </Row>
                        </>
                    )}
                </Column>
            )}
        </div>
    )
}

export default SpaceTree
