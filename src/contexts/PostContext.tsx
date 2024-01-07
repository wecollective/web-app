import config from '@src/Config'
import { IPostContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useState } from 'react'
import Cookies from 'universal-cookie'

export const PostContext = createContext<IPostContext>({} as IPostContext)

const defaults = {
    postData: {
        id: null,
        type: '',
        mediaTypes: '',
        color: null,
        state: '',
        text: '',
        url: null,
        urlImage: null,
        urlDomain: null,
        urlTitle: null,
        urlDescription: null,
        createdAt: '',
        // todo: change account_ values to booleans
        accountLike: 0,
        accountLink: 0,
        accountRating: 0,
        accountRepost: 0,
        totalComments: 0,
        totalLikes: 0,
        totalLinks: 0,
        totalRatingPoints: 0,
        totalRatings: 0,
        totalReactions: 0,
        totalReposts: 0,
        creator: {
            id: null,
            handle: '',
            name: '',
            flagImagePath: '',
        },
        DirectSpaces: [],
        IndirectSpaces: [],
        PollAnswers: [],
    },
}

function PostContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [selectedSubPage, setSelectedSubPage] = useState('')
    const [postData, setPostData] = useState(defaults.postData)
    const [postDataLoading, setPostDataLoading] = useState(true)
    const [postState, setPostState] = useState('')
    const cookies = new Cookies()

    function getPostData(postId) {
        console.log('PostContext: getPostData')
        setPostState('')
        setPostDataLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        axios
            .get(`${config.apiURL}/post-data?postId=${postId}`, options)
            .then((res) => {
                // console.log(res.data)
                setPostData(res.data)
                setPostDataLoading(false)
            })
            .catch((error) => {
                const { message } = error.response.data
                if (message === 'Post not found') setPostState('not-found')
                if (message === 'Access denied') setPostState('access-denied')
                if (message === 'Post deleted') setPostState('deleted')
                setPostDataLoading(false)
            })
    }

    function resetPostContext() {
        console.log('PostContext: resetPostContext')
        setPostData(defaults.postData)
    }

    return (
        <PostContext.Provider
            value={{
                selectedSubPage,
                setSelectedSubPage,
                postData,
                setPostData,
                postDataLoading,
                postState,
                setPostState,
                // functions
                getPostData,
                resetPostContext,
            }}
        >
            {children}
        </PostContext.Provider>
    )
}

export default PostContextProvider
