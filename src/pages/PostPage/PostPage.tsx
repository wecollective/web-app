/* eslint-disable no-nested-ternary */
import PostCard from '@components/cards/PostCard/PostCard'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Prism from '@components/Prism'
import { AccountContext } from '@contexts/AccountContext'
import { PostContext } from '@contexts/PostContext'
import styles from '@styles/pages/PostPage/PostPage.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function PostPage(): JSX.Element {
    const location = useLocation()
    const postId = location.pathname.split('/')[2]
    const { accountDataLoading, loggedIn } = useContext(AccountContext)
    const { getPostData, postData, postDataLoading, postState, resetPostContext } =
        useContext(PostContext)
    const { GlassBeadGame } = postData

    useEffect(() => {
        if (!accountDataLoading && postId !== postData.id) getPostData(+postId)
    }, [accountDataLoading, postId, loggedIn])

    useEffect(() => () => resetPostContext(), [])

    if (postData.type === 'prism') {
        return <Prism />
    }
    // if (postData.type === 'plot-graph') {
    //     return <PlotGraph />
    // }
    if (postData.type === 'glass-bead-game' && GlassBeadGame && GlassBeadGame.synchronous) {
        return <GlassBeadGame />
    }
    // if (postData.type === 'decision-tree') {
    //     return <DecisionTree />
    // }

    return (
        <Column centerX className={styles.wrapper}>
            <Column className={styles.postCardWrapper}>
                {accountDataLoading || postDataLoading ? (
                    <Column centerX centerY style={{ width: '100%', height: 300 }}>
                        <LoadingWheel />
                    </Column>
                ) : !postData.id || postState ? (
                    <Column centerX centerY style={{ width: '100%', height: 300 }}>
                        {postState === 'deleted' && <p>Post deleted...</p>}
                        {postState === 'not-found' && <p>Post not found...</p>}
                        {postState === 'access-denied' && <p>Access denied...</p>}
                    </Column>
                ) : (
                    <PostCard post={postData} location='post-page' />
                )}
            </Column>
        </Column>
    )
}

export default PostPage
