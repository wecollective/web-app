import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { IPostContext } from '@src/Interfaces'
import axios from 'axios'
import React, { createContext, useContext, useState } from 'react'

export const PostContext = createContext<IPostContext>({} as IPostContext)

const defaults = {
    postData: {
        id: null,
        type: '',
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

const PostContextProvider = ({ children }: { children: JSX.Element }): JSX.Element => {
    const { accountData } = useContext(AccountContext)

    const [selectedSubPage, setSelectedSubPage] = useState('')
    const [postData, setPostData] = useState(defaults.postData)
    const [postDataLoading, setPostDataLoading] = useState(true)
    const [postState, setPostState] = useState<'default' | 'deleted' | 'not-found'>('default')

    function getPostData(postId) {
        console.log('PostContext: getPostData')
        setPostState('default')
        setPostDataLoading(true)
        axios
            .get(`${config.apiURL}/post-data?accountId=${accountData.id}&postId=${postId}`)
            .then((res) => {
                setPostData(res.data)
                setPostDataLoading(false)
            })
            .catch((error) => {
                console.log(error)
                setPostDataLoading(false)
                if (error.response.status === 401) setPostState('deleted')
                if (error.response.status === 404) setPostState('not-found')
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

// // to be moved...

// const [selectedPollAnswers, setSelectedPollAnswers] = useState<IPollAnswer[]>([])
// const [voteCast, setVoteCast] = useState(false)

// // TODO: move to PostPagePollVote, set up infinite scroll for poll answers in 'vote' and 'results' sections
// function castVote() {
//     if (validVote) {
//         const voteData = { postId, pollType: postData.subType, selectedPollAnswers }
//         console.log('voteData: ', voteData)
//         axios
//             .post(`${config.apiURL}/cast-vote`, { voteData })
//             .then(() => setSelectedPollAnswers([]))
//             .then(() => setVoteCast(true))
//     }
// }

// const totalUsedPoints = selectedPollAnswers
// .map((answer) => answer.value)
// .reduce((a, b) => a + b, 0)
// const validVote =
// selectedPollAnswers.length !== 0 &&
// (postData.subType !== 'weighted-choice' || Number(totalUsedPoints) === 100)
// const colorScale = d3
// .scaleSequential()
// .domain([0, postData.PollAnswers && postData.PollAnswers.length])
// .interpolator(d3.interpolateViridis)

// const pollAnswersSortedById =
// postData.PollAnswers && postData.PollAnswers.map((a) => a).sort((a, b) => a.id - b.id)
// let pollAnswersSortedByScore =
// postData.PollAnswers &&
// postData.PollAnswers.map((a) => a).sort((a, b) => b.totalVotes - a.totalVotes)
// let totalPollVotes =
// postData.PollAnswers &&
// postData.PollAnswers.map((answer) => {
//     return answer.totalVotes
// }).reduce((a, b) => a + b, 0)

// if (postData.subType === 'weighted-choice') {
// totalPollVotes =
//     postData.PollAnswers &&
//     postData.PollAnswers.map((answer) => {
//         return answer.totalScore
//     }).reduce((a, b) => a + b, 0)
// pollAnswersSortedByScore =
//     postData.PollAnswers &&
//     postData.PollAnswers.map((a) => a).sort((a, b) => b.totalScore - a.totalScore)
// }

// function getPostComments() {
//     setPostCommentPaginationHasMore(true)
//     console.log(`PostContext: getPostComments (0 to ${postCommentPaginationLimit})`)
//     axios
//         .get(
//             // prettier-ignore
//             `${config.apiURL}/post-comments?accountId=${accountData.id
//             }&postId=${postId
//             }&sortBy=${postCommentSortByFilter
//             }&sortOrder=${postCommentSortOrderFilter
//             }&timeRange=${postCommentTimeRangeFilter
//             }&searchQuery=${postCommentSearchFilter
//             }&limit=${postCommentPaginationLimit
//             }&offset=0`
//         )
//         .then((res) => {
//             if (res.data.length < postCommentPaginationLimit)
//                 setPostCommentPaginationHasMore(false)
//             setPostComments(res.data)
//             setPostCommentPaginationOffset(postCommentPaginationLimit)
//         })
//         .catch((error) => console.log('GET post-comments error: ', error))
// }

// function getNextPostComments() {
//     if (postCommentPaginationHasMore) {
//         console.log(
//             `PostContext: getNextPostComments (${postCommentPaginationOffset} to ${
//                 postCommentPaginationOffset + postCommentPaginationLimit
//             })`
//         )
//         axios
//             .get(
//                 // prettier-ignore
//                 `${config.apiURL}/post-comments?accountId=${loggedIn ? accountData.id : null
//                 }&postId=${postId
//                 }&sortBy=${postCommentSortByFilter
//                 }&sortOrder=${postCommentSortOrderFilter
//                 }&timeRange=${postCommentTimeRangeFilter
//                 }&searchQuery=${postCommentSearchFilter
//                 }&limit=${postCommentPaginationLimit
//                 }&offset=${postCommentPaginationOffset}`
//             )
//             .then((res) => {
//                 if (res.data.length < postCommentPaginationLimit)
//                     setPostCommentPaginationHasMore(false)
//                 setPostComments([...postComments, ...res.data])
//                 setPostCommentPaginationOffset(
//                     postCommentPaginationOffset + postCommentPaginationLimit
//                 )
//             })
//     }
// }

// const [postComments, setPostComments] = useState<IComment[]>([])
// const [postCommentFiltersOpen, setPostCommentFiltersOpen] = useState(false)
// const [postCommentTimeRangeFilter, setPostCommentTimeRangeFilter] = useState('All Time')
// const [postCommentSortByFilter, setPostCommentSortByFilter] = useState('Likes')
// const [postCommentSortOrderFilter, setPostCommentSortOrderFilter] = useState('Descending')
// const [postCommentSearchFilter, setPostCommentSearchFilter] = useState('')
// const [postCommentPaginationLimit, setPostCommentPaginationLimit] = useState(10)
// const [postCommentPaginationOffset, setPostCommentPaginationOffset] = useState(0)
// const [postCommentPaginationHasMore, setPostCommentPaginationHasMore] = useState(true)
