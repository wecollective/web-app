import Button from '@components/Button'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Input from '@components/Input'
import LoadingWheel from '@components/LoadingWheel'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import TextLink from '@components/TextLink'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { allValid, defaultErrorState, pluralise } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/Modals/LinkModal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function LinkModal(props: {
    type: 'post' | 'bead'
    location: string
    postId?: number // required for beads
    postData: any
    setPostData: (payload: any) => void
    close: () => void
}): JSX.Element {
    const { type, location, postId, postData, setPostData, close } = props
    const { loggedIn, accountData, setLogInModalOpen, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const { userPosts, setUserPosts } = useContext(UserContext)
    const [incomingLinks, setIncomingLinks] = useState<any[]>([])
    const [outgoingLinks, setOutgoingLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [responseLoading, setResponseLoading] = useState(false)
    const [formData, setFormData] = useState({
        linkTarget: {
            value: '',
            validate: (v) => (!v || !+v || +v === postData.id ? ['Must be a valid post ID'] : []),
            ...defaultErrorState,
        },
        linkDescription: {
            value: '',
            validate: (v) => (v.length > 50 ? ['Max 50 characters'] : []),
            ...defaultErrorState,
        },
    })
    const { linkTarget, linkDescription } = formData
    const cookies = new Cookies()
    const totalLinks = incomingLinks.length + outgoingLinks.length
    const headerText = totalLinks ? `${totalLinks} link${pluralise(totalLinks)}` : 'No links yet...'

    function getLinks() {
        axios
            .get(`${config.apiURL}/post-links?postId=${postData.id}`)
            .then((res) => {
                setIncomingLinks(res.data.IncomingLinks)
                setOutgoingLinks(res.data.OutgoingLinks)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function updateValue(name, value) {
        setFormData({ ...formData, [name]: { ...formData[name], value, state: 'default' } })
    }

    function findPosts() {
        switch (location) {
            case 'space-posts':
                return [...spacePosts]
            case 'user-posts':
                return [...userPosts]
            case 'post-page':
                return [{ ...postData }]
            default:
                return []
        }
    }

    function addLink() {
        setResponseLoading(true)
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            close()
            setAlertMessage('Log in to link posts')
            setAlertModalOpen(true)
        } else if (allValid(formData, setFormData)) {
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                spaceId: window.location.pathname.includes('/s/') ? spaceData.id : null,
                description: linkDescription.value,
                itemAId: postData.id,
                itemBId: +linkTarget.value,
            }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/add-link`, data, options)
                .then((res) => {
                    // update link state
                    setOutgoingLinks((links) => [
                        ...links,
                        {
                            id: res.data.link.id,
                            Creator: accountData,
                            PostB: res.data.itemB,
                        },
                    ])
                    // update post state
                    const newPosts = findPosts()
                    const post = newPosts.find((p) => p.id === (postId || postData.id))
                    if (type === 'post') {
                        post.totalLinks += 1
                        post.accountLink = true
                    } else if (type === 'bead') {
                        // update bead state
                        const bead = post.Beads.find((p) => p.id === postData.id)
                        bead.totalLinks += 1
                        bead.accountLink = true
                    }
                    // update linked post if in state
                    const linkedPost = newPosts.find((p) => p.id === +linkTarget.value)
                    if (linkedPost) {
                        linkedPost.totalLinks += 1
                        linkedPost.accountLink = true
                    }
                    // update linked bead if in state
                    newPosts.forEach((p) => {
                        const linkedBead = p.Beads.find((b) => b.id === +linkTarget.value)
                        if (linkedBead) {
                            linkedBead.totalLinks += 1
                            linkedBead.accountLink = true
                        }
                    })
                    if (location === 'space-posts') setSpacePosts(newPosts)
                    if (location === 'user-posts') setUserPosts(newPosts)
                    if (location === 'post-page') setPostData(newPosts[0])
                    // reset form data
                    setFormData({
                        linkTarget: { ...formData.linkTarget, value: '', state: 'default' },
                        linkDescription: {
                            ...formData.linkDescription,
                            value: '',
                            state: 'default',
                        },
                    })
                    setResponseLoading(false)
                })
                .catch((error) => {
                    console.log(error)
                    if (error.response.status === 404) {
                        setFormData({
                            ...formData,
                            linkTarget: {
                                ...formData.linkTarget,
                                state: 'invalid',
                                errors: ['Post not found.'],
                            },
                        })
                        setResponseLoading(false)
                    }
                })
        } else setResponseLoading(false)
    }

    function removeLink(direction, linkId, linkedPostId) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            close()
            setAlertMessage('Log in to link posts')
            setAlertModalOpen(true)
        } else {
            const data = { linkId, itemAId: postData.id, itemBId: linkedPostId }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/remove-link`, data, options)
                .then(() => {
                    // update link state
                    if (direction === 'incoming')
                        setIncomingLinks((links) => links.filter((l) => l.id !== linkId))
                    else setOutgoingLinks((links) => links.filter((l) => l.id !== linkId))
                    // update post state
                    const newPosts = findPosts()
                    const post = newPosts.find((p) => p.id === (postId || postData.id))
                    if (type === 'post') {
                        post.totalLinks -= 1
                        const links = direction === 'incoming' ? incomingLinks : outgoingLinks
                        post.accountLink = !!links.find(
                            (l) => l.Creator.id === accountData.id && l.id !== linkId
                        )
                    } else if (type === 'bead') {
                        // update bead state
                        const bead = post.Beads.find((p) => p.id === postData.id)
                        bead.totalLinks -= 1
                        bead.accountLink = false
                    }
                    // update linked post if in state
                    const linkedPost = newPosts.find((p) => p.id === linkedPostId)
                    if (linkedPost) {
                        linkedPost.totalLinks -= 1
                        linkedPost.accountLink = false
                    }
                    // update linked beads if in state
                    newPosts.forEach((p) => {
                        const linkedBead = p.Beads.find((b) => b.id === linkedPostId)
                        if (linkedBead) {
                            linkedBead.totalLinks -= 1
                            linkedBead.accountLink = false
                        }
                    })
                    if (location === 'space-posts') setSpacePosts(newPosts)
                    if (location === 'user-posts') setUserPosts(newPosts)
                    if (location === 'post-page') setPostData(newPosts[0])
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => getLinks(), [])

    return (
        <Modal close={close} centerX style={{ minWidth: 400 }}>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column centerX>
                    <h1>{headerText}</h1>
                    {incomingLinks.length > 0 && (
                        <div className={styles.links}>
                            <h2>Incoming:</h2>
                            {incomingLinks.map((link) => (
                                <Row key={link.id} centerY>
                                    <ImageTitle
                                        type='user'
                                        imagePath={link.Creator.flagImagePath}
                                        title={link.Creator.name}
                                        link={`/u/${link.Creator.handle}/posts`}
                                    />
                                    <p>linked from</p>
                                    <ImageTitle
                                        type='user'
                                        imagePath={link.PostA.Creator.flagImagePath}
                                        title={`${link.PostA.Creator.name}'s`}
                                        link={`/u/${link.PostA.Creator.handle}/posts`}
                                    />
                                    <TextLink text='post' link={`/p/${link.PostA.id}`} />
                                    {link.Creator.id === accountData.id && (
                                        <Button
                                            text='Delete'
                                            color='blue'
                                            size='medium'
                                            onClick={() =>
                                                removeLink('incoming', link.id, link.PostA.id)
                                            }
                                        />
                                    )}
                                </Row>
                            ))}
                        </div>
                    )}
                    {outgoingLinks.length > 0 && (
                        <div className={styles.links}>
                            <h2>Outgoing:</h2>
                            {outgoingLinks.map((link) => (
                                <Row key={link.id} centerY>
                                    <ImageTitle
                                        type='user'
                                        imagePath={link.Creator.flagImagePath}
                                        title={link.Creator.name}
                                        link={`/u/${link.Creator.handle}/posts`}
                                    />
                                    <p>linked to</p>
                                    <ImageTitle
                                        type='user'
                                        imagePath={link.PostB.Creator.flagImagePath}
                                        title={`${link.PostB.Creator.name}'s`}
                                        link={`/u/${link.PostB.Creator.handle}/posts`}
                                    />
                                    <TextLink text='post' link={`/p/${link.PostB.id}`} />
                                    {link.Creator.id === accountData.id && (
                                        <Button
                                            text='Delete'
                                            color='blue'
                                            size='medium'
                                            onClick={() =>
                                                removeLink('outgoing', link.id, link.PostB.id)
                                            }
                                        />
                                    )}
                                </Row>
                            ))}
                        </div>
                    )}
                    {loggedIn ? (
                        <Column centerX style={{ marginTop: totalLinks ? 20 : 0 }}>
                            <Input
                                title='Link to another post'
                                type='text'
                                prefix='p/'
                                value={linkTarget.value}
                                state={linkTarget.state}
                                errors={linkTarget.errors}
                                onChange={(v) => updateValue('linkTarget', v)}
                                style={{ marginBottom: 10 }}
                            />
                            <Input
                                title='Description (optional)'
                                type='text'
                                placeholder='link description...'
                                value={linkDescription.value}
                                state={linkDescription.state}
                                errors={linkDescription.errors}
                                onChange={(v) => updateValue('linkDescription', v)}
                                style={{ marginBottom: 30 }}
                            />
                            <Button
                                text='Add link'
                                color='blue'
                                onClick={addLink}
                                loading={responseLoading}
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

LinkModal.defaultProps = {
    postId: null,
}

export default LinkModal
