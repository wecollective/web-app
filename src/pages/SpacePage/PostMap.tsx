/* eslint-disable no-param-reassign */
import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import PostCard from '@components/cards/PostCard/PostCard'
import Modal from '@components/modals/Modal'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { getDraftPlainText, trimText } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/pages/SpacePage/PostMap.module.scss'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

function PostMap(props: { postMapData: any; params: any }): JSX.Element {
    const { postMapData, params } = props
    const { spaceData, setPostMapData, getPostMapData, postMapOffset, setPostMapOffset } =
        useContext(SpaceContext)
    const { totalPosts, posts } = postMapData
    const { filter, sortBy } = params
    const [selectedPost, setSelectedPost] = useState<any>(null)
    const [postModalOpen, setPostModalOpen] = useState(false)
    const defaultGravity = 30
    const [gravity, setGravity] = useState(defaultGravity)
    // const [totalPosts, setTotalPosts] = useState(0)
    const [firstRun, setFirstRun] = useState(true)
    const [showNoPostsMessage, setShowNoPostsMessage] = useState(false)
    const width = '100%'
    const height = window.innerHeight - 165
    const arrowPoints = 'M 0 0 6 3 0 6 1.5 3'
    const gravitySlider = useRef<HTMLInputElement>(null)
    const gravityInput = useRef<HTMLInputElement>(null)
    const cookies = new Cookies()

    function openPostModal(postId) {
        setSelectedPost(null)
        setPostModalOpen(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(`${config.apiURL}/post-data?postId=${postId}`, options)
            .then((res) => setSelectedPost(res.data))
            .catch((error) => console.log(error))
    }

    function findDomain() {
        let dMin = 0
        let dMax
        if (filter === 'New') {
            dMin = d3.min(posts.map((post) => Date.parse(post.createdAt)))
            dMax = d3.max(posts.map((post) => Date.parse(post.createdAt)))
        } else if (filter === 'Active') {
            dMin = d3.min(posts.map((post) => Date.parse(post.lastActivity)))
            dMax = d3.max(posts.map((post) => Date.parse(post.lastActivity)))
        } else if (sortBy === 'Signal') dMax = d3.max(posts.map((child) => child.totalRatings))
        else dMax = d3.max(posts.map((child) => child[`total${sortBy}`]))
        return [dMin, dMax]
    }

    function findRadius(d) {
        const radiusScale = d3
            .scaleLinear()
            .domain(findDomain()) // data values spread
            .range([20, 60]) // radius size spread
        let radius
        if (filter === 'New') radius = Date.parse(d.createdAt)
        else if (filter === 'Active') radius = Date.parse(d.lastActivity)
        else if (sortBy === 'Signal') radius = d.totalRatings
        else radius = d[`total${sortBy}`]
        return radiusScale(radius)
    }

    function findFill(d) {
        if (d.image) {
            const existingImage = d3.select(`#image-${d.id}`)
            const newScale = findRadius(d) * 2
            if (existingImage.node()) {
                // scale and reposition existing image
                existingImage
                    .transition()
                    .duration(1000)
                    .attr('height', newScale)
                    .attr('width', newScale)
            } else {
                // create new pattern
                const pattern = d3
                    .select('#image-defs')
                    .append('pattern')
                    .attr('id', `pattern-${d.id}`)
                    .attr('height', 1)
                    .attr('width', 1)
                // append new image to pattern
                pattern
                    .append('image')
                    .attr('id', `image-${d.id}`)
                    .attr('height', newScale)
                    .attr('width', newScale)
                    .attr('preserveAspectRatio', 'xMidYMid slice')
                    .attr('xlink:href', d.image)
                    .on('error', () => {
                        const newImage = d3.select(`#image-${d.id}`)
                        // try image proxy
                        if (!newImage.attr('xlink:href').includes('//images.weserv.nl/')) {
                            newImage.attr('xlink:href', `//images.weserv.nl/?url=${d.image}`)
                        } else {
                            // fall back on placeholder
                            newImage.attr(
                                'xlink:href',
                                `${config.publicAssets}/images/placeholders/broken-image-left.jpg`
                            )
                        }
                    })
            }
            // return pattern url
            return `url(#pattern-${d.id})`
        }
        // todo: handle multiple media types
        // return color based on post type
        let color = colors.green
        if (d.mediaTypes.includes('url')) color = colors.aqua
        if (d.mediaTypes.includes('audio')) color = colors.orange
        if (d.mediaTypes.includes('event')) color = colors.red
        if (d.mediaTypes.includes('poll')) color = colors.purple
        if (d.mediaTypes.includes('glass-bead-game')) color = colors.blue
        if (d.mediaTypes.includes('card')) color = colors.yellow
        return color
    }

    function findStroke(d) {
        if (d.accountLike || d.accountRepost || d.accountRating || d.accountLink) return '#83b0ff'
        return 'rgb(140 140 140)'
    }

    function createLinkData(nodes, linkType) {
        interface ILinkData {
            source: number
            target: number
        }
        const linkData = [] as ILinkData[]
        nodes.forEach((post, postIndex) => {
            post.OutgoingPostLinks.forEach((link) => {
                let targetIndex = null
                nodes.forEach((p, i) => {
                    if (p.id === link.OutgoingPost.id) targetIndex = i
                })
                if (targetIndex !== null) {
                    const data = {
                        source: postIndex,
                        target: targetIndex,
                        description: link.description,
                    }
                    linkData.push(data)
                }
            })
        })
        return linkData
    }

    const zoom = d3.zoom().on('zoom', (event) => {
        d3.select('#post-map-master-group').attr('transform', event.transform)
    })

    function createCanvas() {
        d3.select('#canvas')
            .append('svg')
            .attr('id', 'post-map-svg')
            .attr('width', width)
            .attr('height', height)

        // create defs
        d3.select('#post-map-svg').append('defs').attr('id', 'image-defs')

        // create text link arrow
        d3.select('#post-map-svg')
            .append('defs')
            .attr('id', 'text-link-arrow-defs')
            .append('marker')
            .attr('id', 'text-link-arrow')
            .attr('refX', 5)
            .attr('refY', 3)
            .attr('markerWidth', 40)
            .attr('markerHeight', 40)
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', arrowPoints)
            .style('fill', 'black')

        // create turn link arrow (currently === text link arrow)
        d3.select('#post-map-svg')
            .append('defs')
            .attr('id', 'turn-link-arrow-defs')
            .append('marker')
            .attr('id', 'turn-link-arrow')
            .attr('refX', 5)
            .attr('refY', 3)
            .attr('markerWidth', 40)
            .attr('markerHeight', 40)
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', arrowPoints)
            .style('fill', 'black')

        // create master group
        d3.select('#post-map-svg').append('g').attr('id', 'post-map-master-group')

        // create node group
        d3.select('#post-map-master-group').append('g').attr('id', 'post-map-node-group')

        // create link group
        d3.select('#post-map-master-group').append('g').attr('id', 'post-map-link-group')

        // create zoom listener and set initial position
        d3.select('#post-map-svg').call(zoom)
        d3.select('#post-map-svg').call(
            zoom.transform,
            d3.zoomIdentity.scale(1).translate(+width / 2, height / 2)
        )

        // listen for 'p' keypress during node drag to pin or unpin selected node
        d3.select('body').on('keydown', (event) => {
            if (event.keyCode === 80) {
                const activeDrag = d3.select('.active-drag')
                if (activeDrag.node()) {
                    if (activeDrag.classed('pinned')) {
                        activeDrag.classed('pinned', false)
                    } else {
                        activeDrag.classed('pinned', true)
                    }
                }
            }
        })

        d3.select('#canvas').style('width', width)
        d3.select('#post-map-svg').attr('width', width)
        const newWidth = parseInt(d3.select('#post-map-svg').style('width'), 10)

        // todo: smoothly transition size and scale
        // d3.select('#post-map-svg').call(zoom.transform, d3.zoomIdentity.scale(scale).translate(newWidth/scale/2,height/scale/2))

        d3.select('#post-map-svg').call(
            zoom.transform,
            d3.zoomIdentity.scale(1).translate(newWidth / 2, height / 2)
        )
    }

    function repositionMap(data) {
        // work out total node area
        const areaValues = [] as number[]
        data.forEach((d) => {
            const radius = findRadius(d) + 5
            const area = radius * radius * Math.PI
            areaValues.push(area)
        })
        const totalArea = areaValues.reduce((a, b) => a + b, 0)
        // calculate required viewport scale from total area
        let scale
        if (totalArea === 0) scale = 1
        else scale = 30000 / totalArea + 0.4 // + 0.5
        // return map to default position at required scale
        const svgWidth = parseInt(d3.select('#post-map-svg').style('width'), 10)
        d3.select('#post-map-svg')
            .transition()
            .duration(2000)
            .call(
                zoom.transform,
                d3.zoomIdentity.scale(scale).translate(svgWidth / scale / 2, height / scale / 2)
            )
    }

    function formatText(text) {
        return trimText(getDraftPlainText(text), 20)
    }

    function updateMap(data) {
        setGravity(defaultGravity)
        repositionMap(data)

        const textLinkData = createLinkData(data, 'text')
        // const turnLinkData = createLinkData(data, 'turn')

        function updateLink(link) {
            function fixna(x) {
                if (Number.isFinite(x)) return x
                return 0
            }
            link.attr(
                'd',
                (d) =>
                    `M${fixna(d.source.x)} ${fixna(d.source.y)} L${fixna(d.target.x)} ${fixna(
                        d.target.y
                    )}`
            )
        }

        function updateSimulation() {
            d3.selectAll('.post-map-node')
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y)

            d3.selectAll('.post-map-node-text')
                .attr('text-anchor', 'middle')
                .attr('x', (d) => d.x)
                .attr('y', (d) => d.y)

            d3.selectAll('.post-map-text-link').call(updateLink)
        }

        const simulation = d3
            .forceSimulation(data)
            .force(
                'collide',
                d3
                    .forceCollide()
                    .strength(0.9)
                    .radius((d) => findRadius(d) + 5)
                    .iterations(10)
            )
            .force(
                'charge',
                d3.forceManyBody().strength((d) => -findRadius(d) * 8)
            )
            .force('x', d3.forceX(0).strength(gravity / 500)) // (50 / 500 = 0.1)
            .force('y', d3.forceY(0).strength(gravity / 500))
            .force('textLinks', d3.forceLink().links(textLinkData).strength(0.05))
            // .force('turnLinks', d3.forceLink().links(turnLinkData).strength(0.09))
            .alpha(1)
            .alphaTarget(0)
            .alphaMin(0.01)
            .alphaDecay(0.002)
            .velocityDecay(0.7)
            .nodes(data)
            .on('tick', updateSimulation)

        function dragStarted(event, d) {
            const node = d3.select(`#post-map-node-${d.id}`)
            node.classed('active-drag', true)
            if (!event.active) {
                d.fx = d.x
                d.fy = d.y
            }
            simulation.alpha(1)
        }

        function dragged(event, d) {
            d.fx = event.x
            d.fy = event.y
        }

        function dragEnded(event, d) {
            const node = d3.select(`#post-map-node-${d.id}`)
            node.classed('active-drag', false)
            if (!event.active && !node.classed('pinned')) {
                d.fx = null
                d.fy = null
            }
            simulation.alpha(1)
        }

        // connect simulation gravity to slider
        d3.select('#gravity-slider').on('input', () => {
            const { current } = gravitySlider
            if (current) {
                simulation.force('x').strength(+current.value / 500)
                simulation.force('y').strength(+current.value / 500)
                simulation.alpha(1)
            }
        })
        d3.select('#gravity-input').on('input', () => {
            const { current } = gravityInput
            if (current) {
                simulation.force('x').strength(+current.value / 500)
                simulation.force('y').strength(+current.value / 500)
                simulation.alpha(1)
            }
        })

        // reaheat simulation on svg click
        d3.select('#post-map-svg').on('click', () => simulation.alpha(1))

        // create nodes
        d3.select('#post-map-node-group')
            .selectAll('.post-map-node')
            .data(data, (d) => d.id)
            .join(
                (enter) =>
                    enter
                        .append('circle')
                        .classed('post-map-node', true)
                        .attr('id', (d) => `post-map-node-${d.id}`)
                        .attr('r', findRadius)
                        .style('fill', findFill)
                        .style('stroke', findStroke)
                        .style('stroke-width', 2)
                        .attr('opacity', 0)
                        .on('click', (event, d) => {
                            simulation.alpha(1)
                            openPostModal(d.id)
                            d3.selectAll('.post-map-node')
                                .transition()
                                .duration(200)
                                .style('stroke-width', 2)
                            d3.select(event.target)
                                .transition()
                                .duration(200)
                                .style('stroke-width', 6)
                        })
                        .call(
                            d3
                                .drag()
                                .on('start', dragStarted)
                                .on('drag', dragged)
                                .on('end', dragEnded)
                        )
                        .call((node) => node.transition().duration(1000).attr('opacity', 1)),
                (update) =>
                    update.call((node) =>
                        node
                            .transition()
                            .duration(1000)
                            .attr('r', findRadius)
                            .style('fill', findFill)
                    ),
                (exit) =>
                    exit.call((node) =>
                        node
                            .transition()
                            .duration(1000)
                            .attr('opacity', 0)
                            .attr('r', 0)
                            .remove()
                            .on('end', (d) => d3.select(`#pattern-${d.id}`).remove())
                    )
            )

        // create text
        d3.select('#post-map-node-group')
            .selectAll('.post-map-node-text')
            .data(data, (d) => d.id)
            .join(
                (enter) =>
                    enter
                        .append('text')
                        .classed('post-map-node-text', true)
                        .text((d) => {
                            if (d.title) return formatText(d.title)
                            if (d.text) return formatText(d.text)
                            return null
                        })
                        .attr('opacity', 0)
                        .attr('pointer-events', 'none')
                        .on('click', (e) => {
                            setSelectedPost(data.find((post) => post.id === e.id))
                            d3.selectAll('.post-map-node')
                                .transition()
                                .duration(200)
                                .style('stroke-width', 2)
                            d3.select(`#post-map-node-${e.id}`)
                                .transition()
                                .duration(200)
                                .style('stroke-width', 6)
                        })
                        .call((node) => node.transition().duration(1000).attr('opacity', 1)),
                (update) => update.call((node) => node.transition().duration(1000)),
                (exit) =>
                    exit.call((node) =>
                        node.transition().duration(1000).attr('opacity', 0).remove()
                    )
            )

        // create links
        d3.select('#post-map-link-group')
            .selectAll('.post-map-text-link')
            .data(textLinkData)
            .join(
                (enter) =>
                    enter
                        .append('path')
                        .classed('post-map-text-link', true)
                        .attr('id', (d) => `link-${d.source.id}`)
                        .attr('stroke', 'black')
                        .attr('stroke-width', '3px')
                        .attr('marker-end', 'url(#text-link-arrow)')
                        .attr('opacity', 0)
                        .call((node) => node.transition().duration(1000).attr('opacity', 1)),
                (update) => update.call((node) => node.transition().duration(1000)),
                (exit) =>
                    exit.call((node) =>
                        node.transition().duration(1000).attr('opacity', 0).remove()
                    )
            )

        // create link text
        d3.select('#post-map-link-group')
            .selectAll('.post-map-link-text')
            .data(textLinkData)
            .join(
                (enter) =>
                    enter
                        .append('text')
                        .classed('post-map-link-text', true)
                        .attr('dy', -5)
                        .append('textPath')
                        .classed('textPath', true)
                        .text((d) => d.description)
                        .attr('text-anchor', 'middle')
                        .attr('startOffset', '50%')
                        .attr('href', (d) => `#link-${d.source.id}`)
                        .attr('opacity', 0)
                        .call((node) => node.transition().duration(1000).attr('opacity', 1)),
                (update) => update.call((node) => node.transition().duration(1000)),
                (exit) =>
                    exit.call((node) =>
                        node.transition().duration(1000).attr('opacity', 0).remove()
                    )
            )
    }

    useEffect(() => {
        createCanvas()
        return () => {
            setPostMapOffset(0)
            setPostMapData({ totalPosts: 0, posts: [] })
        }
    }, [])

    useEffect(() => {
        if (firstRun) setFirstRun(false)
        else {
            if (posts.length) setShowNoPostsMessage(false)
            else setShowNoPostsMessage(true)
            // store previous node positions
            interface INodePosition {
                id: number
                x: number
                y: number
                vx: number
                vy: number
            }
            const previousNodePositions = [] as INodePosition[]
            d3.selectAll('.post-map-node').each((d) => {
                previousNodePositions.push({
                    id: d.id,
                    x: d.x,
                    y: d.y,
                    vx: d.vx,
                    vy: d.vy,
                })
            })
            // add previous positions to matching new nodes
            posts.forEach((post) => {
                const match = previousNodePositions.find((node) => node.id === post.id)
                if (match) {
                    post.x = match.x
                    post.y = match.y
                    post.vx = match.vx
                    post.vy = match.vy
                } else {
                    // if no match randomise starting position outside of viewport
                    const randomX = (Math.random() - 0.5) * 5000
                    const randomY = (Math.random() - 0.5) * 5000
                    post.x = randomX > 0 ? randomX + 200 : randomX - 200
                    post.y = randomY > 0 ? randomY + 200 : randomY - 200
                }
            })
            updateMap(posts)
        }
    }, [postMapData])

    return (
        <Column centerX className={styles.wrapper}>
            <Column className={styles.controls}>
                <Row style={{ marginBottom: 10 }}>
                    <p>
                        Showing {posts.length} of {totalPosts} posts
                    </p>
                    {totalPosts > posts.length && (
                        <button
                            type='button'
                            className={styles.loadMore}
                            onClick={() => getPostMapData(spaceData.id, postMapOffset, params)}
                        >
                            load more
                        </button>
                    )}
                </Row>
                <Row centerY>
                    <p>Gravity:</p>
                    <input
                        ref={gravitySlider}
                        id='gravity-slider'
                        className={styles.gravitySlider}
                        type='range'
                        value={gravity}
                        min='-50'
                        max='150'
                        onChange={() => {
                            if (gravitySlider.current) setGravity(+gravitySlider.current.value)
                        }}
                    />
                    <input
                        ref={gravityInput}
                        id='gravity-input'
                        className={styles.gravityInput}
                        value={gravity}
                        type='number'
                        onChange={(e) => setGravity(+e.target.value)}
                    />
                </Row>
            </Column>
            <div id='canvas' />
            {postModalOpen && (
                <Modal
                    centerX
                    close={() => setPostModalOpen(false)}
                    style={{ width: '100vw', maxWidth: 900 }}
                >
                    {selectedPost ? (
                        <PostCard
                            location='space-post-map'
                            post={selectedPost}
                            setPost={() => console.error('TODO')}
                            onDelete={() => console.error('TODO')}
                        />
                    ) : (
                        <LoadingWheel />
                    )}
                </Modal>
            )}
            {showNoPostsMessage && (
                <Column className={styles.noPosts}>
                    <p>No posts yet that match those setting...</p>
                </Column>
            )}
        </Column>
    )
}

export default PostMap
