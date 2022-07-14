import Button from '@components/Button'
import ImageNameLink from '@components/ImageNameLink'
import Row from '@components/Row'
import TextLink from '@components/TextLink'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/NotificationCard.module.scss'
import { ReactComponent as BabyIconSVG } from '@svgs/baby-solid.svg'
import { ReactComponent as BellIconSVG } from '@svgs/bell-solid.svg'
import { ReactComponent as SuccessIconSVG } from '@svgs/check-circle-solid.svg'
import { ReactComponent as CommentIconSVG } from '@svgs/comment-solid.svg'
import { ReactComponent as EnvelopeIconSVG } from '@svgs/envelope-solid.svg'
import { ReactComponent as LinkIconSVG } from '@svgs/link-solid.svg'
import { ReactComponent as WeaveIcon } from '@svgs/multiplayer-string-icon.svg'
import { ReactComponent as OverlappingCirclesIconSVG } from '@svgs/overlapping-circles-thick.svg'
import { ReactComponent as RetweetIconSVG } from '@svgs/retweet-solid.svg'
import { ReactComponent as StarIconSVG } from '@svgs/star-solid.svg'
import { ReactComponent as ThumbsUpIconSVG } from '@svgs/thumbs-up-solid.svg'
import { ReactComponent as FailIconSVG } from '@svgs/times-circle-regular.svg'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

const Content = (props: { typeIcon: JSX.Element; children: any }): JSX.Element => {
    const { typeIcon, children } = props
    return (
        <>
            <div className={styles.typeIcon}>{typeIcon}</div>
            <div className={styles.content}>{children}</div>
        </>
    )
}

const CreatedAt = (props: { date: string }): JSX.Element => {
    const { date } = props
    return <p title={dateCreated(date)}>• {timeSinceCreated(date)}</p>
}

const SuccessIcon = (): JSX.Element => {
    return (
        <div className={`${styles.inlineIcon} ${styles.green}`}>
            <SuccessIconSVG />
        </div>
    )
}

const FailIcon = (): JSX.Element => {
    return (
        <div className={`${styles.inlineIcon} ${styles.red}`}>
            <FailIconSVG />
        </div>
    )
}

const State = (props: {
    state: 'pending' | 'accepted' | 'rejected'
    respond: (response: 'accepted' | 'rejected') => void
}): JSX.Element => {
    const { state, respond } = props

    return (
        <div className={styles.state}>
            {state === 'pending' && (
                <>
                    <Button
                        text='Accept'
                        color='blue'
                        size='medium'
                        style={{ marginRight: 5 }}
                        onClick={() => respond('accepted')}
                    />
                    <Button
                        text='Reject'
                        color='aqua'
                        size='medium'
                        style={{ marginRight: 5 }}
                        onClick={() => respond('rejected')}
                    />
                </>
            )}
            {state === 'accepted' && (
                <>
                    <p>•</p>
                    <p className={styles.green}>Accepted</p>
                    <SuccessIcon />
                </>
            )}
            {state === 'rejected' && (
                <>
                    <p>•</p>
                    <p className={styles.red}>Rejected</p>
                    <FailIcon />
                </>
            )}
        </div>
    )
}

