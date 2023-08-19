/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import PieChart from '@components/PieChart'
import Row from '@components/Row'
import TimeGraph from '@components/TimeGraph'
import PollAnswer from '@src/components/cards/PostCard/PollAnswer'
import LoadingWheel from '@src/components/LoadingWheel'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { PostContext } from '@src/contexts/PostContext'
import { SpaceContext } from '@src/contexts/SpaceContext'
import { UserContext } from '@src/contexts/UserContext'
import styles from '@styles/components/cards/PostCard/PollCard.module.scss'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

function PollCard(props: {
    postData: any
    setPostData: (data: any) => void
    location: string
    params: any
}): JSX.Element {
    const { postData, setPostData, location, params } = props
    const { id } = postData
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    // todo: update component directly instead of refreshing posts
    const { spaceData, getSpacePosts, spacePostsPaginationLimit } = useContext(SpaceContext)
    const { userData, getUserPosts, userPostsPaginationLimit } = useContext(UserContext)
    const { getPostData } = useContext(PostContext)
    const [loading, setLoading] = useState(true)
    const [pollData, setPollData] = useState<any>(null)
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
    const cookies = new Cookies()
    const colorScale = useRef<any>(null)

    function getPollData() {
        axios
            .get(`${config.apiURL}/poll-data?postId=${id}`)
            .then((res) => {
                setPollData(res.data)
                buildPollData(res.data)
            })
            .catch((error) => console.log(error))
    }

    function buildPollData(data) {
        const { type, PollAnswers } = data
        colorScale.current = d3
            .scaleSequential()
            .domain([0, PollAnswers.length])
            .interpolator(d3.interpolateViridis)
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
        setLoading(false)
    }

    function vote() {
        if (!loggedIn) {
            setAlertMessage('Log in to vote on polls')
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
        if (pollData.type === 'single-choice') {
            newAnswers.forEach((a) => {
                if (a.accountVote) {
                    a.accountVote = false
                    // a.totalVotes -= 1
                }
            })
        }
        const selectedAnswer = newAnswers.find((a) => a.id === answerId)
        if (pollData.type === 'weighted-choice') {
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
        const weighted = pollData.type === 'weighted-choice'
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
            setAlertMessage('Log in to add poll answers')
            setAlertModalOpen(true)
        } else {
            setNewAnswerLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const data = { pollId: pollData.id, newAnswer }
            axios
                .post(`${config.apiURL}/new-poll-answer`, data, options)
                .then((res) => {
                    const answer = { ...res.data.pollAnswer, Creator: accountData, Reactions: [] }
                    const newPollData = {
                        ...pollData,
                        PollAnswers: [...pollData.PollAnswers, answer],
                    }
                    setPollData(newPollData)
                    buildPollData(newPollData)
                    setNewAnswer('')
                    setNewAnswerLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => getPollData(), [])

    if (loading)
        return (
            <Row centerY centerX className={styles.loading}>
                Poll data loading...
                <LoadingWheel size={30} style={{ marginLeft: 20 }} />
            </Row>
        )
    return (
        <Column>
            <Row centerX className={styles.results}>
                <PieChart
                    type={pollData.type}
                    postId={id}
                    totalVotes={totalVotes}
                    totalPoints={totalPoints}
                    totalUsers={totalUsers}
                    answers={pollAnswers}
                />
                {totalVotes > 0 && (
                    <TimeGraph
                        type={pollData.type}
                        postId={id}
                        answers={pollAnswers}
                        startTime={postData.createdAt}
                    />
                )}
            </Row>
            <Row centerY spaceBetween style={{ marginBottom: 15 }}>
                <Row>
                    <p className='grey'>Vote type: {pollData.type}</p>
                    {pollData.type === 'weighted-choice' && (
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
                            type={pollData.type}
                            answer={answer}
                            totalVotes={totalVotes}
                            totalPoints={totalPoints}
                            color={colorScale.current(i)}
                            selected={answer.accountVote}
                            onChange={(v) => updateAnswers(answer.id, v)}
                        />
                    ))}
                </Column>
            )}
            {!pollData.answersLocked && (
                <Row className={styles.newAnswers}>
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
