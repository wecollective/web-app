import PostCard from '@components/cards/PostCard/PostCard'
import Column from '@components/Column'
import DecisionTree from '@components/DecisionTree'
import GlassBeadGame from '@components/GlassBeadGame'
import PlotGraph from '@components/PlotGraph'
import Prism from '@components/Prism'
import { AccountContext } from '@contexts/AccountContext'
import { PostContext } from '@contexts/PostContext'
import styles from '@styles/pages/PostPage/PostPage.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PostPage = (): JSX.Element => {
    const location = useLocation()
    const postId = location.pathname.split('/')[2]
    const { accountDataLoading } = useContext(AccountContext)
    const { getPostData, postData, resetPostContext } = useContext(PostContext)

    useEffect(() => {
        if (!accountDataLoading && postId !== postData.id) getPostData(postId)
    }, [accountDataLoading, postId])

    useEffect(() => () => resetPostContext(), [])

    if (postData.type === 'prism') {
        return <Prism />
    }
    if (postData.type === 'plot-graph') {
        return <PlotGraph />
    }
    if (postData.type === 'glass-bead-game') {
        return <GlassBeadGame />
    }
    if (postData.type === 'decision-tree') {
        return <DecisionTree />
    }

    return (
        <Column centerX className={styles.wrapper}>
            <Column className={styles.postCardWrapper}>
                {postData.id && <PostCard post={postData} location='post-page' />}
            </Column>
        </Column>
    )
}

export default PostPage