const NotificationCard = (props: {
    notification: any
    location: 'account' | 'space'
    updateNotification: (id, key, payload) => void
}): JSX.Element => {
    // todo: add location prop: 'account' | 'space'
    const { notification, location, updateNotification } = props
    const {
        id,
        type,
        state,
        postId,
        // commentId,
        triggerUser,
        triggerSpace,
        secondarySpace,
        relatedPost,
        createdAt,
    } = notification

    // console.log(notification)

    const { accountData, updateAccountData } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)

    const [seen, setSeen] = useState(notification.seen)

    const cookies = new Cookies()
    const accessToken = cookies.get('accessToken')
    const you = triggerUser && accountData.id === triggerUser.id

    function respondToModInvite(response) {
        if (!accessToken) {
            // todo: open alert modal, tell user to log in
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
                        if (response === 'accepted') {
                            const newModeratedSpaces = [
                                ...accountData.ModeratedHolons,
                                {
                                    handle: triggerSpace.handle,
                                    name: triggerSpace.name,
                                    flagImagePath: triggerSpace.flagImagePath,
                                },
                            ]
                            updateAccountData('ModeratedHolons', newModeratedSpaces)
                        }
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
        if (!accessToken) {
            // todo: open alert modal, tell user to log in
        } else {
            const data = {
                notificationId: id,
                notificationType: 'account',
                accountHandle: accountData.handle,
                accountName: accountData.name,
                triggerUser,
                childSpace: triggerSpace,
                parentSpace: secondarySpace,
                response,
            }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/respond-to-parent-space-request`, data, authHeader)
                .then((res) => {
                    if (res.data === 'success') {
                        updateNotification(id, 'state', response)
                        if (!seen) {
                            setSeen(true)
                            updateNotification(id, 'seen', true)
                            updateAccountData(
                                'unseenNotifications',
                                accountData.unseenNotifications - 1
                            )
                        }
                    } else {
                        // handle errors
                        console.log(res.data)
                    }
                })
                .catch((res) => console.log('res: ', res))
        }
    }

    function respondToMultiplayerStringInvite(response) {
        if (accessToken) {
            const data = { postId, notificationId: id, response }
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/respond-to-weave-invite`, data, authHeader)
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
                        <Content typeIcon={<BabyIconSVG />}>
                            <p>Account created</p>
                            <SuccessIcon />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'email-verified' && (
                        <Content typeIcon={<EnvelopeIconSVG />}>
                            <p>Email verified</p>
                            <SuccessIcon />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-like' && (
                        <Content typeIcon={<ThumbsUpIconSVG />}>
                            {you ? <p>You</p> : <ImageNameLink type='user' data={triggerUser} />}
                            <p>liked your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-comment' && (
                        <Content typeIcon={<CommentIconSVG />}>
                            {you ? <p>You</p> : <ImageNameLink type='user' data={triggerUser} />}
                            <p>commented on your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-repost' && (
                        <Content typeIcon={<RetweetIconSVG />}>
                            {you ? <p>You</p> : <ImageNameLink type='user' data={triggerUser} />}
                            <p>reposted your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-rating' && (
                        <Content typeIcon={<StarIconSVG />}>
                            {you ? <p>You</p> : <ImageNameLink type='user' data={triggerUser} />}
                            <p>rated your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'post-link' && (
                        <Content typeIcon={<LinkIconSVG />}>
                            {you ? <p>You</p> : <ImageNameLink type='user' data={triggerUser} />}
                            <p>linked your</p>
                            <TextLink text='post' link={`/p/${postId}`} />
                            {/* todo: add postAId and postBId columns in the database so secondary post can be linked */}
                            <p>to another post</p>
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'comment-reply' && (
                        <Content typeIcon={<CommentIconSVG />}>
                            {you ? <p>You</p> : <ImageNameLink type='user' data={triggerUser} />}
                            <p>replied to your</p>
                            <TextLink text='comment' link={`/p/${postId}`} />
                            {triggerSpace && <p>in</p>}
                            {triggerSpace && <ImageNameLink type='space' data={triggerSpace} />}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'parent-space-request' && (
                        <Content typeIcon={<OverlappingCirclesIconSVG />}>
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
                        <Content typeIcon={<OverlappingCirclesIconSVG />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>{state} your request to make</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <p>a child space of</p>
                            <ImageNameLink type='space' data={secondarySpace} />
                            {/* {state === 'accepted' ? <SuccessIcon /> : <FailIcon />} */}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'mod-invite' && (
                        <Content typeIcon={<OverlappingCirclesIconSVG />}>
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
                        <Content typeIcon={<OverlappingCirclesIconSVG />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>{state} your invitation to moderate</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'mod-removed' && (
                        <Content typeIcon={<OverlappingCirclesIconSVG />}>
                            {you ? <p>You</p> : <ImageNameLink type='user' data={triggerUser} />}
                            <p>just removed you from moderating</p>
                            <ImageNameLink type='space' data={triggerSpace} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'event-going-reminder' && (
                        <Content typeIcon={<BellIconSVG />}>
                            <p>An</p>
                            <TextLink text='event' link={`/p/${postId}`} />
                            <p>you marked yourself as going to is starting in 15 minutes</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'event-interested-reminder' && (
                        <Content typeIcon={<BellIconSVG />}>
                            <p>An</p>
                            <TextLink text='event' link={`/p/${postId}`} />
                            <p>you marked yourself as interested in is starting in 15 minutes</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-invitation' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>invited you to join a</p>
                            <TextLink text='weave' link={`/p/${postId}`} />
                            {relatedPost.Weave.state === 'cancelled' ? (
                                <p>Game cancelled</p>
                            ) : (
                                <State
                                    state={state}
                                    respond={(response) =>
                                        respondToMultiplayerStringInvite(response)
                                    }
                                />
                            )}
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-accepted' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>accepted your</p>
                            <TextLink text='weave' link={`/p/${postId}`} />
                            <p>invite</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-rejected' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>has rejected their</p>
                            <TextLink text='weave' link={`/p/${postId}`} />
                            <p>invite so the game has been cancelled</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-move' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <p>It's your move! Add the next bead to the</p>
                            <TextLink text='weave' link={`/p/${postId}`} />
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-move-from-other-player' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just added a new bead to a</p>
                            <TextLink text='weave' link={`/p/${postId}`} />
                            <p>you have particpated in</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-creator-move-from-other-player' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>just added a new bead to a</p>
                            <TextLink text='weave' link={`/p/${postId}`} />
                            <p>you created</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-move-reminder' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <p>You have 15 minutes left to complete your move on</p>
                            <TextLink text='this weave!' link={`/p/${postId}`} />
                            <p>If you fail to do this, the game ends!</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-cancelled' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <ImageNameLink type='user' data={triggerUser} />
                            <p>failed to make their move in time on</p>
                            <TextLink text='this weave.' link={`/p/${postId}`} />
                            <p>The game has now ended!</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}

                    {type === 'weave-ended' && (
                        <Content typeIcon={<WeaveIcon />}>
                            <p>A</p>
                            <TextLink text='weave' link={`/p/${postId}`} />
                            <p>you participated in has ended</p>
                            <CreatedAt date={createdAt} />
                        </Content>
                    )}
                </>
            )}

            {location === 'space' && (
                <>
                    {type === 'parent-space-request' && (
                        <Content typeIcon={<OverlappingCirclesIconSVG />}>
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
            )}
        </Row>
    )
}

export default NotificationCard
