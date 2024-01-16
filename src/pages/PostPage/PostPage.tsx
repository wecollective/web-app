/* eslint-disable no-nested-ternary */
import Column from '@components/Column'
import GameRoom from '@components/GameRoom'
import Prism from '@components/Prism'
import LoadingWheel from '@components/animations/LoadingWheel'
import PostCard from '@components/cards/PostCard/PostCard'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { Post, includesGame } from '@src/Helpers'
import styles from '@styles/pages/PostPage/PostPage.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

type State =
    | {
          state: 'loading' | 'not-found' | 'access-denied' | 'deleted' | 'unknown-error'
      }
    | {
          state: 'ready'
          post: Post
      }

function PostPage(): JSX.Element {
    const location = useLocation()
    const postId = +location.pathname.split('/')[2]
    const subPage = location.pathname.split('/')[3]
    const { accountDataLoading, loggedIn } = useContext(AccountContext)
    const [state, setState] = useState<State>({ state: 'loading' })

    function getPostData() {
        const cookies = new Cookies()
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(`${config.apiURL}/post-data?postId=${postId}`, options)
            .then((res) => {
                // console.log('post-data: ', res.data)
                setState({ state: 'ready', post: res.data })
            })
            .catch((error) => {
                const { message } = error.response.data
                switch (message) {
                    case 'Post not found':
                        setState({ state: 'not-found' })
                        break
                    case 'Access denied':
                        setState({ state: 'access-denied' })
                        break
                    case 'Post deleted':
                        setState({ state: 'deleted' })
                        break
                    default:
                        setState({ state: 'unknown-error' })
                }
            })
    }

    useEffect(() => {
        if (!accountDataLoading && !(state.state === 'ready' && postId !== state.post.id)) {
            getPostData()
        }
    }, [accountDataLoading, postId, loggedIn])

    if (state.state !== 'ready') {
        return (
            <Column centerX className={styles.wrapper}>
                <Column className={styles.postCardWrapper}>
                    {state.state === 'loading' ? (
                        <Column centerX centerY style={{ width: '100%', height: 300 }}>
                            <LoadingWheel />
                        </Column>
                    ) : (
                        <Column centerX centerY style={{ width: '100%', height: 300 }}>
                            {state.state === 'deleted' && <p>Post deleted...</p>}
                            {state.state === 'not-found' && <p>Post not found...</p>}
                            {state.state === 'access-denied' && <p>Access denied...</p>}
                            {state.state === 'not-found' && <p>An unknown error occurred...</p>}
                        </Column>
                    )}
                </Column>
            </Column>
        )
    }

    const { post } = state

    const setPost = (newPost: Post) => setState({ state: 'ready', post: newPost })
    const onDelete = () => setState({ state: 'deleted' })

    if (post.mediaTypes.includes('prism')) {
        return <Prism post={post} setPost={setPost} onDelete={onDelete} />
    }

    if (includesGame(post.mediaTypes) && subPage === 'game-room') {
        return <GameRoom post={post} setPost={setPost} />
    }

    return (
        <Column centerX className={styles.wrapper}>
            <Column className={styles.postCardWrapper}>
                <PostCard post={post} setPost={setPost} onDelete={onDelete} location='post-page' />
            </Column>
        </Column>
    )
}

export default PostPage
