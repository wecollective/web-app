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
    const { id, totalLinks } = itemData
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
    const cookies = new Cookies()
    const incomingLinks = IncomingPostLinks.length > 0 || IncomingCommentLinks.length > 0
    const outgoingLinks = OutgoingPostLinks.length > 0 || OutgoingCommentLinks.length > 0
    // todo: replace with 'totalLinks' prop when comment state added to posts
    const tempTotalLinks =
        IncomingPostLinks.length +
        IncomingCommentLinks.length +
        OutgoingPostLinks.length +
        OutgoingCommentLinks.length
    const headerText = tempTotalLinks
        ? `${tempTotalLinks} link${pluralise(tempTotalLinks)}`
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

    function modelType() {
        if (['card', 'bead'].includes(itemType)) return 'post'
        return itemType
    }

    function getLinks() {
        axios
            .get(`${config.apiURL}/links?itemType=${modelType()}&itemId=${id}`)
            .then((res) => {
                console.log('links: ', res.data)
                setLoading(false)
                setLinkDataNew(res.data)
                // setLinkData(res.data)
                // setLoading(false)
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
        if (modelType() === 'post') {
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
            sourceType: modelType(),
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

    function removeLink(direction, type, linkId, itemId) {
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/remove-link`, { linkId }, options)
            .then((res) => {
                // update modal context
                const linkArray = `${direction === 'to' ? 'Outgoing' : 'Incoming'}${type}Links`
                setLinkData({
                    ...linkData,
                    [linkArray]: [...linkData[linkArray].filter((l) => l.id !== linkId)],
                })
                // update context state
                updateContextState('remove-link', type, itemId)
            })
            .catch((error) => console.log(error))
    }

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

    function findPathCoordinates(d) {
        return `M${d.x},${d.y}C${d.x},${(d.y + d.parent.y) / 2} ${d.parent.x},${
            (d.y + d.parent.y) / 2
        } ${d.parent.x},${d.parent.y}`
    }

    function radialPoint(x, y) {
        return [+y * Math.cos(x - Math.PI / 2), y * Math.sin(x)]
    }

    function radialDiagonal(d, i) {
        const projection = (d2) => {
            // Because of the transformation, 0 is the centre, and d.y denotes the distance
            // from that centre
            const radius = d2.y
            // Subtract 90 because otherwise 0 degrees is left, instead of at the top
            const angle = d2.x - 1.57 // (d2.x * 180) / Math.PI - 90
            return [radius * Math.cos(angle), radius * Math.sin(angle)]
        }
        const points = [d.source, d.target].map(projection)
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

        return `M${points[0]}L${points[1]}` // 'M' + points[0] + 'L' + points[1]
    }

    // function createLinks(links) {
    //     d3.select(`#link-group`)
    //         .selectAll('.link')
    //         .data(links)
    //         // .data(links, (d) => d.data.id)
    //         .join(
    //             (enter) =>
    //                 enter
    //                     .append('path')
    //                     .classed('link', true)
    //                     // .attr('id', (d) => `line-${d.data.id}`)
    //                     .attr('stroke', '#ccc')
    //                     // .attr('stroke-width', (d) => {
    //                     //     console.log('link d: ', d)
    //                     //     return d.source.height + 1
    //                     // })
    //                     .attr('fill', 'none')
    //                     .attr('opacity', 0)
    //                     // .attr('x1', (d) => radialPoint(d.source.x, d.source.y)[0])
    //                     // .attr('y1', (d) => radialPoint(d.source.x, d.source.y)[1])
    //                     // .attr('x2', (d) => radialPoint(d.target.x, d.target.y)[0])
    //                     // .attr('y2', (d) => radialPoint(d.target.x, d.target.y)[1])
    //                     .attr(
    //                         'd',
    //                         d3
    //                             .linkRadial()
    //                             .angle((d) => d.x)
    //                             .radius((d) => d.y)
    //                         // .curve()
    //                         // d3
    //                         //     .link(d3.curveBumpX)
    //                         //     .x((d) => d.x)
    //                         //     .y((d) => d.y)
    //                     )
    //                     // .attr('d', (d) => findPathCoordinates(d))
    //                     .call((node) => {
    //                         node.transition().duration(duration).attr('opacity', 1)
    //                     }),
    //             (update) =>
    //                 update.call(
    //                     (node) => node.transition('link-update').duration(duration)
    //                     // .attr('d', (d) => findPathCoordinates(d))
    //                 ),
    //             (exit) =>
    //                 exit.call((node) =>
    //                     node
    //                         .transition()
    //                         .duration(duration / 2)
    //                         .attr('opacity', 0)
    //                         .remove()
    //                 )
    //         )
    // }

    function createLinks(links) {
        // const lineData = []

        // const line = d3
        //     .line()
        //     .x((d) => d.x)
        //     .y((d) => d.y)
        //     .curve(d3.curveLinear)

        d3.select(`#link-group`)
            .selectAll('.link')
            .data(links)
            // .data(links, (d) => d.data.id)
            .join(
                (enter) =>
                    enter
                        .append('path')
                        .classed('link', true)
                        .attr('d', radialDiagonal)
                        // .attr('d', (d) => {
                        //     return `M${d.source.y},${d.source.x}C${d.target.y + 100},${d.x} ${
                        //         d.target.y + 100
                        //     },${d.target.x} ${d.target.y},${d.target.x}`
                        //     // console.log('create link d: ', d)
                        //     // const lineD = [
                        //     //     { x: d.source.x, y: d.source.y },
                        //     //     { x: d.target.x, y: d.target.y },
                        //     // ]
                        //     // return line(lineD)
                        // })
                        // .attr('id', (d) => `line-${d.data.id}`)
                        // .attr('fill', '#ccc')
                        .attr('stroke', '#ccc')
                        // .attr('stroke-width', (d) => {
                        //     console.log('link d: ', d)
                        //     return d.source.height + 1
                        // })
                        // .attr('fill', 'none')
                        // .attr('opacity', 0)
                        // .attr('x0', (d) => 20)
                        // .attr('y0', (d) => 20)
                        // .attr('x1', (d) => 100)
                        // .attr('y1', (d) => 100)
                        // .attr('x1', (d) => d.source.x)
                        // .attr('y1', (d) => d.source.y)
                        // .attr('x2', (d) => d.target.x)
                        // .attr('y2', (d) => d.target.y)
                        // .attr('y1', (d) => radialPoint(d.source.x, d.source.y)[1])
                        // .attr('x2', (d) => radialPoint(d.target.x, d.target.y)[0])
                        // .attr('y2', (d) => radialPoint(d.target.x, d.target.y)[1])
                        // .attr(
                        //     'd',
                        //     d3
                        //         .linkRadial()
                        //         .angle((d) => d.x)
                        //         .radius((d) => d.y)
                        //     // .curve()
                        // )
                        // .attr('d', (d) => findPathCoordinates(d))
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
                        .append('textPath')
                        .classed('textPath', true)
                        .text((d) => {
                            // console.log('text d: ', d)
                        })
                        .attr('text-anchor', 'middle')
                        .attr('startOffset', '50%')
                        .attr('href', (d) => `#link-${d.source.id}`)
                        .attr('d', radialDiagonal)
                        // .attr(
                        //     'd',
                        //     d3
                        //         .linkRadial()
                        //         .angle((d) => d.x)
                        //         .radius((d) => d.y)
                        //     // .curve()
                        // )
                        // .attr('d', (d) => findPathCoordinates(d))
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
                        // .attr('cx', 0)
                        // .attr('cy', (d) => -d.y)
                        // .attr('transform', (d) => `rotate(${d.x}, 0, 0)`)
                        .attr('r', (d) => (d.parent ? 10 : 15))
                        .attr('fill', (d) => (d.parent ? '#00b1a9' : '#826cff'))
                        // .attr('stroke-width', 3)
                        .attr('stroke', 'black')
                        // .attr('transform', (d) => `translate(${d3.pointRadial(d.x, d.y)})`)
                        // .attr('transform', (d) => `translate(${d.x},${d.y})`)
                        .style('cursor', 'pointer')
                        .call(
                            (node) =>
                                node
                                    .transition('background-circle-enter')
                                    .duration(duration)
                                    .attr('opacity', 0.5)
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
                        .text((d) => {
                            console.log('yexy d: ', d)
                            return d.data.item.id
                        })
                        .attr('font-size', 20)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
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

    const zoom = d3
        .zoom()
        .on('zoom', (event) => d3.select('#master-group').attr('transform', event.transform))

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
        getLinks()
    }, [])

    useEffect(() => {
        if (linkDataNew) {
            buildCanvas()
            // const data = d3.hierarchy(sampleData)
            const data = d3.hierarchy(linkDataNew, (d) => d.item.children)
            // console.log('data: ', data)
            let radius
            if (data.height === 1) radius = circleSize / 6
            if (data.height === 2) radius = circleSize / 3
            if (data.height === 3) radius = circleSize / 2

            const tree = d3
                .tree()
                .size([2 * Math.PI, radius])
                // .separation(() => 2)
                .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)

            const treeData = tree(data)

            const nodes = treeData.descendants()
            const links = treeData.links()
            const links2 = treeData.descendants().slice(1)
            // console.log('link data: ', links)
            // console.log('link data2: ', links2)
            createLinks(links)
            createLinkText(links)
            createCircles(nodes)
            createCircleText(nodes)
        }
    }, [linkDataNew])

    return (
        <Modal close={close} centerX style={{ minWidth: 400 }}>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    {/* <h1>{headerText}</h1> */}
                    <h1>6 Links</h1>
                    <Row>
                        <Column centerX style={{ width: 700, marginRight: 50 }}>
                            <PostCard post={itemData} location='link-modal' />
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
                            <DropDown
                                title='Link types'
                                options={['All Types', 'Posts', 'Comments', 'Spaces', 'Users']}
                                selectedOption={linkTypes}
                                setSelectedOption={(option) => setLinkTypes(option)}
                                style={{ marginBottom: 20 }}
                            />
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
