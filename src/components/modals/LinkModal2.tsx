import Button from '@components/Button'
import Column from '@components/Column'
import DropDown from '@components/DropDown'
import DropDownMenu from '@components/DropDownMenu'
import Input from '@components/Input'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import PostCard from '@components/cards/PostCard/PostCard'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { PostContext } from '@contexts/PostContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { pluralise } from '@src/Helpers'
import { ArrowDownIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'
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
    const [linkDataNew, setLinkDataNew] = useState<any>(null)
    const [linkData, setLinkData] = useState<any>({
        IncomingPostLinks: [],
        IncomingCommentLinks: [],
        OutgoingPostLinks: [],
        OutgoingCommentLinks: [],
    })
    const { IncomingPostLinks, IncomingCommentLinks, OutgoingPostLinks, OutgoingCommentLinks } =
        linkData
    const [loading, setLoading] = useState(true)
    const [addLinkLoading, setAddLinkLoading] = useState(false)
    const [newLinkTargetType, setNewLinkTargetType] = useState('Post')
    const [newLinkTargetId, setNewLinkTargetId] = useState('')
    const [newLinkDescription, setNewLinkDescription] = useState('')
    const [targetError, setTargetError] = useState(false)
    const [linkedItem, setLinkedItem] = useState<any>(null)
    const [linkTypes, setLinkTypes] = useState('All Types')
    const [sizeBy, setSizeBy] = useState('Likes')
    const cookies = new Cookies()
    // const incomingLinks = IncomingPostLinks.length > 0 || IncomingCommentLinks.length > 0
    // const outgoingLinks = OutgoingPostLinks.length > 0 || OutgoingCommentLinks.length > 0
    // // todo: replace with 'totalLinks' prop when comment state added to posts
    // const tempTotalLinks =
    //     IncomingPostLinks.length +
    //     IncomingCommentLinks.length +
    //     OutgoingPostLinks.length +
    //     OutgoingCommentLinks.length
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

    function modelType(type) {
        if (['card', 'bead'].includes(type)) return 'post'
        return type
    }

    function getLinks(id, type) {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/links?itemType=${modelType(type)}&itemId=${id}`, options)
            .then((res) => {
                console.log('link data: ', res.data)
                // setLoading(false)
                setLinkDataNew(res.data)
                // setLinkData(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getLinkedItem(identifier) {
        if (newLinkTargetType === 'Post') {
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .get(`${config.apiURL}/post-data?postId=${identifier}`, options)
                .then((res) => {
                    setLinkedItem(res.data)
                })
                .catch((error) => {
                    console.log(error)
                    setLinkedItem(null)
                })
        }
    }

    function updateContextState(action, linkedItemType, linkedItemId) {
        const addingLink = action === 'add-link'
        // update context state
        let newPosts = [] as any
        if (location === 'space-posts') newPosts = [...spacePosts]
        if (location === 'user-posts') newPosts = [...userPosts]
        if (location === 'post-page') newPosts = [{ ...postData }]
        // update source item
        if (modelType(itemType) === 'post') {
            let item = newPosts.find((p) => p.id === (parentItemId || itemData.id))
            if (itemType === 'bead') item = item.Beads.find((p) => p.id === itemData.id)
            if (itemType === 'card') item = item.CardSides.find((p) => p.id === itemData.id)
            item.totalLinks += addingLink ? 1 : -1
            item.accountLinks += addingLink ? 1 : -1
        }
        // update target item
        if (linkedItemType === 'Post') {
            let item = newPosts.find((p) => p.id === linkedItemId)
            if (!item) {
                newPosts.forEach((post) => {
                    const bead = post.Beads && post.Beads.find((b) => b.id === linkedItemId)
                    const card = post.CardSides && post.CardSides.find((c) => c.id === linkedItemId)
                    if (bead) item = bead
                    if (card) item = card
                })
            }
            item.totalLinks += addingLink ? 1 : -1
            item.accountLinks += addingLink ? 1 : -1
        }
        if (location === 'space-posts') setSpacePosts(newPosts)
        if (location === 'user-posts') setUserPosts(newPosts)
        if (location === 'post-page') setPostData(newPosts[0])
    }

    function addLink() {
        setAddLinkLoading(true)
        const data = {
            sourceType: modelType(itemType),
            sourceId: itemData.id,
            targetType: newLinkTargetType.toLowerCase(),
            targetId: newLinkTargetId,
            description: newLinkDescription,
            spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
            accountHandle: accountData.handle,
            accountName: accountData.name,
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/add-link`, data, options)
            .then((res) => {
                console.log('add-link res: ', res.data)
                const { target, link } = res.data
                // update modal state
                setNewLinkTargetId('')
                setNewLinkDescription('')
                setLinkData({
                    ...linkData,
                    [`Outgoing${newLinkTargetType}Links`]: [
                        ...linkData[`Outgoing${newLinkTargetType}Links`],
                        { ...link, Creator: accountData, [`Outgoing${newLinkTargetType}`]: target },
                    ],
                })
                // update context state
                updateContextState('add-link', newLinkTargetType, +newLinkTargetId)
                setAddLinkLoading(false)
            })
            .catch((error) => {
                console.log(error)
                if (error.response && error.response.status === 404) {
                    setTargetError(true)
                    setAddLinkLoading(false)
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

    // function renderLink(link, type, direction) {
    //     const linkedItem = link[`${direction === 'to' ? 'Outgoing' : 'Incoming'}${type}`]
    //     let linkedItemUrl
    //     if (type === 'Post') linkedItemUrl = `/p/${linkedItem.id}`
    //     if (type === 'Comment') linkedItemUrl = `/p/${linkedItem.itemId}?commentId=${linkedItem.id}`
    //     return (
    //         <Row key={link.id} centerY style={{ marginBottom: 10 }}>
    //             <p className='grey'>linked {direction}</p>
    //             <ImageTitle
    //                 type='user'
    //                 imagePath={linkedItem.Creator.flagImagePath}
    //                 title={`${linkedItem.Creator.name}'s`}
    //                 link={`/u/${linkedItem.Creator.handle}/posts`}
    //                 fontSize={16}
    //                 style={{ margin: '0 5px' }}
    //             />
    //             <TextLink text={type.toLowerCase()} link={linkedItemUrl} />
    //             {linkedItem.Creator.id === accountData.id && (
    //                 <Button
    //                     text='Delete'
    //                     color='blue'
    //                     size='medium'
    //                     onClick={() => removeLink(direction, type, link.id, linkedItem.id)}
    //                     style={{ marginLeft: 10 }}
    //                 />
    //             )}
    //         </Row>
    //     )
    // }

    const duration = 500
    const canvasSize = 600
    const circleSize = canvasSize - 50

    const zoom = d3
        .zoom()
        .on('zoom', (event) => d3.select('#master-group').attr('transform', event.transform))

    function resetPosition() {
        d3.select('#link-map-svg')
            .transition('reset-position')
            .duration(1000)
            .call(zoom.transform, d3.zoomIdentity.translate(canvasSize / 2, canvasSize / 2))
    }

    // function findDomain() {
    //     let dMin = 0
    //     let dMax
    //     if (sortBy === 'Date Created') {
    //         dMin = d3.min(postMapData.posts.map((post) => Date.parse(post.createdAt)))
    //         dMax = d3.max(postMapData.posts.map((post) => Date.parse(post.createdAt)))
    //     } else if (sortBy === 'Recent Activity') {
    //         dMin = d3.min(postMapData.posts.map((post) => Date.parse(post.lastActivity)))
    //         dMax = d3.max(postMapData.posts.map((post) => Date.parse(post.lastActivity)))
    //     } else dMax = d3.max(postMapData.posts.map((child) => child[`total${sortBy}`]))
    //     return sortOrder === 'Descending' ? [dMin, dMax] : [dMax, dMin]
    // }

    function findRadius(d) {
        const radiusScale = d3
            .scaleLinear()
            .domain([1, 5]) // data values spread
            .range([20, 60]) // radius size spread
        const radius = d.data.item.totalLikes
        // let radius
        // if (sortBy === 'Date Created') radius = Date.parse(d.createdAt)
        // else if (sortBy === 'Recent Activity') radius = Date.parse(d.lastActivity)
        // else radius = d[`total${sortBy}`]
        return radiusScale(radius)
    }

    function radialLines(d, i) {
        const points = [d.source, d.target].map((d2) => {
            const radius = d2.y
            const angle = d2.x - Math.PI / 2
            return [radius * Math.cos(angle), radius * Math.sin(angle)]
        })
        return `M${points[0]}L${points[1]}`
    }

    const radialCurves = d3
        .linkRadial()
        .angle((d) => d.x)
        .radius((d) => d.y)

    function createLinks(links) {
        const curvedLinks = false
        const outgoing = (d) => d.target.data.item.direction === 'outgoing'
        d3.select(`#link-group`)
            .selectAll('.link')
            .data(links)
            // .data(links, (d) => d.data.id)
            .join(
                (enter) =>
                    enter
                        .append('path')
                        .classed('link', true)
                        .attr('id', (d) => `link-${d.source.data.item.id}-${d.target.data.item.id}`)
                        // .attr('stroke', '#ccc')
                        .style('stroke', (d) => (outgoing(d) ? 'blue' : 'red'))
                        .attr('fill', 'none')
                        // .attr('stroke-width', (d) => {
                        //     console.log('link d: ', d)
                        //     return d.source.height + 1
                        // })
                        .attr('d', curvedLinks ? radialCurves : radialLines)
                        .call((node) => {
                            node.transition().duration(duration).attr('opacity', 1)
                        }),
                (update) =>
                    update.call(
                        (node) => node.transition('link-update').duration(duration)
                        // .attr('d', (d) => findPathCoordinates(d))
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

    function createLinkText(links) {
        d3.select(`#link-group`)
            .selectAll('.link-text')
            .data(links)
            // .data(links, (d) => d.data.id)
            .join(
                (enter) =>
                    enter
                        .append('text')
                        .classed('link-text', true)
                        .attr('dy', -5)
                        .append('textPath')
                        .classed('textPath', true)
                        .text((d) => d.target.data.Link.description)
                        .attr('font-size', 10)
                        .attr('text-anchor', 'middle')
                        .attr('startOffset', '50%')
                        .attr(
                            'href',
                            (d) => `#link-${d.source.data.item.id}-${d.target.data.item.id}`
                        )
                        .call((node) => {
                            node.transition().duration(duration).attr('opacity', 1)
                        }),
                (update) =>
                    update.call(
                        (node) => node.transition('link-update').duration(duration)
                        // .attr('d', (d) => findPathCoordinates(d))
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

    function createLinkArrows(links) {
        const outgoing = (d) => d.target.data.item.direction === 'outgoing'
        // add arrows
        d3.select(`#link-group`)
            .selectAll('.link-arrow')
            .data(links)
            .join(
                (enter) =>
                    enter
                        .append('path')
                        .attr('transform', (d) =>
                            outgoing(d) ? 'translate(0, -2.5)' : 'translate(0, 2.5),rotate(180,0,0)'
                        )
                        .attr('d', 'M 0 0 L 5 2.5 L 0 5 z')
                        .style('fill', (d) => (outgoing(d) ? 'blue' : 'red'))
                        // position arrow at half way point along line
                        .append('animateMotion')
                        .attr('calcMode', 'linear')
                        .attr('rotate', 'auto')
                        .attr('keyPoints', '0.5;0.5')
                        .attr('keyTimes', '0.0;1.0')
                        .append('mpath')
                        .attr(
                            'href',
                            (d) => `#link-${d.source.data.item.id}-${d.target.data.item.id}`
                        )
                        .call((node) => {
                            node.transition().duration(duration).attr('opacity', 1)
                        }),
                (update) =>
                    update.call(
                        (node) => node.transition('link-update').duration(duration)
                        // .attr('d', (d) => findPathCoordinates(d))
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

    function createCircles(linkedItems) {
        d3.select(`#node-group`)
            .selectAll('.circle')
            .data(linkedItems, (d) => d.data.id)
            .join(
                (enter) =>
                    enter
                        .append('circle')
                        .attr('id', (d) => `circle-${d.data.id}`)
                        .attr(
                            'transform',
                            (d) => `rotate(${(d.x * 180) / Math.PI - 90}),translate(${d.y}, 0)`
                        )
                        // .attr('r', (d) => (d.parent ? 10 : 15))
                        .attr('r', (d) => findRadius(d))
                        .attr('fill', (d) =>
                            d.data.item.modelType === 'post' ? '#00b1a9' : '#826cff'
                        )
                        // .attr('stroke-width', 3)
                        .attr('stroke', 'black')
                        .attr('cursor', 'pointer')
                        .on('click', (event, circle) => {
                            console.log('circle: ', circle)
                            if (!circle.parent) resetPosition()
                            else getLinks(circle.data.item.id, circle.data.item.modelType)
                        })
                        .style('cursor', 'pointer')
                        .call(
                            (node) =>
                                node
                                    .transition('background-circle-enter')
                                    .duration(duration)
                                    .attr('opacity', 1)
                            // .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        ),
                (update) =>
                    update.call(
                        (node) =>
                            node
                                .transition('background-circle-update')
                                .duration(duration)
                                .attr('fill', '#aaa')
                        // .attr('transform', (d) => `translate(${d.x},${d.y})`)
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

    function createCircleText(linkedItems) {
        d3.select(`#node-group`)
            .selectAll('.circle')
            .data(linkedItems, (d) => d.data.id)
            .join(
                (enter) =>
                    enter
                        .append('text')
                        .attr('id', (d) => `circle-text-${d.data.id}`)
                        .attr(
                            'transform',
                            (d) => `rotate(${(d.x * 180) / Math.PI - 90}),translate(${d.y}, 0)`
                        )
                        .text((d) => d.data.item.title)
                        .attr('font-size', 10)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('pointer-events', 'none')
                        .call(
                            (node) =>
                                node
                                    .transition('background-circle-enter')
                                    .duration(duration)
                                    .attr('opacity', 1)
                            // .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        ),
                (update) =>
                    update.call(
                        (node) =>
                            node
                                .transition('background-circle-update')
                                .duration(duration)
                                .attr('fill', '#aaa')
                        // .attr('transform', (d) => `translate(${d.x},${d.y})`)
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

    function buildCanvas() {
        const svg = d3
            .select('#link-map')
            .append('svg')
            .attr('id', 'link-map-svg')
            .attr('width', canvasSize)
            .attr('height', canvasSize)
        const masterGroup = svg.append('g').attr('id', 'master-group')
        const rings = masterGroup.append('g').attr('id', 'background-rings')
        const ringScale = circleSize / 6
        const ringSizes = [ringScale, ringScale * 2, ringScale * 3]
        ringSizes.forEach((ringSize) => {
            rings
                .append('circle')
                .attr('r', ringSize)
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('opacity', 0.1)
        })
        masterGroup.append('g').attr('id', 'link-group')
        masterGroup.append('g').attr('id', 'node-group')
        // set up zoom
        svg.call(zoom).on('dblclick.zoom', null)
        svg.call(zoom.transform, d3.zoomIdentity.translate(canvasSize / 2, canvasSize / 2))
        svg.on('click', resetPosition)
    }

    useEffect(() => {
        getLinks(itemData.id, itemType)
    }, [])

    useEffect(() => {
        if (!loading) {
            buildCanvas()
            const data = d3.hierarchy(linkDataNew, (d) => d.item.children)
            // console.log('data: ', data)
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
                .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)

            const treeData = tree(data)
            // console.log('treeData: ', treeData.children.length)
            const nodes = treeData.descendants()
            const links = treeData.links()
            createLinks(links)
            createLinkText(links)
            createLinkArrows(links)
            createCircles(nodes)
            createCircleText(nodes)
        }
    }, [loading])

    return (
        <Modal close={close} centerX style={{ minWidth: 400 }}>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    <h1>{headerText}</h1>
                    <Row>
                        <Column centerX style={{ width: 700, marginRight: 50 }}>
                            <PostCard post={linkDataNew.item} location='link-modal' />
                            {/* <ArrowDownIcon
                                style={{
                                    height: 20,
                                    width: 20,
                                    color: '#ddd',
                                    marginTop: 20,
                                }}
                            /> */}
                            {loggedIn ? (
                                <Column centerX style={{ width: '100%', marginTop: 20 }}>
                                    <Row centerY style={{ width: '100%', marginBottom: 20 }}>
                                        <Row centerY style={{ flexShrink: 0, marginRight: 20 }}>
                                            <p>Link to another</p>
                                            <DropDownMenu
                                                title=''
                                                orientation='horizontal'
                                                options={['Post', 'Comment']} // 'User', 'Space'
                                                selectedOption={newLinkTargetType}
                                                setSelectedOption={(option) => {
                                                    setTargetError(false)
                                                    setNewLinkTargetId('')
                                                    setNewLinkTargetType(option)
                                                }}
                                            />
                                        </Row>
                                        <Input
                                            type='text'
                                            prefix={
                                                ['Post', 'Comment'].includes(newLinkTargetType)
                                                    ? 'ID:'
                                                    : 'Handle:'
                                            }
                                            value={newLinkTargetId}
                                            onChange={(value) => {
                                                setTargetError(false)
                                                setNewLinkTargetId(value)
                                                getLinkedItem(value)
                                            }}
                                            style={{ marginRight: 20 }}
                                        />
                                        <Button
                                            text='Add link'
                                            color='blue'
                                            onClick={addLink}
                                            disabled={
                                                addLinkLoading ||
                                                !newLinkTargetId ||
                                                newLinkDescription.length > 50
                                            }
                                            loading={addLinkLoading}
                                        />
                                    </Row>
                                    {targetError && (
                                        <p className='danger' style={{ marginBottom: 20 }}>
                                            {newLinkTargetType} not found
                                        </p>
                                    )}
                                    <Row centerY style={{ width: '100%', marginBottom: 20 }}>
                                        <p style={{ flexShrink: 0, marginRight: 10 }}>
                                            Link description
                                        </p>
                                        <Input
                                            type='text'
                                            placeholder='description (optional)...'
                                            value={newLinkDescription}
                                            onChange={(value) => setNewLinkDescription(value)}
                                        />
                                    </Row>
                                    {newLinkDescription.length > 50 && (
                                        <p className='danger' style={{ marginBottom: 20 }}>
                                            Max 50 characters
                                        </p>
                                    )}
                                    {linkedItem && (
                                        <Column centerX>
                                            <ArrowDownIcon
                                                style={{
                                                    height: 20,
                                                    width: 20,
                                                    color: '#ccc',
                                                    marginBottom: 20,
                                                }}
                                            />
                                            <PostCard post={linkedItem} location='link-modal' />
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
                                    options={['Likes', 'Links']}
                                    selectedOption={sizeBy}
                                    setSelectedOption={(option) => setSizeBy(option)}
                                />
                            </Row>
                            <div id='link-map' />
                        </Column>
                    </Row>
                    {/* {loggedIn ? (
                        <Column centerX style={{ marginTop: totalLinks ? 20 : 0 }}>
                            <Row centerY style={{ marginBottom: 10 }}>
                                <p>Link to another</p>
                                <DropDownMenu
                                    title=''
                                    orientation='horizontal'
                                    options={['Post', 'Comment']} // 'User', 'Space'
                                    selectedOption={newLinkTargetType}
                                    setSelectedOption={(option) => {
                                        setTargetError(false)
                                        setNewLinkTargetId('')
                                        setNewLinkTargetType(option)
                                    }}
                                />
                            </Row>
                            <Input
                                type='text'
                                prefix={
                                    ['Post', 'Comment'].includes(newLinkTargetType)
                                        ? 'ID:'
                                        : 'Handle:'
                                }
                                value={newLinkTargetId}
                                onChange={(value) => {
                                    setTargetError(false)
                                    setNewLinkTargetId(value)
                                }}
                                style={{ marginBottom: 20, minWidth: 200 }}
                            />
                            {targetError && (
                                <p className='danger' style={{ marginBottom: 20 }}>
                                    {newLinkTargetType} not found
                                </p>
                            )}
                            <p style={{ marginBottom: 10 }}>Description (optional)</p>
                            <Input
                                type='text'
                                placeholder='link description...'
                                value={newLinkDescription}
                                onChange={(value) => setNewLinkDescription(value)}
                                style={{ minWidth: 300, marginBottom: 20 }}
                            />
                            {newLinkDescription.length > 50 && (
                                <p className='danger' style={{ marginBottom: 20 }}>
                                    Max 50 characters
                                </p>
                            )}
                            <Button
                                text='Add link'
                                color='blue'
                                onClick={addLink}
                                disabled={
                                    addLinkLoading ||
                                    !newLinkTargetId ||
                                    newLinkDescription.length > 50
                                }
                                loading={addLinkLoading}
                            />
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
                    )} */}
                </Column>
            )}
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
