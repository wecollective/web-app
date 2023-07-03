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
import PostCard from '@components/cards/PostCard/PostCard'
import VerticalUserCard from '@components/cards/VerticalUserCard'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { PostContext } from '@contexts/PostContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { getDraftPlainText, pluralise } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/LinkModal.module.scss'
import { ArrowDownIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

function LinkModal(props: {
    itemType: 'post' | 'card' | 'bead' | 'comment'
    itemData: any
    location: string
    parentItemId?: number // required for comments and beads
    close: () => void
}): JSX.Element {
    const { itemType, itemData, location, parentItemId, close } = props
    const { totalLinks } = itemData
    const { loggedIn, accountData, setLogInModalOpen } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const { userPosts, setUserPosts } = useContext(UserContext)
    const { postData, setPostData } = useContext(PostContext)
    const [linkData, setLinkData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [addLinkLoading, setAddLinkLoading] = useState(false)
    const [targetType, setTargetType] = useState('Post')
    const [targetIdentifier, setTargetIdentifier] = useState('')
    const [linkDescription, setLinkDescription] = useState('')
    const [targetError, setTargetError] = useState(false)
    const [target, setTarget] = useState<any>(null)
    const [targetOptions, setTargetOptions] = useState<any>(null)
    const [linkTypes, setLinkTypes] = useState('All Types')
    const [sizeBy, setSizeBy] = useState('Likes')
    const [clickedSpaceUUID, setClickedSpaceUUID] = useState('')
    const transitioning = useRef(true)
    const domain = useRef<number[]>([0, 0])
    const links = useRef<any>(null)
    const nodes = useRef<any>(null)
    const matchedNodeIds = useRef<number[]>([])
    const cookies = new Cookies()
    const headerText = itemData.totalLinks
        ? `${itemData.totalLinks} link${pluralise(itemData.totalLinks)}`
        : 'No links yet...'

    const sampleData = {
        id: 0,
        children: [
            { id: 1, link: 'test 1', children: [] },
            { id: 2, link: 'test 2', children: [] },
            { id: 3, link: 'test 3', children: [] },
            { id: 4, link: 'test 4', children: [] },
            {
                id: 5,
                link: 'test 5',
                children: [
                    { id: 10, link: 'test 10', children: [] },
                    { id: 11, link: 'test 11', children: [] },
                    { id: 12, link: 'test 12', children: [] },
                ],
            },
            {
                id: 6,
                link: 'test 6',
                children: [
                    { id: 7, link: 'test 7', children: [] },
                    { id: 8, link: 'test 8', children: [] },
                    {
                        id: 9,
                        link: 'test 9',
                        children: [
                            { id: 13, link: 'test 13', children: [] },
                            { id: 14, link: 'test 14', children: [] },
                            { id: 15, link: 'test 15', children: [] },
                        ],
                    },
                ],
            },
        ],
    }

    function findModelType(type) {
        if (['card', 'bead'].includes(type)) return 'post'
        return type
    }

    function getLinks(id, type) {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/links?itemType=${findModelType(type)}&itemId=${id}`, options)
            .then((res) => {
                // console.log('link data: ', res.data)
                // setLoading(false)
                setLinkData(res.data)
                // setLinkData(res.data)
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
        if (type === 'user') {
            return <VerticalUserCard user={item} />
        }
        return null
    }

    function getTarget(identifier) {
        if (targetType === 'Post') {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .get(`${config.apiURL}/post-data?postId=${identifier}`, options)
                .then((res) => {
                    console.log('res: ', res)
                    setTarget(res.data)
                })
                .catch((error) => {
                    console.log(error)
                    setTarget(null)
                })
        }
        if (targetType === 'Comment') {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .get(`${config.apiURL}/comment-data?commentId=${identifier}`, options)
                .then((res) => {
                    setTarget(res.data)
                })
                .catch((error) => {
                    console.log(error)
                    setTarget(null)
                })
        }
        if (targetType === 'User') {
            const data = {
                query: identifier,
                blacklist: [], // ...usersWhoHaveBlockedLinking],
            } as any
            axios
                .post(`${config.apiURL}/find-people`, data)
                .then((res) => {
                    console.log('find-people: ', res.data)
                    setTargetOptions(res.data)
                    // setTarget(res.data)
                })
                .catch((error) => {
                    console.log(error)
                    setTarget(null)
                })
        }
    }

    // function updateContextState(action, linkedItemType, linkedItemId) {
    //     const addingLink = action === 'add-link'
    //     // update context state
    //     let newPosts = [] as any
    //     if (location === 'space-posts') newPosts = [...spacePosts]
    //     if (location === 'user-posts') newPosts = [...userPosts]
    //     if (location === 'post-page') newPosts = [{ ...postData }]
    //     // update source item
    //     if (findModelType(itemType) === 'post') {
    //         let item = newPosts.find((p) => p.id === (parentItemId || itemData.id))
    //         if (itemType === 'bead') item = item.Beads.find((p) => p.id === itemData.id)
    //         if (itemType === 'card') item = item.CardSides.find((p) => p.id === itemData.id)
    //         item.totalLinks += addingLink ? 1 : -1
    //         item.accountLinks += addingLink ? 1 : -1
    //     }
    //     // update target item
    //     if (linkedItemType === 'Post') {
    //         let item = newPosts.find((p) => p.id === linkedItemId)
    //         if (!item) {
    //             newPosts.forEach((post) => {
    //                 const bead = post.Beads && post.Beads.find((b) => b.id === linkedItemId)
    //                 const card = post.CardSides && post.CardSides.find((c) => c.id === linkedItemId)
    //                 if (bead) item = bead
    //                 if (card) item = card
    //             })
    //         }
    //         item.totalLinks += addingLink ? 1 : -1
    //         item.accountLinks += addingLink ? 1 : -1
    //     }
    //     if (location === 'space-posts') setSpacePosts(newPosts)
    //     if (location === 'user-posts') setUserPosts(newPosts)
    //     if (location === 'post-page') setPostData(newPosts[0])
    // }

    // function addLink() {
    //     setAddLinkLoading(true)
    //     const data = {
    //         sourceType: findModelType(itemType),
    //         sourceId: itemData.id,
    //         targetType: targetType.toLowerCase(),
    //         targetId: targetIdentifier,
    //         description: linkDescription,
    //         spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
    //         accountHandle: accountData.handle,
    //         accountName: accountData.name,
    //     }
    //     const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
    //     axios
    //         .post(`${config.apiURL}/add-link`, data, options)
    //         .then((res) => {
    //             console.log('add-link res: ', res.data)
    //             const { target, link } = res.data
    //             // update modal state
    //             setTargetIdentifier('')
    //             setLinkDescription('')
    //             setLinkData({
    //                 ...linkData,
    //                 [`Outgoing${targetType}Links`]: [
    //                     ...linkData[`Outgoing${targetType}Links`],
    //                     { ...link, Creator: accountData, [`Outgoing${targetType}`]: target },
    //                 ],
    //             })
    //             // update context state
    //             updateContextState('add-link', targetType, +targetIdentifier)
    //             setAddLinkLoading(false)
    //         })
    //         .catch((error) => {
    //             console.log(error)
    //             if (error.response && error.response.status === 404) {
    //                 setTargetError(true)
    //                 setAddLinkLoading(false)
    //             }
    //         })
    // }

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

    // function renderLink(link, type, direction) {
    //     const target = link[`${direction === 'to' ? 'Outgoing' : 'Incoming'}${type}`]
    //     let linkedItemUrl
    //     if (type === 'Post') linkedItemUrl = `/p/${target.id}`
    //     if (type === 'Comment') linkedItemUrl = `/p/${target.itemId}?commentId=${target.id}`
    //     return (
    //         <Row key={link.id} centerY style={{ marginBottom: 10 }}>
    //             <p className='grey'>linked {direction}</p>
    //             <ImageTitle
    //                 type='user'
    //                 imagePath={target.Creator.flagImagePath}
    //                 title={`${target.Creator.name}'s`}
    //                 link={`/u/${target.Creator.handle}/posts`}
    //                 fontSize={16}
    //                 style={{ margin: '0 5px' }}
    //             />
    //             <TextLink text={type.toLowerCase()} link={linkedItemUrl} />
    //             {target.Creator.id === accountData.id && (
    //                 <Button
    //                     text='Delete'
    //                     color='blue'
    //                     size='medium'
    //                     onClick={() => removeLink(direction, type, link.id, target.id)}
    //                     style={{ marginLeft: 10 }}
    //                 />
    //             )}
    //         </Row>
    //     )
    // }

    // settings
    const curvedLinks = false
    const duration = 1000
    const canvasSize = 600
    const circleSize = canvasSize - 50

    const zoom = d3.zoom().on('zoom', (event) => {
        // scale master group
        d3.select('#master-group').attr('transform', event.transform)
        // scale circle and text attributes
        const scale = event.transform.k
        d3.selectAll('.node-text').attr('font-size', 10 / scale)
        d3.selectAll('.node-text').each((d) =>
            d3.select(`#node-text-${d.data.item.uuid}`).text(findNodeText(d, scale))
        )
    })

    function resetPosition() {
        d3.select('#link-map-svg')
            .transition('reset-position')
            .duration(1000)
            .call(zoom.transform, d3.zoomIdentity.translate(canvasSize / 2, canvasSize / 2))
    }

    function buildCanvas() {
        const svg = d3
            .select('#link-map')
            .append('svg')
            .attr('id', 'link-map-svg')
            .attr('width', canvasSize)
            .attr('height', canvasSize)
        // set up groups
        const masterGroup = svg.append('g').attr('id', 'master-group')
        const rings = masterGroup.append('g').attr('id', 'background-rings')
        const ringScale = circleSize / 6
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
        svg.call(zoom.transform, d3.zoomIdentity.translate(canvasSize / 2, canvasSize / 2))
        svg.on('click', () => {
            resetPosition()
            setTimeout(() => {
                transitioning.current = false
            }, duration + 100)
        })
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
        else if (sizeBy === 'Recent Activity') radius = Date.parse(d.data.item.updatedAt)
        else radius = d.data.item[`total${sizeBy}`]
        const radiusScale = d3
            .scaleLinear()
            .domain(domain.current) // data values spread
            .range([10, 25]) // radius size spread
        return radiusScale(radius)
    }

    function outgoingLink(d) {
        return d.target.data.item.direction === 'outgoing'
    }

    function findLinkColor(d) {
        return outgoingLink(d) ? colors.linkBlue : colors.linkRed
    }

    // todo: use angles here combined with seperation function to improve radial spread
    function findNodeTransform(d) {
        return `rotate(${(d.x * 180) / Math.PI - 90}),translate(${d.y}, 0)`
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

    function findNodeFill(d) {
        const { modelType } = d.data.item
        if (modelType === 'post') return colors.aqua
        if (modelType === 'comment') return colors.purple
        if (modelType === 'user') return colors.orange
        if (modelType === 'space') return colors.green
        return '#aaa'
    }

    function findNodeText(d, scale) {
        // temporary solution until GBG posts title field used instead of topic
        const { modelType, type, topic, title, text } = d.data.item
        if (modelType === 'post') {
            const plainText =
                type === 'glass-bead-game'
                    ? topic || getDraftPlainText(text || '')
                    : title || getDraftPlainText(text || '')
            // trim text
            const maxChars = Math.round(4 * scale)
            const trimmedText = plainText.substring(0, maxChars)
            return plainText.length > maxChars ? trimmedText.concat('...') : plainText
        }
        return ''
    }

    function circleMouseOver(e, d) {
        // highlight selected circle
        d3.select(`#node-background-${d.data.item.uuid}`)
            .transition()
            .duration(duration / 4)
            .attr('fill', colors.cpBlue)
            .attr('r', findNodeRadius(d) + 6)
        // highlight other circles
        d3.selectAll(`.node-background-${d.data.item.id}`)
            .filter((n) => n.data.item.uuid !== d.data.item.uuid)
            .transition()
            .duration(duration / 4)
            .attr('fill', colors.cpPurple)
            .attr('r', findNodeRadius(d) + 6)
    }

    function circleMouseOut(e, d) {
        // fade out all highlighted circles
        d3.selectAll(`.node-background-${d.data.item.id}`)
            .transition()
            .duration(duration / 4)
            .attr('fill', '#aaa')
            .attr('r', findNodeRadius(d) + 2)
    }

    function circleClick(e, d) {
        if (!transitioning.current) {
            transitioning.current = true
            if (!d.parent) resetPosition()
            else {
                setClickedSpaceUUID(d.data.item.uuid)
                getLinks(d.data.item.id, d.data.item.modelType)
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
                        .attr('class', (d) => `node-background node-background-${d.data.item.id}`)
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
        buildCanvas()
        getLinks(itemData.id, itemType)
    }, [])

    useEffect(() => {
        if (linkData) {
            const data = d3.hierarchy(linkData, (d) => d.item.children)
            let radius
            if (data.height === 1) radius = circleSize / 6
            if (data.height === 2) radius = circleSize / 3
            if (data.height === 3) radius = circleSize / 2

            const tree = d3
                .tree()
                // .size([2 * Math.PI, radius])
                .size([3, radius])
                // .separation((a, b) => a.depth)
                // .separation(() => 1)
                // .separation((a, b) => ((a.parent === b.parent ? 1 : 2) / a.depth) * 4)
                // .separation((a, b) => (a.parent === b.parent ? 1 : 3) / (a.depth * 4))
                .separation((a, b) => {
                    // return 1
                    return (a.parent === b.parent ? 1 : 2) / a.depth
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
        <Modal close={close} centerX style={{ minWidth: 400 }}>
            <Column centerX>
                <h1>{headerText}</h1>
                <Row>
                    <Column
                        centerX
                        style={{ width: 700, marginRight: 50, maxHeight: 600, overflow: 'scroll' }}
                    >
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
                                                    setTargetOptions(null)
                                                }
                                            }}
                                            style={{ marginRight: 20 }}
                                        />
                                        {targetOptions && (
                                            <Column className={styles.targetOptions}>
                                                {targetOptions.map((option) => (
                                                    <ImageTitle
                                                        className={styles.targetOption}
                                                        type={
                                                            targetType === 'User' ? 'user' : 'space'
                                                        }
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
                                            text='Add link'
                                            color='blue'
                                            onClick={() => null}
                                            disabled={addLinkLoading || linkDescription.length > 50}
                                            loading={addLinkLoading}
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
                            </Column>
                        ) : (
                            <Row centerY style={{ marginTop: totalLinks ? 20 : 0 }}>
                                <Button
                                    text='Log in'
                                    color='blue'
                                    style={{ marginRight: 5 }}
                                    onClick={() => {
                                        setLogInModalOpen(true)
                                        close()
                                    }}
                                />
                                <p>to link posts</p>
                            </Row>
                        )}
                    </Column>
                    <Column centerX>
                        <Row style={{ marginBottom: 20 }}>
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
                        <div id='link-map' />
                    </Column>
                </Row>
            </Column>
        </Modal>
    )
}

LinkModal.defaultProps = {
    parentItemId: null,
}

export default LinkModal

// console.log('points: ', points)
// [[x,y], [x,y]]
// const lineD = [
//     { x: points[0][0], y: points[0][1] },
//     { x: points[1][0], y: points[1][1] },
// ]
// const line = d3
//     .line()
//     .x((dt) => dt.x)
//     .y((dt) => dt.y)
//     .curve(d3.curveBasis)

// return line(lineD)

// return `M${points[0]}C${points[1][0] + 100},${points[0][1]} ${points[1][0] + 100},${
//     points[1][1]
// } ${points[1]}`

// function findPathCoordinates(d) {
//     return `M${d.x},${d.y}C${d.x},${(d.y + d.parent.y) / 2} ${d.parent.x},${
//         (d.y + d.parent.y) / 2
//     } ${d.parent.x},${d.parent.y}`
// }

// function radialPoint(x, y) {
//     return [+y * Math.cos(x - Math.PI / 2), y * Math.sin(x)]
// }
