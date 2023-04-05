/* eslint-disable no-param-reassign */
import Button from '@components/Button'
import Column from '@components/Column'
import PieChart from '@components/PieChart'
import Row from '@components/Row'
import TimeGraph from '@components/TimeGraph'
import PollAnswer from '@src/components/cards/PollAnswer'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { PostContext } from '@src/contexts/PostContext'
import { SpaceContext } from '@src/contexts/SpaceContext'
import { UserContext } from '@src/contexts/UserContext'
import styles from '@styles/components/cards/PostCard/PostTypes/PollCard.module.scss'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

function PollCard(props: {
    postData: any
    setPostData: (data: any) => void
    location: string
    params: any
}): JSX.Element {
    const { postData, setPostData, location, params } = props
    const { id, text, Poll: poll } = postData
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    const { spaceData, getSpacePosts, spacePostsPaginationLimit } = useContext(SpaceContext)
    const { userData, getUserPosts, userPostsPaginationLimit } = useContext(UserContext)
    const { getPostData } = useContext(PostContext)
    const [totalVotes, setTotalVotes] = useState(0)
    const [totalPoints, setTotalPoints] = useState(0)
    const [totalUsers, setTotalUsers] = useState(0)
    const [accountHasVoted, setAccountHasVoted] = useState(false)
    const [voteChanged, setVoteChanged] = useState(false)
    const [voteLoading, setVoteLoading] = useState(false)
    const [showVoteSavedMessage, setShowVoteSavedMessage] = useState(false)
    const [inquiryAnswers, setInquiryAnswers] = useState<any[]>([])
    const [newInquiryAnswers, setNewInquiryAnswers] = useState<any[]>([])
    const [totalUsedPoints, setTotalUsedPoints] = useState(0)
    const colorScale = d3
        .scaleSequential()
        .domain([0, poll ? poll.PollAnswers.length : 0])
        .interpolator(d3.interpolateViridis)
    const cookies = new Cookies()

    function vote() {
        const accessToken = cookies.get('accessToken')
        if (!accessToken) {
            setAlertMessage('Log in to vote on inquiries')
            setAlertModalOpen(true)
        } else {
            setVoteLoading(true)
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const data = {
                userName: accountData.name,
                userHandle: accountData.handle,
                spaceId: spaceData.id,
                postId: id,
                voteData: newInquiryAnswers
                    .filter((a) => a.accountVote)
                    .map((a) => {
                        return {
                            id: a.id,
                            value: a.accountPoints,
                        }
                    }),
            }
            axios.post(`${config.apiURL}/vote-on-poll`, data, options).then(() => {
                const newAnswers = [
                    ...newInquiryAnswers.sort((a, b) => b.totalVotes - a.totalVotes),
                ]
                setTotalVotes(newAnswers.map((a) => a.totalVotes).reduce((a, b) => a + b, 0))
                setInquiryAnswers(newAnswers)
                setNewInquiryAnswers(newAnswers)
                setVoteLoading(false)
                setShowVoteSavedMessage(true)
                setTimeout(() => {
                    setShowVoteSavedMessage(false)
                    // todo: update state locally
                    if (location === 'space-posts')
                        getSpacePosts(spaceData.id, 0, spacePostsPaginationLimit, params)
                    if (location === 'user-posts')
                        getUserPosts(userData.id, 0, userPostsPaginationLimit, params)
                    if (location === 'post-page') getPostData(id)
                }, 3000)
            })
        }
    }

    function updateAnswers(answerId, value) {
        const newAnswers = [...newInquiryAnswers]
        if (poll.type === 'single-choice') {
            newAnswers.forEach((a) => {
                if (a.accountVote) {
                    a.accountVote = false
                    // a.totalVotes -= 1
                }
            })
        }
        const selectedAnswer = newAnswers.find((a) => a.id === answerId)
        if (poll.type === 'weighted-choice') {
            selectedAnswer.accountVote = !!value
            selectedAnswer.accountPoints = value > 100 ? 100 : value
            setTotalUsedPoints(newAnswers.map((a) => +a.accountPoints).reduce((a, b) => a + b, 0))
        } else {
            selectedAnswer.accountVote = value
            // selectedAnswer.totalVotes += value ? 1 : -1
        }
        setNewInquiryAnswers(newAnswers)
        setVoteChanged(true)
    }

    function voteDisabled() {
        const weighted = poll.type === 'weighted-choice'
        if (location === 'preview') return true
        if (loggedIn) {
            if (weighted) {
                if (!voteChanged || totalUsedPoints !== 100) return true
            } else if (!voteChanged || !newInquiryAnswers.find((a) => a.accountVote)) {
                return true
            }
        }
        return false
    }

    // build poll data
    useEffect(() => {
        const weighted = poll.type === 'weighted-choice'
        const answers = [] as any[]
        let totalInquiryVotes = 0
        let totalInquiryPoints = 0
        const inquiryUsers = [] as number[]
        poll.PollAnswers.forEach((answer) => {
            const activeReactions = answer.Reactions.filter((r) => r.state === 'active')
            // find all users
            activeReactions.forEach((r) => {
                if (!inquiryUsers.includes(r.Creator.id)) inquiryUsers.push(r.Creator.id)
            })
            const points = weighted
                ? activeReactions.map((r) => +r.value).reduce((a, b) => a + b, 0)
                : 0
            totalInquiryVotes += activeReactions.length
            totalInquiryPoints += points
            const accountVote = activeReactions.find((r) => r.Creator.id === accountData.id)
            if (accountVote && !accountHasVoted) {
                setAccountHasVoted(true)
                setTotalUsedPoints(100)
            }
            answers.push({
                ...answer,
                totalVotes: activeReactions.length,
                accountVote: !!accountVote,
                accountPoints: accountVote ? +accountVote.value : 0,
                totalPoints: points,
            })
        })
        if (weighted) answers.sort((a, b) => b.totalPoints - a.totalPoints)
        else answers.sort((a, b) => b.totalVotes - a.totalVotes)
        setTotalVotes(totalInquiryVotes)
        setTotalPoints(totalInquiryPoints)
        setTotalUsers(inquiryUsers.length)
        setInquiryAnswers(answers)
        setNewInquiryAnswers(answers)
    }, [])

    return (
        <Column>
            <Row centerX className={styles.results}>
                <PieChart
                    type={poll.type}
                    postId={id}
                    totalVotes={totalVotes}
                    totalPoints={totalPoints}
                    totalUsers={totalUsers}
                    answers={inquiryAnswers}
                />
                {totalVotes > 0 && (
                    <TimeGraph
                        type={poll.type}
                        postId={id}
                        answers={inquiryAnswers}
                        startTime={postData.createdAt}
                    />
                )}
            </Row>
            <Row centerY spaceBetween style={{ marginBottom: 15 }}>
                <Row>
                    <p className='grey'>Poll type: {poll.type}</p>
                    {poll.type === 'weighted-choice' && (
                        <p
                            className={voteChanged && totalUsedPoints !== 100 ? 'danger' : 'grey'}
                            style={{ marginLeft: 10 }}
                        >
                            ({totalUsedPoints}/100 points used)
                        </p>
                    )}
                </Row>
                {showVoteSavedMessage && <p>Vote saved!</p>}
                <Button
                    color='blue'
                    text={accountHasVoted ? 'Change vote' : 'Vote'}
                    loading={voteLoading}
                    disabled={voteDisabled()}
                    onClick={() => vote()}
                />
            </Row>
            {newInquiryAnswers.length > 0 && (
                <Column className={styles.answers}>
                    {newInquiryAnswers.map((answer, i) => (
                        <PollAnswer
                            key={answer.id}
                            index={i}
                            type={poll.type}
                            answer={answer}
                            totalVotes={totalVotes}
                            totalPoints={totalPoints}
                            color={colorScale(i)}
                            selected={answer.accountVote}
                            preview={location === 'preview'}
                            onChange={(v) => updateAnswers(answer.id, v)}
                        />
                    ))}
                </Column>
            )}
        </Column>
    )
}

export default PollCard
