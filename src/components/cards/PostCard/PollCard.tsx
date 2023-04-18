/* eslint-disable no-param-reassign */
import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import PieChart from '@components/PieChart'
import Row from '@components/Row'
import TimeGraph from '@components/TimeGraph'
import PollAnswer from '@src/components/cards/PostCard/PollAnswer'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { PostContext } from '@src/contexts/PostContext'
import { SpaceContext } from '@src/contexts/SpaceContext'
import { UserContext } from '@src/contexts/UserContext'
import styles from '@styles/components/cards/PostCard/PollCard.module.scss'
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
    const { id, text, Poll } = postData
    const { type, answersLocked, PollAnswers } = Poll
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    // todo: update component directly instead of refreshing posts
    const { spaceData, getSpacePosts, spacePostsPaginationLimit } = useContext(SpaceContext)
    const { userData, getUserPosts, userPostsPaginationLimit } = useContext(UserContext)
    const { getPostData } = useContext(PostContext)
    const [newAnswer, setNewAnswer] = useState('')
    const [newAnswerLoading, setNewAnswerLoading] = useState(false)
    const [totalVotes, setTotalVotes] = useState(0)
    const [totalPoints, setTotalPoints] = useState(0)
    const [totalUsers, setTotalUsers] = useState(0)
    const [accountHasVoted, setAccountHasVoted] = useState(false)
    const [voteChanged, setVoteChanged] = useState(false)
    const [voteLoading, setVoteLoading] = useState(false)
    const [showVoteSavedMessage, setShowVoteSavedMessage] = useState(false)
    const [pollAnswers, setPollAnswers] = useState<any[]>([])
    const [newPollAnswers, setNewPollAnswers] = useState<any[]>([])
    const [totalUsedPoints, setTotalUsedPoints] = useState(0)
    const colorScale = d3
        .scaleSequential()
        .domain([0, Poll ? PollAnswers.length : 0])
        .interpolator(d3.interpolateViridis)
    const cookies = new Cookies()

    function vote() {
        if (!loggedIn) {
            setAlertMessage('Log in to vote on inquiries')
            setAlertModalOpen(true)
        } else {
            setVoteLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const voteData = newPollAnswers
                .filter((a) => a.accountVote)
                .map((a) => {
                    return {
                        id: a.id,
                        value: a.accountPoints,
                    }
                })
            const data = {
                userName: accountData.name,
                userHandle: accountData.handle,
                spaceId: spaceData.id,
                postId: id,
                voteData,
            }
            axios
                .post(`${config.apiURL}/vote-on-poll`, data, options)
                .then(() => {
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
                    }, 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    function updateAnswers(answerId, value) {
        const newAnswers = [...newPollAnswers]
        if (type === 'single-choice') {
            newAnswers.forEach((a) => {
                if (a.accountVote) {
                    a.accountVote = false
                    // a.totalVotes -= 1
                }
            })
        }
        const selectedAnswer = newAnswers.find((a) => a.id === answerId)
        if (type === 'weighted-choice') {
            selectedAnswer.accountVote = !!value
            selectedAnswer.accountPoints = value > 100 ? 100 : value
            setTotalUsedPoints(newAnswers.map((a) => +a.accountPoints).reduce((a, b) => a + b, 0))
        } else {
            selectedAnswer.accountVote = value
            // selectedAnswer.totalVotes += value ? 1 : -1
        }
        setNewPollAnswers(newAnswers)
        setVoteChanged(true)
    }

    function voteDisabled() {
        const weighted = type === 'weighted-choice'
        if (location === 'preview') return true
        if (loggedIn) {
            if (weighted) {
                if (!voteChanged || totalUsedPoints !== 100) return true
            } else if (!voteChanged || !newPollAnswers.find((a) => a.accountVote)) {
                return true
            }
        }
        return false
    }

    function addNewAnswer() {
        if (!loggedIn) {
            setAlertMessage('Log in to vote on inquiries')
            setAlertModalOpen(true)
        } else {
            setNewAnswerLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const data = { pollId: Poll.id, newAnswer }
            axios
                .post(`${config.apiURL}/new-poll-answer`, data, options)
                .then((res) => {
                    const answer = { ...res.data.pollAnswer, Creator: accountData, Reactions: [] }
                    setPostData({
                        ...postData,
                        Poll: { ...Poll, PollAnswers: [...PollAnswers, answer] },
                    })
                    setNewAnswer('')
                    setNewAnswerLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    // build poll data
    useEffect(() => {
        const weighted = type === 'weighted-choice'
        const answers = [] as any[]
        let totalPollVotes = 0
        let totalPollPoints = 0
        const pollUsers = [] as number[]
        PollAnswers.forEach((answer) => {
            const activeReactions = answer.Reactions.filter((r) => r.state === 'active')
            // find all users
            activeReactions.forEach((r) => {
                if (!pollUsers.includes(r.Creator.id)) pollUsers.push(r.Creator.id)
            })
            const points = weighted
                ? activeReactions.map((r) => +r.value).reduce((a, b) => a + b, 0)
                : 0
            totalPollVotes += activeReactions.length
            totalPollPoints += points
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
        setTotalVotes(totalPollVotes)
        setTotalPoints(totalPollPoints)
        setTotalUsers(pollUsers.length)
        setPollAnswers(answers)
        setNewPollAnswers(answers)
    }, [postData])

    return (
        <Column>
            <Row centerX className={styles.results}>
                <PieChart
                    type={type}
                    postId={id}
                    totalVotes={totalVotes}
                    totalPoints={totalPoints}
                    totalUsers={totalUsers}
                    answers={pollAnswers}
                />
                {totalVotes > 0 && (
                    <TimeGraph
                        type={type}
                        postId={id}
                        answers={pollAnswers}
                        startTime={postData.createdAt}
                    />
                )}
            </Row>
            <Row centerY spaceBetween style={{ marginBottom: 15 }}>
                <Row>
                    <p className='grey'>Vote type: {type}</p>
                    {type === 'weighted-choice' && (
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
            {newPollAnswers.length > 0 && (
                <Column className={styles.answers}>
                    {newPollAnswers.map((answer, i) => (
                        <PollAnswer
                            key={answer.id}
                            index={i}
                            type={type}
                            answer={answer}
                            totalVotes={totalVotes}
                            totalPoints={totalPoints}
                            color={colorScale(i)}
                            selected={answer.accountVote}
                            onChange={(v) => updateAnswers(answer.id, v)}
                        />
                    ))}
                </Column>
            )}
            {!answersLocked && (
                <Row style={{ marginBottom: 10 }}>
                    <Input
                        type='text'
                        placeholder='New answer...'
                        value={newAnswer}
                        onChange={(value) => setNewAnswer(value)}
                        style={{ width: '100%', marginRight: 10 }}
                    />
                    <Button
                        color='blue'
                        text='Add'
                        disabled={!newAnswer}
                        loading={newAnswerLoading}
                        onClick={addNewAnswer}
                    />
                </Row>
            )}
        </Column>
    )
}

export default PollCard