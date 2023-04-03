import Button from '@components/Button'
import ImageNameLink from '@components/ImageNameLink'
import Row from '@components/Row'
import TextLink from '@components/TextLink'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/NotificationCard.module.scss'
import {
    AtIcon,
    BabyIcon,
    BellIcon,
    CommentIcon,
    EnvelopeIcon,
    FailIcon,
    InquiryIcon,
    LinkIcon,
    RetweetIcon,
    SpacesIcon,
    StarIcon,
    StringIcon,
    SuccessIcon,
    ThumbsUpIcon,
    WeaveIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function Content(props: { typeIcon: JSX.Element; children: any }): JSX.Element {
    const { typeIcon, children } = props
    return (
        <>
            <div className={styles.typeIcon}>{typeIcon}</div>
            <div className={styles.content}>{children}</div>
        </>
    )
}

function CreatedAt(props: { date: string }): JSX.Element {
    const { date } = props
    return <p title={dateCreated(date)}>• {timeSinceCreated(date)}</p>
}

function Success(): JSX.Element {
    return (
        <div className={`${styles.inlineIcon} ${styles.green}`}>
            <SuccessIcon />
        </div>
    )
}

function Fail(): JSX.Element {
    return (
        <div className={`${styles.inlineIcon} ${styles.red}`}>
            <FailIcon />
        </div>
    )
}

function State(props: {
    state: 'pending' | 'accepted' | 'rejected'
    respond: (response: 'accepted' | 'rejected') => void
}): JSX.Element {
    const { state, respond } = props
    const [acceptLoading, setAcceptLoading] = useState(false)
    const [rejectLoading, setRejectLoading] = useState(false)

    return (
        <div className={styles.state}>
            {state === 'pending' && (
                <>
                    <Button
                        text='Accept'
                        color='blue'
                        size='medium'
                        loading={acceptLoading}
                        onClick={() => {
                            setAcceptLoading(true)
                            respond('accepted')
                        }}
                        style={{ marginRight: 5 }}
                    />
                    <Button
                        text='Reject'
                        color='aqua'
                        size='medium'
                        loading={rejectLoading}
                        onClick={() => {
                            setRejectLoading(true)
                            respond('rejected')
                        }}
                        style={{ marginRight: 5 }}
                    />
                </>
            )}
            {state === 'accepted' && (
                <>
                    <p>•</p>
                    <p className={styles.green}>Accepted</p>
                    <Success />
                </>
            )}
            {state === 'rejected' && (
                <>
                    <p>•</p>
                    <p className={styles.red}>Rejected</p>
                    <Fail />
                </>
            )}
        </div>
    )
}

function NotificationCard(props: {
    notification: any
    location: 'account' | 'space'
    updateNotification: (id, key, payload) => void
}): JSX.Element {
    const { notification, location, updateNotification } = props
    const {
        id,
        type,
        state,
        postId,
        commentId,
        triggerUser,
        triggerSpace,
        secondarySpace,
        relatedPost,
        createdAt,
    } = notification

    const { accountData, updateAccountData, setAlertMessage, setAlertModalOpen } =
        useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [seen, setSeen] = useState(notification.seen)
    const cookies = new Cookies()

    function respondToSpaceInvite(response) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again to respond.')
            setAlertModalOpen(true)
        } else {
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                spaceId: triggerSpace.id,
                spaceHandle: triggerSpace.handle,
                spaceName: triggerSpace.name,
                notificationId: id,
                userId: triggerUser.id,
                response,
            }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/respond-to-space-invite`, data, options)
                .then(() => updateNotification(id, 'state', response))
                .catch((error) => console.log(error))
        }
    }

    function respondToSpaceAccessRequest(response) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again to respond.')
            setAlertModalOpen(true)
        } else {
            const data = {
                accountHandle: accountData.handle,
                accountName: accountData.name,
                spaceId: triggerSpace.id,
                spaceHandle: triggerSpace.handle,
                spaceName: triggerSpace.name,
                notificationId: id,
                userId: triggerUser.id,
                response,
            }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/respond-to-space-access-request`, data, options)
                .then(() => updateNotification(id, 'state', response))
                .catch((error) => console.log(error))
        }
    }

    function respondToModInvite(response) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again to respond.')
            setAlertModalOpen(true)
        } else {
            const data = {
                notificationId: id,
                userId: triggerUser.id,
                spaceId: triggerSpace.id,
                response,
            }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/respond-to-mod-invite`, data, authHeader)
                .then((res) => {
                    if (res.status === 200) {
                        // update account context
                        updateNotification(id, 'state', response)
                        // todo: update if/when required
                        // if (response === 'accepted') {
                        //     const newModeratedSpaces = [
                        //         ...accountData.ModeratedSpaces,
                        //         {
                        //             handle: triggerSpace.handle,
                        //             name: triggerSpace.name,
                        //             flagImagePath: triggerSpace.flagImagePath,
                        //         },
                        //     ]
                        //     updateAccountData('ModeratedSpaces', newModeratedSpaces)
                        // }
                        if (!seen) {
                            setSeen(true)
                            // todo: remove updateNotification function when notifications fetched on component mount
                            updateNotification(id, 'seen', true)
                            updateAccountData(
                                'unseenNotifications',
                                accountData.unseenNotifications - 1
                            )
                        }
                    } else {
                        // handle errors
                        console.log(res.data.message)
                    }
                })
                .catch((res) => console.log('res: ', res))
        }
    }

    function respondToParentSpaceRequest(response) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again to respond.')
            setAlertModalOpen(true)
        } else {
            const data = {
                requestorId: triggerUser.id,
                childId: triggerSpace.id,
                parentId: secondarySpace.id,
                response,
            }
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/respond-to-parent-space-request`, data, options)
                .then(() => {
                    updateNotification(id, 'state', response)
                    if (!notification.seen) {
                        updateNotification(id, 'seen', true)
                        updateAccountData(
                            'unseenNotifications',
                            accountData.unseenNotifications - 1
                        )
                    }
                })
                .catch((error) => console.log('error: ', error))
        }
    }

    function respondToWeaveInvite(response) {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Your session has run out. Please log in again to respond.')
            setAlertModalOpen(true)
        } else {
            const data = { postId, notificationId: id, response }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/respond-to-gbg-invite`, data, authHeader)
                .then(() => updateNotification(id, 'state', response))
                .catch((error) => console.log(error))
        }
    }

    // todo: use switch case to render different notification types

    return (
        <Row centerX className={styles.wrapper}>
            {location === 'account' && (
                <>
                    {type === 'welcome-message' && (
                        <Content typeIcon={<BabyIcon />}>
                            <p>Account created</p>
                            <Success />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'email-verified' && (
                        <Content typeIcon={<EnvelopeIcon />}>
                            <p>Email verified</p>
                            <Success />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-like' && (
                        <Content typeIcon={<ThumbsUpIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>liked your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-comment' && (
                        <Content typeIcon={<CommentIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>commented on your</p>
                            <TextLink text='post' link={`/p/${postId}?commentId=${commentId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-repost' && (
                        <Content typeIcon={<RetweetIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>reposted your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-rating' && (
                        <Content typeIcon={<StarIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>rated your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-link' && (
                        <Content typeIcon={<LinkIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>linked your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {/* todo: add postAId and postBId columns in the database so secondary post can be linked */}
                            <p>to another post</p>
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-mention' && (
                        <Content typeIcon={<AtIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just mentioned you in a</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'bead-mention' && (
                        <Content typeIcon={<AtIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just mentioned you in a</p>
                            <TextLink text='bead' link={`/p/${postId}`} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'comment-reply' && (
                        <Content typeIcon={<CommentIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>replied to your</p>
                            <TextLink text='comment' link={`/p/${postId}?commentId=${commentId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'comment-mention' && (
                        <Content typeIcon={<AtIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just mentioned you in a</p>
                            <TextLink text='comment' link={`/p/${postId}?commentId=${commentId}`} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'parent-space-request' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>wants to make</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <p>a child space of</p>
                            <ImageNameLink type='space' data={secondarySpace} />
                            <CreatedAt date={createdAt} />
                            <State
                                state={state}
                                respond={(response) => respondToParentSpaceRequest(response)}
                            />
                        </Content>
                    )}

                    {type === 'parent-space-request-response' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>{state} your request to make</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <p>a child space of</p>
                            <ImageNameLink type='space' data={secondarySpace} />
                            {/* {state === 'accepted' ? <Success /> : <Fail />} */}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'space-invite' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>invited you to join</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                            <State
                                state={state}
                                respond={(response) => respondToSpaceInvite(response)}
                            />
                        </Content>
                    )}

                    {type === 'space-invite-response' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>{state} your invitation to join</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'space-access-request' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>requested access to</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                            <State
                                state={state}
                                respond={(response) => respondToSpaceAccessRequest(response)}
                            />
                        </Content>
                    )}

                    {type === 'space-access-response' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>{state} your request to access</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'mod-invite' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>invited you to moderate</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                            <State
                                state={state}
                                respond={(response) => respondToModInvite(response)}
                            />
                        </Content>
                    )}

                    {type === 'mod-invite-response' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>{state} your invitation to moderate</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'mod-removed' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just removed you from moderating</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'event-going-reminder' && (
                        <Content typeIcon={<BellIcon />}>
                            <p>An</p>
                            <TextLink text='event' link={`/p/${postId}`} />
                            <p>you marked yourself as going to is starting in 15 minutes</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'event-interested-reminder' && (
                        <Content typeIcon={<BellIcon />}>
                            <p>An</p>
                            <TextLink text='event' link={`/p/${postId}`} />
                            <p>you marked yourself as interested in is starting in 15 minutes</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-invitation' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>invited you to join a</p>
                            <TextLink text='glass bead game' link={`/p/${postId}`} />
                            <State
                                state={state}
                                respond={(response) => respondToWeaveInvite(response)}
                            />
                            {/* {relatedPost.Weave.state === 'cancelled' && <p>Game cancelled</p>} */}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-accepted' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>accepted your</p>
                            <TextLink text='glass bead game' link={`/p/${postId}`} />
                            <p>invite</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-rejected' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>has rejected their</p>
                            <TextLink text='glass bead game' link={`/p/${postId}`} />
                            <p>invite so the game has been cancelled</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-move' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <p>It&apos;s your move! Add the next bead to the</p>
                            <TextLink text='glass bead game' link={`/p/${postId}`} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-move-from-other-player' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just added a new bead to a</p>
                            <TextLink text='glass bead game' link={`/p/${postId}`} />
                            <p>you have particpated in</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-creator-move-from-other-player' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just added a new bead to a</p>
                            <TextLink text='glass bead game' link={`/p/${postId}`} />
                            <p>you created</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-move-reminder' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <p>You have 15 minutes left to complete your move on</p>
                            <TextLink text='this glass bead game!' link={`/p/${postId}`} />
                            <p>If you fail to do this, the game ends!</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-cancelled' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>failed to make their move in time on</p>
                            <TextLink text='this glass bead game.' link={`/p/${postId}`} />
                            <p>The game has now ended!</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'gbg-ended' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <p>A</p>
                            <TextLink text='glass bead game' link={`/p/${postId}`} />
                            <p>you participated in has ended</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'new-gbg-from-your-post' && (
                        <Content typeIcon={<StringIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just created a</p>
                            <TextLink text='string' link={`/p/${postId}`} />
                            <p>from your post</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'poll-vote' && (
                        <Content typeIcon={<InquiryIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just voted on your</p>
                            <TextLink text='Poll' link={`/p/${postId}`} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}
                </>
            )}

            {/* {location === 'space' && (
                <>
                    {type === 'parent-space-request' && (
                        <Content typeIcon={<SpacesIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>wants to make</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <p>a child space of</p>
                            <ImageNameLink type='space' data={spaceData} />
                            <CreatedAt date={createdAt} />
                            <State
                                state={state}
                                respond={(response) => respondToParentSpaceRequest(response)}
                            />
                        </Content>
                    )}
                </>
            )} */}
        </Row>
    )
}

export default NotificationCard
