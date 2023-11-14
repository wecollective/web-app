/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-this-in-sfc */
import Column from '@components/Column'
import Row from '@components/Row'
import StatButton from '@components/StatButton'
import DraftText from '@components/draft-js/DraftText'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { trimText } from '@src/Helpers'
import FlagImage from '@src/components/FlagImage'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/pages/SpacePage/SpaceCircles.module.scss'
import { CommentIcon, LockIcon, PostIcon, UsersIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SpaceCircles(props: { spaceCircleData: any; params: any }): JSX.Element {
    const { spaceCircleData, params } = props
    const { sortBy, sortOrder } = params
    const { setSpaceCircleData } = useContext(SpaceContext)
    const [clickedSpaceUUID, setClickedSpaceUUID] = useState('')
    const [mouseDown, setMouseDown] = useState(false)
    const [showSpaceModal, setShowSpaceModal] = useState(false)
    const [highlightedSpace, setHighlightedSpace] = useState<any>(null)
    const [mouseCoordinates, setMouseCoordinates] = useState({ x: 0, y: 0 })
    const history = useNavigate()
    const transitionDuration = 1000
    const maxTextLength = 20
    const currentCircle = useRef('')
    const circleRadius = useRef(0)
    const transitioning = useRef(true)
    const parentNodes = useRef<any>(null)
    const childNodes = useRef<any>(null)

    const colorScale = d3
        .scaleLinear()
        .domain([0, 5])
        .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
        .interpolate(d3.interpolateHcl)

    const zoom = d3
        .zoom()
        .on('zoom', (event) => {
            d3.select('#sc-master-group').attr('transform', event.transform)
            // scale circle and text attributes
            const scale = event.transform.k
            d3.selectAll('.sc-circle,.sc-circle-image').attr('stroke-width', 1 / scale)
            d3.selectAll('.sc-circle-text')
                .attr('font-size', (d) => (isRoot(d) ? 20 : 16) / scale)
                .attr('y', (d) => d.y - d.r - (isRoot(d) ? 25 : 15) / scale)
                .attr('opacity', (d) => {
                    if (scale > 7) return 1
                    return d.r > 30 / scale ? 1 : 0
                })
        })
        .on('end', (event) => {
            // update mouse coordinates after drag events
            const { pageX, pageY } = event
            const { y } = d3.select('#sc-svg').node().getBoundingClientRect()
            setMouseCoordinates({ x: pageX + 20, y: pageY + y - 332 })
            setMouseDown(false)
        })

    function isRoot(circle) {
        return circle.data.uuid === childNodes.current[0].data.uuid
    }

    function isHoveredCircle(circle, d) {
        return circle.data.uuid === d.data.uuid
    }

    function findCircleText(d) {
        const { name } = d.data
        if (name.length < maxTextLength || isRoot(d)) return name
        return trimText(name, maxTextLength - 3)
    }

    function getHighlightedSpaceData(space) {
        axios
            .get(`${config.apiURL}/space-map-space-data?spaceId=${space.id}`)
            .then((res) => setHighlightedSpace({ ...space, ...res.data }))
            .catch((error) => console.log(error))
    }

    function resetPosition(duration) {
        transitioning.current = true
        // calculate center position
        const svg = d3.select('#sc-svg')
        const svgWidth = parseInt(svg.style('width'), 10)
        const svgHeight = parseInt(svg.style('height'), 10)
        const x = svgWidth / 2 - circleRadius.current
        const y = svgHeight / 2 - circleRadius.current
        const hasParents =
            spaceCircleData.DirectParentSpaces && spaceCircleData.DirectParentSpaces.length > 0
        const yOffset = hasParents ? 50 : 0
        // update SVG click function with latest coordinates and transition to new position
        svg.on('click', () => resetPosition(transitionDuration))
            .transition('reset-position')
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity.translate(x, y + yOffset))
            .on('end', () => (transitioning.current = false))
    }

    function findFill(d, radius) {
        // check if image already exists in defs
        const existingImage = d3.select(`#sc-image-${d.data.uuid}`)
        const circle = d3.select(`#sc-circle-image-${d.data.uuid}`)
        if (existingImage.node()) {
            // check image size matches circle start size
            const matchingSizes =
                circle.node() && existingImage.attr('height') / 2 === +circle.attr('r')
            // only include duration if circle present and matching sizes
            existingImage
                .transition()
                .duration(circle.node() && matchingSizes ? transitionDuration : 0)
                .attr('height', radius * 2)
                .attr('width', radius * 2)
        } else {
            // create new pattern
            const pattern = d3
                .select('#sc-imgdefs')
                .append('pattern')
                .attr('id', `sc-pattern-${d.data.uuid}`)
                .attr('height', 1)
                .attr('width', 1)
            // append new image to pattern
            pattern
                .append('image')
                .attr('id', `sc-image-${d.data.uuid}`)
                .attr('height', radius * 2)
                .attr('width', radius * 2)
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .attr(
                    'xlink:href',
                    () =>
                        d.data.flagImagePath ||
                        `${config.publicAssets}/icons/default-space-flag.jpg`
                )
                .on('error', () => {
                    // try image proxy
                    const newImage = d3.select(`#sc-image-${d.data.uuid}`)
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
        return `url(#sc-pattern-${d.data.uuid})`
    }

    function circleMouseOver(event, circle) {
        event.stopPropagation()
        if (!transitioning.current) {
            // currentCircle.current = circle.data.uuid
            // setTimeout(() => {
            //     if (currentCircle.current === circle.data.uuid) {
            const zoomScale = d3.zoomTransform(d3.select('#sc-master-group').node()).k
            d3.selectAll(
                `.sc-parent-circle-${circle.data.id},.sc-circle-${circle.data.id},.sc-circle-background-${circle.data.id},.sc-circle-image-${circle.data.id}`
            )
                .transition('circles-mouse-over')
                .duration(transitionDuration / 3)
                .attr('stroke', (d) => colors[isHoveredCircle(circle, d) ? 'cpBlue' : 'cpPurple'])
                .attr('stroke-width', 5 / zoomScale)
                .attr('opacity', 1)
            // display space info
            getHighlightedSpaceData(circle.data)
            setShowSpaceModal(true)
            //     }
            // }, 500)
        }
    }

    function circleMouseOut(event, circle) {
        event.stopPropagation()
        if (!transitioning.current) {
            currentCircle.current = ''
            const zoomScale = d3.zoomTransform(d3.select('#sc-master-group').node()).k
            // remove stroke highlight
            d3.selectAll(
                `.sc-parent-circle-${circle.data.id},.sc-circle-${circle.data.id},.sc-circle-background-${circle.data.id},.sc-circle-image-${circle.data.id}`
            )
                .transition('circles-mouse-out')
                .duration(transitionDuration / 3)
                .attr('stroke', colors.cpGrey)
                .attr('stroke-width', 1 / zoomScale)
            // fade out circle backgrounds and images
            d3.selectAll(
                `.sc-circle-background-${circle.data.id},.sc-circle-image-${circle.data.id}`
            )
                .transition('circles-fade-out')
                .duration(transitionDuration / 3)
                .attr('opacity', 0)
            // hide space info
            setShowSpaceModal(false)
            setHighlightedSpace(null)
        }
    }

    function circleClick(event, circle) {
        event.stopPropagation()
        if (!transitioning.current) {
            circleMouseOut(event, circle)
            // if main circle, navigate to post list
            if (circle.data.id === childNodes.current[0].data.id)
                history(`/s/${circle.data.handle}/posts`)
            // else, navigate to new space
            else {
                setClickedSpaceUUID(circle.data.uuid)
                history(`/s/${circle.data.handle}/spaces?lens=Circles`)
            }
        }
    }

    function createParentCircles() {
        d3.select('#sc-parent-circle-group')
            .selectAll('.sc-parent-circle')
            .data(parentNodes.current)
            .join('circle')
            .attr('id', (d) => `sc-parent-circle-${d.data.uuid}`)
            .attr('class', (d) => `sc-parent-circle sc-parent-circle-${d.data.id}`)
            .attr('r', 25)
            .attr('stroke', colors.cpGrey)
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .attr('transform', (d) => `translate(${d.x},${d.y})`)
            .attr('fill', (d) => findFill(d, 25))
            .on('mouseover', circleMouseOver)
            .on('mouseout', circleMouseOut)
            .on('click', circleClick)
            .transition()
            .duration(transitionDuration)
            .attr('opacity', 1)
    }

    function createParentCircleText() {
        d3.select('#sc-parent-circle-group')
            .selectAll('.sc-parent-text')
            .data(parentNodes.current)
            .join('text')
            .classed('sc-parent-text', true)
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
        d3.select('#sc-circle-groups')
            .selectAll('.sc-circle-group')
            .data(childNodes.current, (d) => d.data.uuid)
            .join(
                (enter) => {
                    // create group
                    const group = enter
                        .append('g')
                        .attr('id', (d) => `sc-circle-group-${d.data.uuid}`)
                        .attr('class', (d) => `sc-circle-group sc-circle-group-${d.data.id}`)
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)
                    // add circle
                    group
                        .append('circle')
                        .attr('id', (d) => `sc-circle-${d.data.uuid}`)
                        .attr('class', (d) => `sc-circle sc-circle-${d.data.id}`)
                        .attr('r', (d) => d.r)
                        .attr('stroke', colors.cpGrey)
                        .attr('stroke-width', 1)
                        .attr('opacity', 0)
                        .attr('cursor', 'pointer')
                        .attr('fill', (d) => colorScale(d.depth + 1))
                        .on('mouseover', circleMouseOver)
                        .on('mouseout', circleMouseOut)
                        .on('mousedown', () => setMouseDown(true))
                        .on('click', circleClick)
                        .call((circle) =>
                            circle
                                .transition('circle-enter')
                                .duration(transitionDuration)
                                .attr('opacity', 1)
                        )
                    // // add background for transparent images
                    // group
                    //     .append('circle')
                    //     .attr('id', (d) => `sc-circle-background-${d.data.uuid}`)
                    //     .attr(
                    //         'class',
                    //         (d) => `sc-circle-background sc-circle-background-${d.data.id}`
                    //     )
                    //     .attr('r', (d) => d.r)
                    //     .attr('fill', 'white')
                    //     .attr('stroke', colors.cpGrey)
                    //     .attr('stroke-width', 1)
                    //     .attr('pointer-events', 'none')
                    //     .attr('opacity', 0)
                    // // add image
                    // group
                    //     .append('circle')
                    //     .attr('id', (d) => `sc-circle-image-${d.data.uuid}`)
                    //     .attr('class', (d) => `sc-circle-image sc-circle-image-${d.data.id}`)
                    //     .attr('r', (d) => d.r)
                    //     .attr('stroke', colors.cpGrey)
                    //     .attr('stroke-width', 1)
                    //     .attr('pointer-events', 'none')
                    //     .attr('opacity', 0)
                    //     .attr('fill', (d) => findFill(d, d.r))
                    return group
                },
                (update) => {
                    // update group position
                    update
                        .transition('group-update')
                        .duration(transitionDuration)
                        .attr('transform', (d) => `translate(${d.x},${d.y})`)
                    // update circles
                    update
                        .select('.sc-circle')
                        .on('mouseover', circleMouseOver)
                        .on('mouseout', circleMouseOut)
                        .on('click', circleClick)
                        .transition('circle-update')
                        .duration(transitionDuration)
                        .attr('r', (d) => d.r)
                        .attr('fill', (d) => colorScale(d.depth + 1))
                    // // update backgrounds
                    // update
                    //     .select('.sc-circle-background')
                    //     .transition('circle-background-update')
                    //     .duration(transitionDuration)
                    //     .attr('r', (d) => d.r)
                    // // update images
                    // update
                    //     .select('.sc-circle-image')
                    //     .transition('circle-image-update')
                    //     .duration(transitionDuration)
                    //     .attr('r', (d) => d.r)
                    //     .attr('fill', (d) => findFill(d, d.r))
                    return update
                },
                (exit) => {
                    exit.transition('group-exit')
                        .duration(transitionDuration / 2)
                        .remove()
                    exit.select('.sc-circle')
                        .transition('circle-exit')
                        .duration(transitionDuration / 2)
                        .attr('opacity', 0)
                    return exit
                }
            )
    }

    function createCircleText() {
        d3.select('#sc-text-group')
            .selectAll('.sc-circle-text')
            .data(childNodes.current, (d) => d.data.uuid)
            .join(
                (enter) =>
                    enter
                        .append('text')
                        .attr('id', (d) => `sc-circle-text-${d.data.uuid}`)
                        .attr('class', (d) => `sc-circle-text sc-circle-text-${d.data.id}`)
                        .text((d) => findCircleText(d))
                        .attr('pointer-events', 'none')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('opacity', 0)
                        .attr('font-size', (d) => (isRoot(d) ? 24 : 16))
                        .attr('font-weight', (d) => (isRoot(d) ? 800 : 400))
                        .style('text-shadow', '0 0 3px white')
                        .attr('y', (d) => d.y - d.r - (isRoot(d) ? 25 : 15))
                        .attr('x', (d) => d.x)
                        .call((node) =>
                            node
                                .transition('text-enter')
                                .duration(transitionDuration)
                                .attr('opacity', (d) => (d.r > 30 && d.depth < 2 ? 1 : 0))
                        ),
                (update) =>
                    update.call((node) =>
                        node
                            .transition('text-update')
                            .duration(transitionDuration)
                            .attr('font-weight', (d) =>
                                d.data.id === spaceCircleData.id ? 800 : 400
                            )
                            .attr('y', (d) => d.y - d.r - (isRoot(d) ? 25 : 15))
                            .attr('x', (d) => d.x)
                            .attr('opacity', (d) => (d.r > 30 && d.depth < 2 ? 1 : 0))
                    ),
                (exit) =>
                    exit.call((node) =>
                        node
                            .transition('text-exit')
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

    function buildCanvas() {
        const svg = d3
            .select('#sc-canvas')
            .append('svg')
            .attr('id', 'sc-svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('display', 'block')
            .on('click', () => !transitioning.current && resetPosition(transitionDuration))
            .on('mousemove', (event) => {
                // keep track of mouse coordinates for space info modal
                const { pageX, pageY } = event
                const { y } = d3.select('#sc-svg').node().getBoundingClientRect()
                setMouseCoordinates({ x: pageX + 20, y: pageY + y - 332 })
            })
        // create defs
        svg.append('defs').attr('id', 'sc-imgdefs')
        // set circle radius based on screen height
        circleRadius.current = parseInt(svg.style('height'), 10) / 2 - 80
        // create groups
        const masterGroup = svg.append('g').attr('id', 'sc-master-group')
        masterGroup
            .append('g')
            .attr('id', 'sc-parent-circle-group')
            .attr('transform', `translate(${circleRadius.current},-210)`)
        masterGroup.append('g').attr('id', 'sc-circle-groups')
        masterGroup.append('g').attr('id', 'sc-text-group')
        // initiate zoom functionality (disable double click)
        svg.call(zoom).on('dblclick.zoom', null)
    }

    function findDomain(d) {
        const children = d.parent ? d.parent.children : spaceCircleData.children
        let dMin = 0
        let dMax
        if (sortBy === 'Date') {
            dMin = d3.min(children.map((child) => Date.parse(child.createdAt)))
            dMax = d3.max(children.map((child) => Date.parse(child.createdAt)))
        } else {
            dMax = d3.max(children.map((child) => child[`total${sortBy}`]))
        }
        return [dMin, dMax] // sortOrder === 'Descending' ? [dMin, dMax] : [dMax, dMin]
    }

    function findSum(d) {
        const pointScale = d3
            .scaleLinear()
            .domain(findDomain(d)) // data values spread
            .range([10, 100]) // radius size spread
        const points = sortBy === 'Date' ? Date.parse(d.createdAt) : d[`total${sortBy}`]
        return pointScale(points) > 10 ? pointScale(points) : 10
    }

    function buildNodeTrees() {
        // build parent tree nodes
        const parents = d3.hierarchy(spaceCircleData, (d) => d.DirectParentSpaces)
        const newParentNodes = d3
            .tree()
            .nodeSize([50, 130])
            .separation(() => 3)(parents)
            .descendants()
            .slice(1)
        // build circle packed child nodes
        const hierarchy = d3.hierarchy(spaceCircleData).sum((d) => findSum(d))
        const newChildNodes = d3
            .pack()
            .size([circleRadius.current * 2, circleRadius.current * 2])
            .padding(20)(hierarchy)
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
        buildNodeTrees()
        createParentCircles()
        createParentCircleText()
        createCircles()
        createCircleText()
        // mark transition complete after duration
        setTimeout(() => {
            transitioning.current = false
        }, transitionDuration)
    }

    useEffect(() => {
        buildCanvas()
        return () => setSpaceCircleData({})
    }, [])

    useEffect(() => {
        if (spaceCircleData.id) buildTree()
    }, [spaceCircleData])

    return (
        <div id='sc-canvas' className={styles.canvas}>
            {showSpaceModal && highlightedSpace && !mouseDown && (
                <Column
                    className={styles.spaceInfoModal}
                    style={{ top: mouseCoordinates.y, left: mouseCoordinates.x }}
                >
                    <div className={styles.pointer} />
                    <Row className={styles.header}>
                        <FlagImage
                            type='space'
                            imagePath={highlightedSpace.flagImagePath}
                            size={38}
                            style={{ marginRight: 8 }}
                        />
                        <Column>
                            <Row centerY className={styles.title}>
                                {highlightedSpace.privacy === 'private' && <LockIcon />}
                                <h1>{highlightedSpace.name}</h1>
                            </Row>
                            <h2>s/{highlightedSpace.handle}</h2>
                        </Column>
                    </Row>
                    {highlightedSpace.expander ? (
                        <h2 style={{ marginTop: 5 }}>Click to expand</h2>
                    ) : (
                        <>
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

export default SpaceCircles

// function hasMatchingAncestor(circle, selectedCircle) {
//     // recursively check parents for selectedCircle
//     if (!circle.parent) return false
//     if (circle.parent.data.id === selectedCircle.data.id) return true
//     return hasMatchingAncestor(circle.parent, selectedCircle)
// }

// // zoom to new circle
// const svg = d3.select('#sc-svg')
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
//         // buildTree(spaceCircleData)
//         // transitioning.current = false
//     })
