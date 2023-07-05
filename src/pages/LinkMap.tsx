/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */

import Button from '@components/Button'
import Column from '@components/Column'
import DropDown from '@components/DropDown'
import DropDownMenu from '@components/DropDownMenu'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import Row from '@components/Row'
import CommentCard from '@components/cards/Comments/CommentCard'
import HorizontalSpaceCard from '@components/cards/HorizontalSpaceCard'
import PostCard from '@components/cards/PostCard/PostCard'
import VerticalUserCard from '@components/cards/VerticalUserCard'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { currentState, getDraftPlainText, pluralise } from '@src/Helpers'
import LoadingWheel from '@src/components/LoadingWheel'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/pages/LinkMap.module.scss'
import { ArrowDownIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'

function LinkMap(): JSX.Element {
    const location = useLocation()
    const history = useNavigate()
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const { loggedIn, accountData, setLogInModalOpen } = useContext(AccountContext)
    const [linkData, setLinkData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [createLinkLoading, setCreateLinkLoading] = useState(false)
    const [targetType, setTargetType] = useState('Post')
    const [targetIdentifier, setTargetIdentifier] = useState('')
    const [linkDescription, setLinkDescription] = useState('')
    const [target, setTarget] = useState<any>(null)
    const [targetNotFound, setTargetNotFound] = useState(false)
    const [targetError, setTargetError] = useState(false)
    const [targetOptions, setTargetOptions] = useState<any>(null)
    const [linkTypes, setLinkTypes] = useState('All Types')
    const [sizeBy, setSizeBy] = useState('Likes')
    const [clickedSpaceUUID, setClickedSpaceUUID] = useState('')
    const svgSize = useRef(0)
    const transitioning = useRef(true)
    const domain = useRef<number[]>([0, 0])
    const links = useRef<any>(null)
    const nodes = useRef<any>(null)
    const matchedNodeIds = useRef<number[]>([])
    const cookies = new Cookies()
    const headerText =
        linkData && linkData.item
            ? `${linkData.item.totalLinks} link${pluralise(linkData.item.totalLinks)}`
            : 'No links yet...'
    // settings
    const curvedLinks = false
    const duration = 1000

    function getLinks() {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const params = `?itemType=${urlParams.item}&itemId=${urlParams.id}`
        console.log('getLinks params: ', params)
        axios
            .get(`${config.apiURL}/links${params}`, options)
            .then((res) => {
                setLinkData(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function renderItem(item, type) {
        if (type === 'post') return <PostCard post={item} location='link-modal' />
        if (type === 'comment')
            return (
                <CommentCard
                    comment={item}
                    highlighted={false}
                    location='link-map'
                    toggleReplyInput={() => null}
                    removeComment={() => null}
                    editComment={() => null}
                    updateCommentReactions={() => null}
                />
            )
        if (type === 'user') return <VerticalUserCard user={item} style={{ flexGrow: 0 }} />
        if (type === 'space') return <HorizontalSpaceCard space={item} />
        return null
    }

    function getTarget(identifier) {
        const type = targetType.toLowerCase()
        if (['post', 'comment'].includes(type)) {
            setTargetNotFound(false)
            const options = {
                headers: { Authorization: `Bearer ${cookies.get('accessToken')}` },
            }
            axios
                .get(`${config.apiURL}/${type}-data?${type}Id=${identifier}`, options)
                .then((res) => {
                    if (identifier === currentState(setTargetIdentifier)) setTarget(res.data)
                })
                .catch((error) => {
                    if (error.response.status === 404) {
                        if (identifier === currentState(setTargetIdentifier)) {
                            setTargetNotFound(true)
                            setTarget(null)
                        }
                    } else console.log(error)
                })
        } else {
            const data = { query: identifier, blacklist: [] }
            axios
                .post(`${config.apiURL}/find-${type === 'user' ? 'people' : 'spaces'}`, data)
                .then((res) => setTargetOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function createLink() {
        setCreateLinkLoading(true)
        const data = {
            sourceType: linkData.item.modelType,
            sourceId: linkData.item.id,
            targetType: targetType.toLowerCase(),
            targetId: target.id,
            description: linkDescription,
            accountHandle: accountData.handle,
            accountName: accountData.name,
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/add-link`, data, options)
            .then((res) => {
                console.log('add-link: ', res.data)
                setTargetIdentifier('')
                setLinkDescription('')
                setTarget(null)
                const newNode = {
                    item: {
                        uuid: uuidv4(),
                        modelType: targetType.toLowerCase(),
                        direction: 'outgoing',
                        totalLikes: target.totalLikes || 0,
                        totalLinks: target.totalLinks || 0,
                        ...target,
                    },
                    Link: { uuid: uuidv4(), ...res.data },
                }
                console.log('newNode: ', newNode)
                setLinkData({
                    item: { ...linkData.item, children: [newNode, ...linkData.item.children] },
                })
                setCreateLinkLoading(false)
            })
            .catch((error) => {
                console.log(error)
                if (error.response && error.response.status === 404) {
                    setTargetError(true)
                    setCreateLinkLoading(false)
                }
            })
    }

    // function removeLink(direction, type, linkId, itemId) {
    //     const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
    //     axios
    //         .post(`${config.apiURL}/remove-link`, { linkId }, options)
    //         .then((res) => {
    //             // update modal context
    //             const linkArray = `${direction === 'to' ? 'Outgoing' : 'Incoming'}${type}Links`
    //             setLinkData({
    //                 ...linkData,
    //                 [linkArray]: [...linkData[linkArray].filter((l) => l.id !== linkId)],
    //             })
    //             // update context state
    //             updateContextState('remove-link', type, itemId)
    //         })
    //         .catch((error) => console.log(error))
    // }

    const zoom = d3.zoom().on('zoom', (event) => {
        // scale master group
        d3.select('#master-group').attr('transform', event.transform)
        // scale circle and text attributes
        const scale = event.transform.k
        d3.selectAll('.node-text').attr('font-size', 10 / scale)
        d3.selectAll('.node-text').each((d) =>
            d3.select(`#node-text-${d.data.item.uuid}`).text(findNodeText(d, scale))
        )
        d3.selectAll('.link-text').attr('font-size', 10 / scale)
    })

    function resetPosition() {
        d3.select('#link-map-svg')
            .transition('reset-position')
            .duration(1000)
            .call(
                zoom.transform,
                d3.zoomIdentity.translate(svgSize.current / 2, svgSize.current / 2)
            )
    }

    function buildCanvas() {
        // calculate svg size from canvas dimensions
        const canvas = d3.select('#link-map-canvas')
        const width = parseInt(canvas.style('width'), 10)
        const height = parseInt(canvas.style('height'), 10)
        if (window.innerWidth < 1200) svgSize.current = width
        else svgSize.current = width > height ? height : width
        const svg = canvas
            .append('svg')
            .attr('id', 'link-map-svg')
            .attr('width', svgSize.current)
            .attr('height', svgSize.current)
        // set up groups and create background rings
        const masterGroup = svg.append('g').attr('id', 'master-group')
        const rings = masterGroup.append('g').attr('id', 'background-rings')
        const ringScale = (svgSize.current - 70) / 6
        const ringSizes = [ringScale, ringScale * 2, ringScale * 3]
        ringSizes.forEach((ringSize, i) => {
            rings
                .append('circle')
                .attr('r', ringSize)
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('opacity', 0.1)
            // .attr('opacity', 0.3 - i / 10)
        })
        masterGroup.append('g').attr('id', 'links')
        masterGroup.append('g').attr('id', 'nodes')
        // set up zoom
        svg.call(zoom).on('dblclick.zoom', null)
        svg.call(
            zoom.transform,
            d3.zoomIdentity.translate(svgSize.current / 2, svgSize.current / 2)
        )
        svg.on('click', () => {
            resetPosition()
            setTimeout(() => {
                transitioning.current = false
            }, duration + 100)
        })
    }

    function outgoingLink(d) {
        return d.target.data.item.direction === 'outgoing'
    }

    function findLinkColor(d) {
        return outgoingLink(d) ? colors.linkBlue : colors.linkRed
    }

    function findRadialPoints(d) {
        const radius = d.y
        const angle = d.x - Math.PI / 2
        return [radius * Math.cos(angle), radius * Math.sin(angle)]
    }

    function findLinkPath(d) {
        // curved links
        if (curvedLinks) {
            return d3
                .linkRadial()
                .angle((r) => r.x)
                .radius((r) => r.y)(d)
        }
        // straight links
        const anchors = outgoingLink(d) ? [d.source, d.target] : [d.target, d.source]
        const points = anchors.map((a) => findRadialPoints(a))
        return `M${points[0]}L${points[1]}`
    }

    // todo: use angles here combined with seperation function to improve radial spread?
    function findNodeTransform(d) {
        return `rotate(${(d.x * 180) / Math.PI - 90}),translate(${d.y}, 0),rotate(${
            (-d.x * 180) / Math.PI + 90
        })`
    }

    function findDomain() {
        // calculate node radius domain
        let dMin = 0
        let dMax
        if (sizeBy === 'Date Created') {
            dMin = d3.min(nodes.current.map((node) => Date.parse(node.data.item.createdAt)))
            dMax = d3.max(nodes.current.map((node) => Date.parse(node.data.item.createdAt)))
        } else if (sizeBy === 'Recent Activity') {
            dMin = d3.min(nodes.current.map((node) => Date.parse(node.data.item.updatedAt)))
            dMax = d3.max(nodes.current.map((node) => Date.parse(node.data.item.updatedAt)))
        } else {
            dMax = d3.max(nodes.current.map((node) => node.data.item[`total${sizeBy}`]))
        }
        domain.current = [dMin, dMax]
    }

    function findNodeRadius(d) {
        let radius
        if (sizeBy === 'Date Created') radius = Date.parse(d.data.item.createdAt)
        else if (sizeBy === 'Recent Activity')
            radius = Date.parse(d.data.item.updatedAt || d.data.item.createdAt)
        else radius = d.data.item[`total${sizeBy}`]
        const minRadius = 0.015 * svgSize.current
        const maxRadius = 0.035 * svgSize.current
        const radiusScale = d3
            .scaleLinear()
            .domain(domain.current) // data values spread
            .range([minRadius, maxRadius]) // radius size spread
        return radiusScale(radius)
    }

    function findNodeFill(d) {
        const { modelType } = d.data.item
        if (modelType === 'post') return colors.aqua
        if (modelType === 'comment') return colors.purple
        if (modelType === 'user') return colors.orange
        if (modelType === 'space') return colors.green
        return '#aaa'
    }

    function findNodeText(d, scale) {
        const { modelType, type, topic, title, text, name } = d.data.item
        const maxChars = Math.round(4 * scale)
        let nodeText = ''
        if (modelType === 'post') {
            // temporary solution until GBG posts title field used instead of topic
            nodeText =
                type === 'glass-bead-game'
                    ? topic || getDraftPlainText(text || '')
                    : title || getDraftPlainText(text || '')
        }
        if (modelType === 'comment') nodeText = getDraftPlainText(text || '')
        if (['user', 'space'].includes(modelType)) nodeText = name
        return nodeText.length > maxChars ? nodeText.substring(0, maxChars).concat('...') : nodeText
    }

    function circleMouseOver(e, node) {
        // highlight selected circle
        d3.select(`#node-background-${node.data.item.uuid}`)
            .transition()
            .duration(duration / 4)
            .attr('fill', colors.cpBlue)
            .attr('r', (d) => findNodeRadius(d) + 6)
        // highlight other circles
        d3.selectAll(`.node-background-${node.data.item.modelType}-${node.data.item.id}`)
            .filter((n) => n.data.item.uuid !== node.data.item.uuid)
            .transition()
            .duration(duration / 4)
            .attr('fill', colors.cpPurple)
            .attr('r', (d) => findNodeRadius(d) + 6)
    }

    function circleMouseOut(e, node) {
        // fade out all highlighted circles
        d3.selectAll(`.node-background-${node.data.item.modelType}-${node.data.item.id}`)
            .transition()
            .duration(duration / 4)
            .attr('fill', '#aaa')
            .attr('r', (d) => findNodeRadius(d) + 2)
    }

    function circleClick(e, node) {
        if (!transitioning.current) {
            transitioning.current = true
            if (!node.parent) resetPosition()
            else {
                setClickedSpaceUUID(node.data.item.uuid)
                history(`/linkmap?item=${node.data.item.modelType}&id=${node.data.item.id}`)
            }
        }
    }

    function findNodeById(tree: any, id: number) {
        // recursive function, traverses the node tree to find a space using its space id
        if (tree.data.item.id === id) return tree
        if (tree.children) {
            for (let i = 0; i < tree.children.length; i += 1) {
                const match = findNodeById(tree.children[i], id)
                if (match) return match
            }
        }
        return null
    }

    function recursivelyAddUUIDS(oldNode, newNode) {
        newNode.data.item.uuid = oldNode.data.item.uuid
        matchedNodeIds.current.push(oldNode.data.item.uuid)
        if (newNode.children && oldNode.children) {
            newNode.children.forEach((child) => {
                const match = oldNode.children.find((c) => c.data.item.id === child.data.item.id)
                if (match) recursivelyAddUUIDS(match, child)
            })
        }
    }

    function createLinks() {
        d3.select(`#links`)
            .selectAll('.link')
            .data(links.current, (d) => d.uuid)
            .join(
                (enter) => {
                    // create group
                    const group = enter
                        .append('g')
                        .attr('id', (d) => `link-${d.uuid}`)
                        .attr('class', 'link')
                        .attr('opacity', 0)
                        .call((node) => {
                            node.transition('link-enter')
                                .delay(200)
                                .duration(duration * 2)
                                .attr('opacity', 1)
                        })
                    // create path
                    group
                        .append('path')
                        .attr('id', (d) => `link-path-${d.uuid}`)
                        .attr('class', 'link-path')
                        .attr('fill', 'none')
                        .attr('stroke', findLinkColor)
                        // .attr('stroke-width', (d) => {
                        //     console.log('link d: ', d)
                        //     return d.source.height + 1
                        // })
                        .attr('d', findLinkPath)
                    // create text
                    group
                        .append('text')
                        .attr('dy', -5)
                        .append('textPath')
                        .classed('link-text', true)
                        .text((d) => d.target.data.Link.description)
                        .attr('font-size', 10)
                        .attr('text-anchor', 'middle')
                        .attr('startOffset', '50%')
                        .attr('href', (d) => `#link-path-${d.uuid}`)
                    // creat arrow
                    group
                        .append('text')
                        .attr('class', 'link-arrow')
                        .attr('dy', 3.4)
                        .append('textPath')
                        .text('▶')
                        .attr('font-size', 10)
                        .attr('text-anchor', 'middle')
                        .attr('startOffset', '50%')
                        .attr('href', (d) => `#link-path-${d.uuid}`)
                        .style('fill', findLinkColor)
                    return group
                },
                (update) => {
                    // update path
                    update
                        .select('.link-path')
                        .transition('link-path-update')
                        .duration(duration)
                        .attr('d', findLinkPath)
                        .style('stroke', findLinkColor)
                    // update arrow
                    update
                        .select('.link-arrow')
                        .select('textPath')
                        .transition('link-arrow-update')
                        .duration(duration)
                        .style('fill', findLinkColor)
                    return update
                },
                (exit) => {
                    exit.transition('link-exit')
                        .duration(duration / 2)
                        .attr('opacity', 0)
                        .remove()
                    return exit
                }
            )
    }

    function createNodes() {
        d3.select(`#nodes`)
            .selectAll('.node')
            .data(nodes.current, (d) => d.data.item.uuid)
            .join(
                (enter) => {
                    // create group
                    const group = enter
                        .append('g')
                        .attr('id', (d) => `node-${d.data.item.uuid}`)
                        .attr('class', 'node')
                        .attr('opacity', 0)
                        .call((node) => {
                            node.transition('node-enter').duration(duration).attr('opacity', 1)
                        })
                    // create background
                    group
                        .append('circle')
                        .attr('id', (d) => `node-background-${d.data.item.uuid}`)
                        .attr(
                            'class',
                            (d) =>
                                `node-background node-background-${d.data.item.modelType}-${d.data.item.id}`
                        )
                        .attr('transform', findNodeTransform)
                        .attr('r', (d) => findNodeRadius(d) + 2)
                        .attr('fill', '#aaa')
                        .attr('cursor', 'pointer')
                        .on('mouseover', circleMouseOver)
                        .on('mouseout', circleMouseOut)
                        .on('click', circleClick)
                        .style('cursor', 'pointer')
                    // create circle
                    group
                        .append('circle')
                        .classed('node-circle', true)
                        .attr('id', (d) => `node-circle-${d.data.item.uuid}`)
                        .attr('transform', findNodeTransform)
                        .attr('r', findNodeRadius)
                        .attr('fill', findNodeFill)
                        .attr('pointer-events', 'none')
                    // create text
                    group
                        .append('text')
                        .attr('id', (d) => `node-text-${d.data.item.uuid}`)
                        .classed('node-text', true)
                        .text((d) => findNodeText(d, 1))
                        .attr('font-size', 10)
                        .style('text-shadow', '0 0 3px white')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('pointer-events', 'none')
                        .attr('transform', findNodeTransform)
                    return group
                },
                (update) => {
                    // update background
                    update
                        .select('.node-background')
                        .on('mouseover', circleMouseOver)
                        .on('mouseout', circleMouseOut)
                        .on('click', circleClick)
                        .transition('node-background-update')
                        .duration(duration)
                        .attr('r', (d) => findNodeRadius(d) + 2)
                        .attr('transform', findNodeTransform)
                    // update circle
                    update
                        .select('.node-circle')
                        .transition('node-circle-update')
                        .duration(duration)
                        .attr('r', findNodeRadius)
                        .attr('transform', findNodeTransform)
                    // update text
                    update
                        .select('.node-text')
                        .transition('node-text-update')
                        .duration(duration)
                        .attr('transform', findNodeTransform)
                    return update
                },
                (exit) => {
                    exit.transition('node-exit')
                        .duration(duration / 2)
                        .attr('opacity', 0)
                        .remove()
                    return exit
                }
            )
    }

    useEffect(() => {
        if (!d3.select('#link-map-svg').node()) buildCanvas()
    }, [])

    useEffect(() => {
        if (!loading)
            d3.select('#loading').transition().duration(duration).style('opacity', 0).remove()
    }, [loading])

    useEffect(() => getLinks(), [location])

    // todo: create seperate component for link map visualisation and merge useEffects below
    useEffect(() => {
        if (linkData) {
            const data = d3.hierarchy(linkData, (d) => d.item.children)
            const circleSize = svgSize.current - 70
            let radius
            if (data.height === 1) radius = circleSize / 6
            if (data.height === 2) radius = circleSize / 3
            if (data.height === 3) radius = circleSize / 2

            const tree = d3
                .tree()
                .size([2 * Math.PI, radius])
                // .size([3, radius])
                // .separation((a, b) => a.depth)
                // .separation(() => 1)
                // .separation((a, b) => ((a.parent === b.parent ? 1 : 2) / a.depth) * 4)
                // .separation((a, b) => (a.parent === b.parent ? 1 : 3) / (a.depth * 4))
                .separation((a, b) => {
                    // return 1
                    return (a.parent === b.parent ? 1 : 2) / (a.depth * 4)
                    // const seperation = a.parent === b.parent ? 1 : a.depth * 2
                    // const seperation = (a.parent === b.parent ? 10 : 20) - a.depth * 3
                    // console.log(
                    //     `siblings: ${a.parent === b.parent}, depthA: ${a.depth}, depthB: ${
                    //         b.depth
                    //     },seperation: ${seperation}, idA: ${a.data.item.title}, idB: ${
                    //         b.data.item.title
                    //     }`
                    // )
                    // return seperation
                })

            const treeData = tree(data)
            const newLinks = treeData.links()
            const newNodes = treeData.descendants()
            // todo: clean up and match links using uuids like nodes
            // add link ids
            newLinks.forEach((link) => {
                link.id = link.target.data.Link.id
                link.uuid = link.target.data.Link.uuid
            })
            // update link uuids
            if (links.current) {
                const matchedLinkIds = [] as number[]
                newLinks.forEach((link) => {
                    const match = links.current.find((l) => l.id === link.id)
                    const alreadyMatched = matchedLinkIds.find((id) => id === link.id)
                    if (match && !alreadyMatched) {
                        matchedLinkIds.push(link.id)
                        link.uuid = match.uuid
                    }
                })
            }
            // update node uuids
            const oldNode = nodes.current && nodes.current[0]
            if (oldNode) {
                const newNode = newNodes[0]
                matchedNodeIds.current = []
                // if tree updates without navigation
                if (oldNode.data.item.id === newNode.data.item.id) {
                    recursivelyAddUUIDS(oldNode, newNode)
                } else {
                    // if navigating to new node use uuid to ensure the correct node is chosen, otherwise just the node id
                    const id = clickedSpaceUUID || newNode.data.item.id
                    const idType = clickedSpaceUUID ? 'uuid' : 'id'
                    const oldChild = nodes.current.find((s) => s.data.item[idType] === id)
                    if (oldChild) recursivelyAddUUIDS(oldChild, newNode)
                    else {
                        // if new space neither old parent or child, search for matching spaces by id
                        const matchingChild = findNodeById(newNode, oldNode.data.item.id)
                        if (matchingChild) recursivelyAddUUIDS(oldNode, matchingChild)
                    }
                }
                // update other matches outside of old node tree
                newNodes.forEach((node) => {
                    const alreadyMatched = matchedNodeIds.current.find(
                        (uuid) => uuid === node.data.item.uuid
                    )
                    if (!alreadyMatched) {
                        const match = nodes.current
                            .filter(
                                (n) =>
                                    !matchedNodeIds.current.find(
                                        (uuid) => uuid === n.data.item.uuid
                                    )
                            )
                            .find((n) => n.data.item.id === node.data.item.id)

                        if (match) {
                            matchedNodeIds.current.push(match.data.item.uuid)
                            node.data.item.uuid = match.data.item.uuid
                        }
                    }
                })
            }
            links.current = newLinks
            nodes.current = newNodes
            findDomain()
            createLinks()
            createNodes()
            // mark transition complete after duration
            setTimeout(() => {
                transitioning.current = false
            }, duration + 100)
        }
    }, [linkData])

    useEffect(() => {
        if (nodes.current) {
            findDomain()
            createLinks()
            createNodes()
            // mark transition complete after duration
            setTimeout(() => {
                transitioning.current = false
            }, duration + 100)
        }
    }, [sizeBy])

    return (
        <Column centerX className={styles.wrapper}>
            <Column centerX centerY id='loading' className={styles.loading}>
                <LoadingWheel />
            </Column>
            <div className={`${styles.content} hide-scrollbars`}>
                <Column centerX className={styles.visualisation}>
                    <Row>
                        <DropDown
                            title='Link types'
                            options={['All Types', 'Posts', 'Comments', 'Spaces', 'Users']}
                            selectedOption={linkTypes}
                            setSelectedOption={(option) => setLinkTypes(option)}
                            style={{ marginRight: 20 }}
                        />
                        <DropDown
                            title='Size by'
                            options={['Likes', 'Links', 'Date Created', 'Recent Activity']}
                            selectedOption={sizeBy}
                            setSelectedOption={(option) => setSizeBy(option)}
                        />
                    </Row>
                    <Column centerX centerY id='link-map-canvas' className={styles.canvas} />
                </Column>
                <Column centerX className={`${styles.info} hide-scrollbars`}>
                    {linkData && renderItem(linkData.item, linkData.item.modelType)}
                    {loggedIn ? (
                        <Column centerX style={{ width: '100%', marginTop: 20 }}>
                            <Row centerY style={{ width: '100%', marginBottom: 20 }}>
                                <Row centerY style={{ flexShrink: 0, marginRight: 20 }}>
                                    <p>Link to</p>
                                    <DropDownMenu
                                        title=''
                                        orientation='horizontal'
                                        options={['Post', 'Comment', 'User', 'Space']}
                                        selectedOption={targetType}
                                        setSelectedOption={(option) => {
                                            setTargetError(false)
                                            setTargetNotFound(false)
                                            setTarget(null)
                                            setTargetIdentifier('')
                                            setTargetType(option)
                                        }}
                                    />
                                </Row>
                                <Column className={styles.targetInput}>
                                    <Input
                                        type='text'
                                        prefix={
                                            ['Post', 'Comment'].includes(targetType)
                                                ? 'ID:'
                                                : 'Handle:'
                                        }
                                        value={targetIdentifier}
                                        onChange={(value) => {
                                            setTargetError(false)
                                            setTargetIdentifier(value)
                                            if (value) getTarget(value)
                                            else {
                                                setTarget(null)
                                                setTargetNotFound(false)
                                                setTargetOptions(null)
                                            }
                                        }}
                                        onBlur={() => setTimeout(() => setTargetOptions(null), 200)}
                                        style={{ marginRight: 20 }}
                                    />
                                    {targetOptions && (
                                        <Column className={styles.targetOptions}>
                                            {targetOptions.map((option) => (
                                                <ImageTitle
                                                    key={option.id}
                                                    className={styles.targetOption}
                                                    type={targetType === 'User' ? 'user' : 'space'}
                                                    imagePath={option.flagImagePath}
                                                    title={`${option.name} (u/${option.handle})`}
                                                    onClick={() => {
                                                        setTarget(option)
                                                        setTargetIdentifier(option.handle)
                                                        setTargetOptions(null)
                                                    }}
                                                />
                                            ))}
                                        </Column>
                                    )}
                                </Column>
                            </Row>
                            {targetError && (
                                <p className='danger' style={{ marginBottom: 20 }}>
                                    {targetType} not found
                                </p>
                            )}
                            <Row centerY style={{ width: '100%', marginBottom: 20 }}>
                                <p style={{ flexShrink: 0, marginRight: 10 }}>
                                    Link description (optional)
                                </p>
                                <Input
                                    type='text'
                                    placeholder='description...'
                                    value={linkDescription}
                                    onChange={(value) => setLinkDescription(value)}
                                />
                            </Row>
                            {linkDescription.length > 50 && (
                                <p className='danger' style={{ marginBottom: 20 }}>
                                    Max 50 characters
                                </p>
                            )}
                            {target && (
                                <Column centerX style={{ width: '100%' }}>
                                    <Button
                                        text='Create link'
                                        color='blue'
                                        onClick={createLink}
                                        disabled={createLinkLoading || linkDescription.length > 50}
                                        loading={createLinkLoading}
                                        style={{ marginBottom: 15 }}
                                    />
                                    <ArrowDownIcon
                                        style={{
                                            height: 20,
                                            width: 20,
                                            color: '#ccc',
                                            marginBottom: 20,
                                        }}
                                    />
                                    {renderItem(target, targetType.toLowerCase())}
                                </Column>
                            )}
                            {targetNotFound && (
                                <Row centerX className={styles.targetNotFound}>
                                    {targetType} not found...
                                </Row>
                            )}
                        </Column>
                    ) : (
                        <Row centerY style={{ marginTop: linkData ? 20 : 0 }}>
                            <Button
                                text='Log in'
                                color='blue'
                                style={{ marginRight: 5 }}
                                onClick={() => setLogInModalOpen(true)}
                            />
                            <p>to link posts</p>
                        </Row>
                    )}
                </Column>
            </div>
        </Column>
    )
}

export default LinkMap
