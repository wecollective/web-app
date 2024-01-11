import Button from '@components/Button'
import Column from '@components/Column'
import Row from '@components/Row'
import SpaceButton from '@components/SpaceButton'
import TextLink from '@components/TextLink'
import UserButton from '@components/UserButton'
import CommentCardPreview from '@components/cards/Comments/CommentCardPreview'
import PostCardPreview from '@components/cards/PostCard/PostCardPreview'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import styles from '@styles/components/cards/NotificationCard.module.scss'
import {
    AtIcon,
    BabyIcon,
    BellIcon,
    CastaliaIcon,
    CommentIcon,
    EnvelopeIcon,
    EyeClosedIcon,
    EyeIcon,
    FailIcon,
    LikeIcon,
    LinkIcon,
    PollIcon,
    PostIcon,
    RetweetIcon,
    SpacesIcon,
    StarIcon,
    SuccessIcon,
} from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function Content(props: {
    typeIcon: JSX.Element
    children: any
    preview?: JSX.Element
}): JSX.Element {
    const { typeIcon, children, preview } = props
    return (
        <Column style={{ width: '100%' }}>
            <Row centerY style={{ width: '100%' }}>
                <Column centerX centerY className={styles.typeIcon}>
                    {typeIcon}
                </Column>
                <Row wrap className={styles.content}>
                    {children}
                </Row>
            </Row>
            {preview}
        </Column>
    )
}
Content.defaultProps = { preview: null }

