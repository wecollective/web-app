/* eslint-disable no-param-reassign */
import React, { useContext, useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import axios from 'axios'
import { SpaceContext } from '@contexts/SpaceContext'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/pages/SpacePage/SpacePagePostMap.module.scss'
import colors from '@styles/Colors.module.scss'
import Column from '@components/Column'
import Modal from '@components/Modal'
import PostCard from '@components/Cards/PostCard/PostCard'
import LoadingWheel from '@components/LoadingWheel'
import config from '@src/Config'
import { IPost } from '@src/Interfaces'

const SpacePagePostMap = (props: { postMapData: any; params: any }): JSX.Element => {
    const { postMapData, params } = props
    const { accountData } = useContext(AccountContext)
    const { spaceData, setPostMapData, getPostMapData } = useContext(SpaceContext)
    const { sortBy, sortOrder } = params
    const [selectedPost, setSelectedPost] = useState<any>(null)
    const [postModalOpen, setPostModalOpen] = useState(false)
    const defaultGravity = 30
    const [gravity, setGravity] = useState(defaultGravity)
    const [showKey, setShowKey] = useState(false)
    const [totalMatchingPosts, setTotalMatchingPosts] = useState(0)
    const [firstRun, setFirstRun] = useState(true)
    const [showNoPostsMessage, setShowNoPostsMessage] = useState(false)
    const width = '100%'
    const height = window.innerHeight - (window.innerWidth < 1500 ? 250 : 330)
    const arrowPoints = 'M 0 0 6 3 0 6 1.5 3'
    const gravitySlider = useRef<HTMLInputElement>(null)
    const gravityInput = useRef<HTMLInputElement>(null)

    function openPostModal(postId) {
        setSelectedPost(null)
        setPostModalOpen(true)
        axios
            .get(`${config.apiURL}/post-data?accountId=${accountData.id}&postId=${postId}`)
            .then((res) => setSelectedPost(res.data))
    }

    function findDomain() {
        let dMin = 0
        let dMax
        if (sortBy === 'Reactions')
            dMax = d3.max(postMapData.posts.map((post: any) => post.totalReactions))
        if (sortBy === 'Likes') dMax = d3.max(postMapData.posts.map((post: any) => post.totalLikes))
        if (sortBy === 'Reposts')
            dMax = d3.max(postMapData.posts.map((post: any) => post.totalReposts))
        if (sortBy === 'Ratings')
            dMax = d3.max(postMapData.posts.map((post: any) => post.totalRatings))
        if (sortBy === 'Comments')
            dMax = d3.max(postMapData.posts.map((post: any) => post.totalComments))
        if (sortBy === 'Date') {
            dMin = d3.min(postMapData.posts.map((post: IPost) => Date.parse(post.createdAt)))
            dMax = d3.max(postMapData.posts.map((post: IPost) => Date.parse(post.createdAt)))
        }
        let domainMin
        let domainMax
        if (sortOrder === 'Descending') {
            domainMin = dMin
            domainMax = dMax
        }
        if (sortOrder === 'Ascending') {
            domainMin = dMax
            domainMax = dMin
        }
        return [domainMin, domainMax]
    }

    function findRadius(d) {
        const radiusScale = d3
            .scaleLinear()
            .domain(findDomain()) // data values spread
            .range([20, 60]) // radius size spread

        let radius
        if (sortBy === 'Reactions') radius = d.totalReactions
        if (sortBy === 'Likes') radius = d.totalLikes
        if (sortBy === 'Reposts') radius = d.totalReposts
        if (sortBy === 'Ratings') radius = d.totalRatings
        if (sortBy === 'Comments') radius = d.totalComments
        if (sortBy === 'Date') radius = Date.parse(d.createdAt)

        return radiusScale(radius)
    }

    function findFill(d) {
        if (d.urlImage || d.type === 'image') {
            const existingImage = d3.select(`#image-${d.id}`)
            if (existingImage.node()) {
                // scale and reposition existing image
                existingImage
                    .transition()
                    .duration(1000)
                    .attr('height', findRadius(d) * 2)
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
                    .attr('height', findRadius(d) * 2)
                    .attr('xlink:href', d.urlImage || d.PostImages[0].url)
                    .on('error', () => {
                        const newImage = d3.select(`#image-${d.id}`)
                        // try image proxy
                        if (!newImage.attr('xlink:href').includes('//images.weserv.nl/')) {
                            newImage.attr(
                                'xlink:href',
                                `//images.weserv.nl/?url=${d.urlImage || d.PostImages[0].url}`
                            )
                        } else {
                            // fall back on placeholder
                            newImage.attr(
                                'xlink:href',
                                '/images/placeholders/broken-image-left.jpg'
                            )
                        }
                    })
            }
            // return pattern url
            return `url(#pattern-${d.id})`
        }
        // return color based on post type
        if (d.type === 'url') {
            return colors.yellow
        }
        if (d.type === 'audio') {
            return colors.orange
        }
        if (d.type === 'event') {
            return colors.red
        }
        if (d.type === 'string') {
            return colors.lightBlue
        }
        // if (d.type === 'poll') {
        //     return colors.red
        // }
        if (d.type === 'text') {
            return colors.green
        }
        // if (d.type === 'prism') {
        //     return colors.purple
        // }
        if (d.type === 'glass-bead-game') {
            return colors.blue
        }
        if (d.type === 'weave') {
            return colors.aqua
        }
        // if (d.type === 'plot-graph') {
        //     return colors.orange
        // }
        return null
    }

    function findStroke(d) {
        if (d.accountLike || d.accountRepost || d.accountRating || d.accountLink) return '#83b0ff'
        return 'rgb(140 140 140)'
    }

    function createLinkData(posts, linkType) {
        interface ILinkData {
            source: number
            target: number
        }
        const linkData = [] as ILinkData[]
        posts.forEach((post, postIndex) => {
            post.OutgoingLinks.forEach((link) => {
                let targetIndex = null
                posts.forEach((p, i) => {
                    if (p.id === link.PostB.id) targetIndex = i
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

    const zoom = d3.zoom().on('zoom', () => {
        d3.select('#post-map-master-group').attr('transform', d3.event.transform)
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
        d3.select('body').on('keydown', () => {
            if (d3.event.keyCode === 80) {
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

    function trimText(text) {
        const t = text.substring(0, 20)
        return text.length > 20 ? t.concat('...') : t
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

        function dragStarted(d) {
            const node = d3.select(`#post-map-node-${d.id}`)
            node.classed('active-drag', true)
            if (!d3.event.active) {
                d.fx = d.x
                d.fy = d.y
            }
            simulation.alpha(1)
        }

        function dragged(d) {
            d.fx = d3.event.x
            d.fy = d3.event.y
        }

        function dragEnded(d) {
            const node = d3.select(`#post-map-node-${d.id}`)
            node.classed('active-drag', false)
            if (!d3.event.active && !node.classed('pinned')) {
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
                        .on('click', (e) => {
                            simulation.alpha(1)
                            openPostModal(e.id)
                            d3.selectAll('.post-map-node')
                                .transition()
                                .duration(200)
                                .style('stroke-width', 2)
                            d3.select(d3.event.target)
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
                            if (d.text) return trimText(d.text)
                            if (d.type === 'url' && !d.urlImage)
                                return trimText(d.text || d.urlTitle || d.urlDescription || '')
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

    useEffect(() => createCanvas(), [])

    useEffect(() => {
        if (firstRun) setFirstRun(false)
        else {
            if (postMapData.posts.length) setShowNoPostsMessage(false)
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
            postMapData.posts.forEach((post) => {
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
            setTotalMatchingPosts(postMapData.totalMatchingPosts)
            updateMap(postMapData.posts)
        }
    }, [postMapData])

    useEffect(() => () => setPostMapData({}), [])

    return (
        <div className={styles.postMapWrapper}>
            <div className={styles.controlsWrapper}>
                <div className={styles.controls}>
                    <div className={styles.item}>
                        Showing {postMapData.posts ? postMapData.posts.length : 0} of{' '}
                        {totalMatchingPosts} posts
                        <div
                            className='blueText ml-10'
                            role='button'
                            tabIndex={0}
                            onClick={() => getPostMapData(spaceData.id, params, totalMatchingPosts)}
                            onKeyDown={() =>
                                getPostMapData(spaceData.id, params, totalMatchingPosts)
                            }
                        >
                            load all
                        </div>
                    </div>
                    <div className={styles.item}>
                        <span className={styles.gravityText}>Gravity:</span>
                        {/* todo: add regex to gavity input */}
                        <input
                            ref={gravitySlider}
                            id='gravity-slider'
                            className={styles.gravitySlider}
                            type='range'
                            value={gravity}
                            min='-50'
                            max='150'
                            onChange={() => {
                                const { current } = gravitySlider
                                if (current) {
                                    setGravity(+current.value)
                                }
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
                    </div>
                </div>
                <div className={styles.key}>
                    <div
                        role='button'
                        tabIndex={0}
                        onClick={() => setShowKey(!showKey)}
                        onKeyDown={() => setShowKey(!showKey)}
                    >
                        <img
                            className={styles.keyButton}
                            src='/icons/key-solid.svg'
                            aria-label='key'
                        />
                    </div>
                    {showKey && (
                        <div className={styles.keyItems}>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>No Account Reaction</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ border: '2px solid rgb(140 140 140)' }}
                                />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Account Reaction</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ border: '2px solid #83b0ff' }}
                                />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Text Link</span>
                                <div className={styles.textLink} />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Turn Link</span>
                                <div className={styles.turnLink} />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Text</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ backgroundColor: colors.green }}
                                />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Url</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ backgroundColor: colors.yellow }}
                                />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Poll</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ backgroundColor: colors.red }}
                                />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Glass Bead</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ backgroundColor: colors.blue }}
                                />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Prism</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ backgroundColor: colors.purple }}
                                />
                            </div>
                            <div className={styles.postMapKeyItem}>
                                <span className={styles.text}>Plot Graph</span>
                                <div
                                    className={styles.colorBox}
                                    style={{ backgroundColor: colors.orange }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div id='canvas' />
            {postModalOpen && (
                <Modal centered close={() => setPostModalOpen(false)} style={{ width: 900 }}>
                    {selectedPost ? (
                        <PostCard location='post-page' post={selectedPost} />
                    ) : (
                        <LoadingWheel />
                    )}
                </Modal>
            )}
            {showNoPostsMessage && (
                <Column className={styles.noPostsMessage}>
                    <p>No posts yet that match those setting...</p>
                </Column>
            )}
        </div>
    )
}

export default SpacePagePostMap
