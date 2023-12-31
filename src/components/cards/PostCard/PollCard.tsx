/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
import Button from '@components/Button'
import Column from '@components/Column'
import PieChart from '@components/PieChart'
import Row from '@components/Row'
import TimeGraph from '@components/TimeGraph'
import LoadingWheel from '@components/animations/LoadingWheel'
import PollAnswer from '@components/cards/PostCard/PollAnswer'
import CommentInput from '@components/draft-js/CommentInput'
import Modal from '@components/modals/Modal'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { SpaceContext } from '@src/contexts/SpaceContext'
import styles from '@styles/components/cards/PostCard/PollCard.module.scss'
import { PollIcon } from '@svgs/all'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

function PollCard(props: { postData: any; location: string }): JSX.Element {
    const { postData, location } = props
    const { id } = postData
    const { accountData, setAlertMessage, setAlertModalOpen, loggedIn } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [loading, setLoading] = useState(true)
    const [pollData, setPollData] = useState<any>(null)
    const [totalVotes, setTotalVotes] = useState(0)
    const [totalPoints, setTotalPoints] = useState(0)
    const [totalUsers, setTotalUsers] = useState(0)
    const [accountHasVoted, setAccountHasVoted] = useState(false)
    const [voteChanged, setVoteChanged] = useState(false)
    const [voteLoading, setVoteLoading] = useState(false)
    const [visualisationAnswers, setVisualisationAnswers] = useState<any[]>([])
    const [listAnswers, setListAnswers] = useState<any[]>([])
    const [showAllAnswers, setShowAllAnswers] = useState(false)
    const [removeAnswerModalOpen, setRemoveAnswerModalOpen] = useState(false)
    const [removeAnswerId, setRemoveAnswerId] = useState(0)
    const [removeAnswerLoading, setRemoveAnswerLoading] = useState(false)
    const [totalUsedPoints, setTotalUsedPoints] = useState(0)
    const cookies = new Cookies()
    const colorScale = useRef<any>(null)
    const answers = showAllAnswers ? listAnswers : listAnswers.slice(0, 3)

    function findPercentage(answer) {
        const weighted = pollData && pollData.type === 'weighted-choice'
        let percent = 0
        if (weighted && totalPoints) percent = (answer.totalPoints / totalPoints) * 100
        if (!weighted && totalVotes) percent = (100 / totalVotes) * answer.totalVotes
        return +percent.toFixed(1)
    }

    function voteDisabled() {
        const weighted = pollData.type === 'weighted-choice'
        if (location === 'preview') return true
        if (loggedIn) {
            if (weighted) {
                if (!voteChanged || totalUsedPoints !== 100) return true
            } else if (!voteChanged || !listAnswers.find((a) => a.accountVote)) {
                return true
            }
        }
        return false
    }

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
        const { type, Answers } = data
        colorScale.current = d3
            .scaleSequential()
            .domain([0, Answers.length])
            .interpolator(d3.interpolateViridis)
        const weighted = type === 'weighted-choice'
        const answersWithData = [] as any[]
        let totalPollVotes = 0
        let totalPollPoints = 0
        const pollUsers = [] as number[]
        Answers.forEach((answer) => {
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
            answersWithData.push({
                ...answer,
                totalVotes: activeReactions.length,
                accountVote: !!accountVote,
                accountPoints: accountVote ? +accountVote.value : 0,
                totalPoints: points,
            })
        })
        if (weighted) answersWithData.sort((a, b) => b.totalPoints - a.totalPoints)
        else answersWithData.sort((a, b) => b.totalVotes - a.totalVotes)
        setTotalVotes(totalPollVotes)
        setTotalPoints(totalPollPoints)
        setTotalUsers(pollUsers.length)
        setListAnswers(answersWithData)
        setVisualisationAnswers(answersWithData)
        setLoading(false)
    }

    function vote() {
        if (!loggedIn) {
            setAlertMessage('Log in to vote on polls')
            setAlertModalOpen(true)
        } else {
            setVoteLoading(true)
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            const voteData = listAnswers
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
                    getPollData()
                    setVoteChanged(false)
                })
                .catch((error) => console.log(error))
        }
    }

    function updateAnswers(answerId, value) {
        const newAnswers = [...listAnswers]
        if (pollData.type === 'single-choice') {
            newAnswers.forEach((a) => {
                if (a.accountVote) a.accountVote = false
            })
        }
        const selectedAnswer = newAnswers.find((a) => a.id === answerId)
        if (pollData.type === 'weighted-choice') {
            selectedAnswer.accountVote = !!value
            selectedAnswer.accountPoints = value > 100 ? 100 : value
            setTotalUsedPoints(newAnswers.map((a) => +a.accountPoints).reduce((a, b) => a + b, 0))
        } else selectedAnswer.accountVote = value
        setListAnswers(newAnswers)
        setVoteChanged(true)
    }

    function addAnswer(answer) {
        const newPollData = { ...pollData, Answers: [...pollData.Answers, answer] }
        setPollData(newPollData)
        buildPollData(newPollData)
    }

    function removeAnswer() {
        setRemoveAnswerLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/remove-poll-answer`, { answerId: removeAnswerId }, options)
            .then(() => {
                getPollData()
                setRemoveAnswerLoading(false)
                setRemoveAnswerModalOpen(false)
            })
            .catch((error) => console.log(error))
    }

    function toggleAnswerDone(answerId) {
        const newAnswers = [...listAnswers]
        const answer = newAnswers.find((a) => a.id === answerId)
        const newState = answer.Link.state === 'done' ? 'active' : 'done'
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .post(`${config.apiURL}/toggle-poll-answer-done`, { answerId, newState }, options)
            .then(() => {
                answer.Link.state = newState
                setListAnswers(newAnswers)
            })
            .catch((error) => console.log(error))
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
        <Column className={styles.wrapper}>
            {totalVotes > 0 && (
                <Row centerX className={styles.results}>
                    <PieChart
                        type={pollData.type}
                        postId={id}
                        totalVotes={totalVotes}
                        totalPoints={totalPoints}
                        totalUsers={totalUsers}
                        answers={visualisationAnswers}
                    />
                    <TimeGraph
                        type={pollData.type}
                        postId={id}
                        answers={visualisationAnswers}
                        startTime={postData.createdAt}
                    />
                </Row>
            )}
            <Row centerY spaceBetween style={{ marginBottom: 15 }}>
                <Row className={styles.info}>
                    <PollIcon />
                    <p>Vote type: {pollData.type}</p>
                    {pollData.type === 'weighted-choice' && (
                        <p className={voteChanged && totalUsedPoints !== 100 ? styles.red : ''}>
                            ({totalUsedPoints}/100 points used)
                        </p>
                    )}
                </Row>
                <Button
                    color='blue'
                    text={accountHasVoted ? 'Change vote' : 'Vote'}
                    loading={voteLoading}
                    disabled={voteDisabled()}
                    onClick={() => vote()}
                />
            </Row>
            {answers.length > 0 && (
                <Column className={styles.answers}>
                    {answers.map((answer, i) => (
                        <PollAnswer
                            key={answer.id}
                            index={i}
                            type={pollData.type}
                            answer={answer}
                            percentage={findPercentage(answer)}
                            color={colorScale.current(i)}
                            onChange={(v) => updateAnswers(answer.id, v)}
                            removable={postData.Creator.id === accountData.id}
                            remove={() => {
                                setRemoveAnswerId(answer.id)
                                setRemoveAnswerModalOpen(true)
                            }}
                            toggleDone={() => toggleAnswerDone(answer.id)}
                        />
                    ))}
                </Column>
            )}
            {!showAllAnswers && listAnswers.length > 3 && (
                <Row centerX style={{ marginTop: 10 }}>
                    <button
                        className={styles.showMore}
                        type='button'
                        onClick={() => setShowAllAnswers(true)}
                    >
                        Show more answers ({listAnswers.length - 3})
                    </button>
                </Row>
            )}
            {loggedIn && !pollData.answersLocked && (
                <CommentInput
                    type='poll-answer'
                    placeholder='New answer...'
                    parent={{ type: 'post', id }}
                    onSave={(data) => addAnswer(data)}
                    style={{ marginTop: 10 }}
                />
            )}
            {removeAnswerModalOpen && (
                <Modal centerX close={() => setRemoveAnswerModalOpen(false)}>
                    <h1>Are you sure you want to remove this answer?</h1>
                    <Row>
                        <Button
                            text='Yes, remove'
                            color='red'
                            loading={removeAnswerLoading}
                            disabled={removeAnswerLoading}
                            onClick={removeAnswer}
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            text='Cancel'
                            color='blue'
                            onClick={() => setRemoveAnswerModalOpen(false)}
                        />
                    </Row>
                </Modal>
            )}
        </Column>
    )
}

export default PollCard
