import Button from '@components/Button'
import Column from '@components/Column'
import DropDownMenu from '@components/DropDownMenu'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import TextLink from '@components/TextLink'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { pluralise } from '@src/Helpers'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function LinkModal(props: {
    // postId?: number // required for beads
    itemType: 'post' | 'comment'
    itemData: any
    updateItem: (link: any, state: string) => void
    close: () => void
}): JSX.Element {
    // const { type, location, postId, postData, setPostData, close } = props
    const { itemType, itemData, updateItem, close } = props
    const { id, totalLinks } = itemData
    const { loggedIn, accountData, setLogInModalOpen, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const { userPosts, setUserPosts } = useContext(UserContext)
    const [linkData, setLinkData] = useState<any>({
        IncomingPosts: [],
        IncomingComments: [],
        OutgoingPosts: [],
        OutgoingComments: [],
    })
    const { IncomingPosts, IncomingComments, OutgoingPosts, OutgoingComments } = linkData
    const [loading, setLoading] = useState(true)
    const [addLinkLoading, setAddLinkLoading] = useState(false)
    const [newLinkTargetType, setNewLinkTargetType] = useState('Post')
    const [newLinkTargetId, setNewLinkTargetId] = useState<any>(null)
    const [newLinkDescription, setNewLinkDescription] = useState('')
    const [targetError, setTargetError] = useState(false)
    const cookies = new Cookies()
    const headerText = totalLinks ? `${totalLinks} link${pluralise(totalLinks)}` : 'No links yet...'
    const incomingLinks = IncomingPosts.length > 0 // || IncomingComments.length
    const outgoingLinks = OutgoingPosts.length > 0 // || OutgoingComments.length

    function getLinks() {
        axios
            .get(`${config.apiURL}/links?itemType=${itemType}&itemId=${id}`)
            .then((res) => {
                console.log('res: ', res)
                setLinkData(res.data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    // function findPosts() {
    //     switch (location) {
    //         case 'space-posts':
    //             return [...spacePosts]
    //         case 'user-posts':
    //             return [...userPosts]
    //         case 'post-page':
    //             return [{ ...postData }]
    //         default:
    //             return []
    //     }
    // }

    function addLink() {
        // if (allValid(formData, setFormData)) {

        setAddLinkLoading(true)
        const data = {
            sourceType: itemType,
            sourceId: itemData.id,
            sourceParentId: null, // todo: set up for comments
            targetType: newLinkTargetType.toLowerCase(),
            targetId: newLinkTargetId,
            targetParentId: null, // todo: set up for comments
            description: newLinkDescription,
            spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
            accountHandle: accountData.handle,
            accountName: accountData.name,
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/add-link`, data, options)
            .then((res) => {
                console.log(res.data)
                setAddLinkLoading(false)
                // // update link state
                // setOutgoingLinks((links) => [
                //     ...links,
                //     {
                //         id: res.data.link.id,
                //         Creator: accountData,
                //         PostB: res.data.itemB,
                //     },
                // ])
                // // update post state
                // const newPosts = findPosts()
                // const post = newPosts.find((p) => p.id === (postId || postData.id))
                // if (itemType === 'post') {
                //     post.totalLinks += 1
                //     post.accountLink = true
                // }
                // if (itemType === 'bead') {
                //     const bead = post.Beads.find((p) => p.id === postData.id)
                //     bead.totalLinks += 1
                //     bead.accountLink = true
                // }
                // if (itemType === 'card') {
                //     const card = post.CardSides.find((p) => p.id === postData.id)
                //     card.totalLinks += 1
                //     card.accountLink = true
                // }
                // // update linked post if in state
                // const linkedPost = newPosts.find((p) => p.id === +linkTarget.value)
                // if (linkedPost) {
                //     linkedPost.totalLinks += 1
                //     linkedPost.accountLink = true
                // }
                // // update linked bead if in state
                // newPosts.forEach((p) => {
                //     const linkedBead = p.Beads.find((b) => b.id === +linkTarget.value)
                //     if (linkedBead) {
                //         linkedBead.totalLinks += 1
                //         linkedBead.accountLink = true
                //     }
                // })
                // // update linked card if in state
                // newPosts.forEach((p) => {
                //     const linkedCard = p.CardSides.find((c) => c.id === +linkTarget.value)
                //     if (linkedCard) {
                //         linkedCard.totalLinks += 1
                //         linkedCard.accountLink = true
                //     }
                // })
                // if (location === 'space-posts') setSpacePosts(newPosts)
                // if (location === 'user-posts') setUserPosts(newPosts)
                // if (location === 'post-page') setPostData(newPosts[0])
                // // reset form data
                // setFormData({
                //     linkTarget: { ...formData.linkTarget, value: '', state: 'default' },
                //     linkDescription: {
                //         ...formData.linkDescription,
                //         value: '',
                //         state: 'default',
                //     },
                // })
                // setResponseLoading(false)
            })
            .catch((error) => {
                console.log(error)
                if (error.response.status === 404) {
                    setTargetError(true)
                    setAddLinkLoading(false)
                }
            })
        // }
    }

    function removeLink(direction, linkId, linkedPostId) {
        const data = { linkId, itemAId: itemData.id, itemBId: linkedPostId }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/remove-link`, data, options)
            .then((res) => {
                console.log(res.data)
                // // update link state
                // if (direction === 'incoming')
                //     setIncomingLinks((links) => links.filter((l) => l.id !== linkId))
                // else setOutgoingLinks((links) => links.filter((l) => l.id !== linkId))
                // // update post state
                // const newPosts = findPosts()
                // const post = newPosts.find((p) => p.id === (postId || postData.id))
                // if (type === 'post') {
                //     post.totalLinks -= 1
                //     const links = direction === 'incoming' ? incomingLinks : outgoingLinks
                //     post.accountLink = !!links.find(
                //         (l) => l.Creator.id === accountData.id && l.id !== linkId
                //     )
                // }
                // if (type === 'bead') {
                //     const bead = post.Beads.find((p) => p.id === postData.id)
                //     bead.totalLinks -= 1
                //     bead.accountLink = false
                // }
                // if (type === 'card') {
                //     const card = post.CardSides.find((p) => p.id === postData.id)
                //     card.totalLinks -= 1
                //     card.accountLink = false
                // }
                // // update linked post if in state
                // const linkedPost = newPosts.find((p) => p.id === linkedPostId)
                // if (linkedPost) {
                //     linkedPost.totalLinks -= 1
                //     linkedPost.accountLink = false
                // }
                // // update linked beads if in state
                // newPosts.forEach((p) => {
                //     const linkedBead = p.Beads.find((b) => b.id === linkedPostId)
                //     if (linkedBead) {
                //         linkedBead.totalLinks -= 1
                //         linkedBead.accountLink = false
                //     }
                // })
                // // update linked card if in state
                // newPosts.forEach((p) => {
                //     const linkedCard = p.CardSides.find((c) => c.id === linkedPostId)
                //     if (linkedCard) {
                //         linkedCard.totalLinks -= 1
                //         linkedCard.accountLink = false
                //     }
                // })
                // if (location === 'space-posts') setSpacePosts(newPosts)
                // if (location === 'user-posts') setUserPosts(newPosts)
                // if (location === 'post-page') setPostData(newPosts[0])
            })
            .catch((error) => console.log(error))
    }

    function renderLink(item, type, direction) {
        return (
            <Row key={item.id} centerY>
                <p className='grey'>linked {direction}</p>
                <ImageTitle
                    type='user'
                    imagePath={item.Creator.flagImagePath}
                    title={`${item.Creator.name}'s`}
                    link={`/u/${item.Creator.handle}/posts`}
                    fontSize={16}
                    style={{ margin: '0 5px' }}
                />
                <TextLink text={type} link={`/p/${item.id}`} />
                {item.Creator.id === accountData.id && (
                    <Button
                        text='Delete'
                        color='blue'
                        size='medium'
                        // onClick={() => removeLink('incoming', link.id, link.PostA.id)}
                    />
                )}
            </Row>
        )
    }

    useEffect(() => getLinks(), [])

    return (
        <Modal close={close} centerX style={{ minWidth: 400 }}>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    <h1>{headerText}</h1>
                    {incomingLinks && (
                        <Column centerX style={{ marginBottom: 20 }}>
                            <h2>Incoming:</h2>
                            {IncomingPosts.map((post) => renderLink(post, 'post', 'from'))}
                        </Column>
                    )}
                    {outgoingLinks && (
                        <Column centerX style={{ marginBottom: 20 }}>
                            <h2>Outgoing:</h2>
                            {OutgoingPosts.map((post) => renderLink(post, 'post', 'to'))}
                        </Column>
                    )}
                    {loggedIn ? (
                        <Column centerX style={{ marginTop: totalLinks ? 20 : 0 }}>
                            <Row centerY style={{ marginBottom: 10 }}>
                                <p>Link to another</p>
                                <DropDownMenu
                                    title=''
                                    orientation='horizontal'
                                    options={['Post', 'Comment', 'User', 'Space']}
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
                                onChange={(value) => setNewLinkTargetId(value)}
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
                                disabled={!newLinkTargetId || newLinkDescription.length > 50}
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
                    )}
                </Column>
            )}
        </Modal>
    )
}

// LinkModal.defaultProps = {
//     postId: null,
// }

export default LinkModal
