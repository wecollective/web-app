/* eslint-disable no-nested-ternary */
import Column from '@components/Column'
import GameRoom from '@components/GameRoom'
import Prism from '@components/Prism'
import SEO from '@components/SEO'
import LoadingWheel from '@components/animations/LoadingWheel'
import PostCard from '@components/cards/PostCard/PostCard'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { Post, getDraftPlainText, includesGame } from '@src/Helpers'
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
                setState({ state: 'ready', post: res.data as Post })
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

    // get post data on page load when account data ready or when user logs in/out
    useEffect(() => {
        if (!accountDataLoading) {
            setState({ state: 'loading' })
            getPostData()
        }
    }, [accountDataLoading, loggedIn])

    // get new post data when post url has changed
    useEffect(() => {
        if (state.state === 'ready' && state.post.id !== postId) {
            setState({ state: 'loading' })
            getPostData()
        }
    }, [postId])

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
        return <GameRoom key={post.id} post={post} setPost={setPost} />
    }

    function findDescription() {
        if (post.text) return getDraftPlainText(post.text)
        if (post.UrlBlocks && post.UrlBlocks.length) {
            const urlWithTitle = post.UrlBlocks.find((block) => block.Post.MediaLink.Url.title)
            if (urlWithTitle) return urlWithTitle.Post.MediaLink.Url.title
            const urlWithText = post.UrlBlocks.find((block) => block.Post.MediaLink.Url.description)
            if (urlWithText) return urlWithText.Post.MediaLink.Url.description
        }
        return ''
    }

    function findImage() {
        if (post.ImageBlocks && post.ImageBlocks.length) {
            return post.ImageBlocks[0].Post.MediaLink.Image.url
        }
        if (post.UrlBlocks && post.UrlBlocks.length) {
            const urlWithImage = post.UrlBlocks.find((block) => block.Post.MediaLink.Url.image)
            if (urlWithImage) return urlWithImage.Post.MediaLink.Url.image
        }
        if (post.Creator.flagImagePath) return post.Creator.flagImagePath
        return ''
    }

    return (
        <Column centerX className={styles.wrapper}>
            <SEO
                title={`${post.Creator.name} ${post.title ? `| ${post.title}` : ''}`}
                description={findDescription()}
                image={findImage()}
                creator={`u/${post.Creator.handle}`}
            />
            <Column className={styles.postCardWrapper}>
                <PostCard post={post} setPost={setPost} onDelete={onDelete} location='post-page' />
            </Column>
        </Column>
    )
}

export default PostPage