function CreatedAt(props: { date: string }): JSX.Element {
    const { date } = props
    return <p title={dateCreated(date)}>{timeSinceCreated(date)}</p>
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
        spaceAId,
        triggerUser,
        triggerSpace,
        secondarySpace,
        relatedPost,
        relatedComment,
        createdAt,
    } = notification

    const { accountData, setAccountData } = useContext(AccountContext)
    const [seen, setSeen] = useState(notification.seen)
    const [seenLoading, setSeenLoading] = useState(false)
    const cookies = new Cookies()

    function toggleSeen() {
        setSeenLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/toggle-notification-seen`, { id, seen: !seen }, options)
            .then(() => {
                setSeen(!seen)
                setAccountData({
                    ...accountData,
                    unseenNotifications: accountData.unseenNotifications + (seen ? 1 : -1),
                })
                setSeenLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function markAsSeen() {
        if (!seen) toggleSeen()
    }

    // todo: get account data server side in all function below
    function respondToSpaceInvite(response) {
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
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/respond-to-space-invite`, data, options)
            .then(() => {
                updateNotification(id, 'state', response)
                markAsSeen()
            })
            .catch((error) => console.log(error))
    }

    function respondToSpaceAccessRequest(response) {
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
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/respond-to-space-access-request`, data, options)
            .then(() => {
                updateNotification(id, 'state', response)
                markAsSeen()
            })
            .catch((error) => console.log(error))
    }

    function respondToModInvite(response) {
        const data = {
            notificationId: id,
            userId: triggerUser.id,
            spaceId: triggerSpace.id,
            response,
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/respond-to-mod-invite`, data, options)
            .then((res) => {
                updateNotification(id, 'state', response)
                markAsSeen()
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
            })
            .catch((error) => console.log(error))
    }

    function respondToParentSpaceRequest(response) {
        const data = {
            requestorId: triggerUser.id,
            childId: triggerSpace.id,
            parentId: secondarySpace.id,
            response,
        }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/respond-to-parent-space-request`, data, options)
            .then(() => {
                updateNotification(id, 'state', response)
                markAsSeen()
            })
            .catch((error) => console.log(error))
    }

    function respondToWeaveInvite(response) {
        const data = { postId, notificationId: id, response }
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/respond-to-gbg-invite`, data, options)
            .then(() => {
                updateNotification(id, 'state', response)
                markAsSeen()
            })
            .catch((error) => console.log(error))
    }

    function linkUrl() {
        // todo: include linkId when set up
        if (postId) return `/linkmap?item=post&id=${postId}`
        if (commentId) return `/linkmap?item=comment&id=${commentId}`
        if (spaceAId) return `/linkmap?item=space&id=${spaceAId}`
        return `/linkmap?item=user&id=${accountData.id}`
    }

    useEffect(() => setSeen(notification.seen), [notification])

    // todo: use switch case to render different notification types?

    return (
        <Row centerX className={`${styles.wrapper} ${!seen && styles.unseen}`}>
            <button
                className={styles.seenButton}
                type='button'
                onClick={toggleSeen}
                disabled={seenLoading}
            >
                {seen ? <EyeIcon /> : <EyeClosedIcon />}
            </button>

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

            {type.includes('-like') && (
                <Content
                    typeIcon={<LikeIcon />}
                    preview={
                        type.includes('comment') ? (
                            <CommentCardPreview
                                comment={relatedComment}
                                link={`/p/${commentId}`}
                                onClick={markAsSeen}
                                style={{ marginTop: 10 }}
                            />
                        ) : (
                            <PostCardPreview
                                post={relatedPost}
                                link={`/p/${postId}`}
                                onClick={markAsSeen}
                                style={{ marginTop: 10 }}
                            />
                        )
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>liked your {type.split('-like')[0].replaceAll('-', ' ')}</p>
                    {triggerSpace && <p>in</p>}
                    {triggerSpace && (
                        <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    )}
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'post-comment' && (
                <Content
                    typeIcon={<CommentIcon />}
                    preview={
                        <Column>
                            <PostCardPreview
                                post={relatedPost}
                                link={`/p/${postId}`}
                                onClick={markAsSeen}
                                style={{ marginTop: 10 }}
                            />
                            <CommentCardPreview
                                comment={relatedComment}
                                link={`/p/${commentId}`}
                                onClick={markAsSeen}
                                style={{ marginTop: 10 }}
                            />
                        </Column>
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>commented on your post</p>
                    {triggerSpace && <p>in</p>}
                    {triggerSpace && (
                        <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    )}
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'post-repost' && (
                <Content
                    typeIcon={<RetweetIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>reposted your post</p>
                    {triggerSpace && <p>in</p>}
                    {triggerSpace && (
                        <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    )}
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type.includes('-rating') && (
                <Content
                    typeIcon={<StarIcon />}
                    preview={
                        type.includes('comment') ? (
                            <CommentCardPreview
                                comment={relatedComment}
                                link={`/p/${commentId}`}
                                onClick={markAsSeen}
                                style={{ marginTop: 10 }}
                            />
                        ) : (
                            <PostCardPreview
                                post={relatedPost}
                                link={`/p/${postId}`}
                                onClick={markAsSeen}
                                style={{ marginTop: 10 }}
                            />
                        )
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>rated your {type.split('-rating')[0].replaceAll('-', ' ')}</p>
                    {triggerSpace && <p>in</p>}
                    {triggerSpace && (
                        <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    )}
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {['post-link-source', 'post-link-target'].includes(type) && (
                <Content
                    typeIcon={<LinkIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/linkmap?item=post&id=${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>added a link to your post</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {['comment-link-source', 'comment-link-target'].includes(type) && (
                <Content
                    typeIcon={<LinkIcon />}
                    preview={
                        <CommentCardPreview
                            comment={relatedComment}
                            link={`/linkmap?item=comment&id=${commentId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>added a link to your comment</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {['user-link-source', 'user-link-target'].includes(type) && (
                <Content typeIcon={<LinkIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>added a link to</p>
                    <TextLink text='you' link={`/linkmap?item=user&id=${accountData.id}`} />
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {['space-link-source', 'space-link-target'].includes(type) && (
                <Content typeIcon={<LinkIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>added a link to your</p>
                    <TextLink text='space' link={`/linkmap?item=space&id=${spaceAId}`} />
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'link-like' && (
                <Content typeIcon={<LikeIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>liked your</p>
                    <TextLink text='link' link={linkUrl()} />
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'post-mention' && (
                <Content
                    typeIcon={<AtIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>mentioned you in a post</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'post-removed-by-mods' && (
                <Content
                    typeIcon={<PostIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <p>Your post was removed from</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <p>by its mods</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'bead-mention' && (
                <Content
                    typeIcon={<AtIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>mentioned you in a bead</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {/* todo: set up dual comments */}
            {type === 'comment-reply' && (
                <Content
                    typeIcon={<CommentIcon />}
                    preview={
                        <Column>
                            {relatedPost.type === 'comment' && (
                                <CommentCardPreview
                                    comment={relatedPost}
                                    link={`/p/${postId}`}
                                    onClick={markAsSeen}
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            <CommentCardPreview
                                comment={relatedComment}
                                link={`/p/${commentId}`}
                                onClick={markAsSeen}
                                style={{ marginTop: 10 }}
                            />
                        </Column>
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>replied to your comment</p>
                    {triggerSpace && <p>in</p>}
                    {triggerSpace && (
                        <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    )}
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'comment-mention' && (
                <Content
                    typeIcon={<AtIcon />}
                    preview={
                        <CommentCardPreview
                            comment={relatedComment}
                            link={`/p/${commentId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>mentioned you in a comment</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'parent-space-request' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>wants to make</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <p>a child space of</p>
                    <SpaceButton space={secondarySpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                    <State
                        state={state}
                        respond={(response) => respondToParentSpaceRequest(response)}
                    />
                </Content>
            )}

            {type === 'parent-space-request-response' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>{state} your request to make</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <p>a child space of</p>
                    <SpaceButton space={secondarySpace} imageSize={32} fontSize={15} />
                    {/* {state === 'accepted' ? <Success /> : <Fail />} */}
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'space-invite' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>invited you to join</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                    <State state={state} respond={(response) => respondToSpaceInvite(response)} />
                </Content>
            )}

            {type === 'space-invite-response' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>{state} your invitation to join</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'space-access-request' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>requested access to</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                    <State
                        state={state}
                        respond={(response) => respondToSpaceAccessRequest(response)}
                    />
                </Content>
            )}

            {type === 'space-access-response' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>{state} your request to access</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'mod-invite' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>invited you to moderate</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                    <State state={state} respond={(response) => respondToModInvite(response)} />
                </Content>
            )}

            {type === 'mod-invite-response' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>{state} your invitation to moderate</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'mod-removed' && (
                <Content typeIcon={<SpacesIcon />}>
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>removed you from moderating</p>
                    <SpaceButton space={triggerSpace} imageSize={32} fontSize={15} />
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'event-going-reminder' && (
                <Content
                    typeIcon={<BellIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <p>An event you marked yourself as going to is starting in 15 minutes</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'event-interested-reminder' && (
                <Content
                    typeIcon={<BellIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <p>An event you marked yourself as interested in is starting in 15 minutes</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-invitation' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>invited you to join a glass bead game</p>
                    <State state={state} respond={(response) => respondToWeaveInvite(response)} />
                    {/* {relatedPost.Weave.state === 'cancelled' && <p>Game cancelled</p>} */}
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-accepted' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>accepted your glass bead game invite</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-rejected' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>has rejected their glass bead game invite so the game has been cancelled</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-move' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <p>It&apos;s your move! Add the next bead to the glass bead game</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-move-from-other-player' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>added a bead to a game you have particpated in</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-creator-move-from-other-player' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>added a new bead to a glass bead game you created</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-move-reminder' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <p>
                        You have 15 minutes left to complete your move on this glass bead game. If
                        you fail to do this, the game ends!
                    </p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-cancelled' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>
                        failed to make their move in time on this glass bead game. The game has now
                        ended!
                    </p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'gbg-ended' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <p>A glass bead game you participated in has ended</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'new-gbg-from-your-post' && (
                <Content
                    typeIcon={<CastaliaIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>created a glass bead game from your post</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}

            {type === 'poll-vote' && (
                <Content
                    typeIcon={<PollIcon />}
                    preview={
                        <PostCardPreview
                            post={relatedPost}
                            link={`/p/${postId}`}
                            onClick={markAsSeen}
                            style={{ marginTop: 10 }}
                        />
                    }
                >
                    <UserButton user={triggerUser} imageSize={32} fontSize={15} />
                    <p>voted on your poll</p>
                    <CreatedAt date={createdAt} />
                </Content>
            )}
        </Row>
    )
}

export default NotificationCard
