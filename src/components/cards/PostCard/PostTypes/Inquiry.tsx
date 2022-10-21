/* eslint-disable no-param-reassign */
import Button from '@components/Button'
import InquiryAnswer from '@components/cards/InquiryAnswer'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import Markdown from '@components/Markdown'
import PieChart from '@components/PieChart'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import TimeGraph from '@components/TimeGraph'
import config from '@src/Config'
import { AccountContext } from '@src/contexts/AccountContext'
import { PostContext } from '@src/contexts/PostContext'
import { SpaceContext } from '@src/contexts/SpaceContext'
import { UserContext } from '@src/contexts/UserContext'
import styles from '@styles/components/cards/PostCard/PostTypes/Inquiry.module.scss'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'

const Inquiry = (props: {
    postData: any
    setPostData: (data: any) => void
    location: string
    params: any
}): JSX.Element => {
    const { postData, setPostData, location, params } = props
    const { id, text, Inquiry: inquiry } = postData
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
        .domain([0, inquiry ? inquiry.InquiryAnswers.length : 0])
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
            axios.post(`${config.apiURL}/vote-on-inquiry`, data, options).then(() => {
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
        if (inquiry.type === 'single-choice') {
            newAnswers.forEach((a) => {
                if (a.accountVote) {
                    a.accountVote = false
                    // a.totalVotes -= 1
                }
            })
        }
        const selectedAnswer = newAnswers.find((a) => a.id === answerId)
        if (inquiry.type === 'weighted-choice') {
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
        const weighted = inquiry.type === 'weighted-choice'
        if (loggedIn && location !== 'preview') {
            if (weighted) {
                if (!voteChanged || totalUsedPoints !== 100) return true
            } else if (!voteChanged || !newInquiryAnswers.find((a) => a.accountVote)) {
                return true
            }
        }
        return false
    }

    // build inquiry data
    useEffect(() => {
        const weighted = inquiry.type === 'weighted-choice'
        const answers = [] as any[]
        let totalInquiryVotes = 0
        let totalInquiryPoints = 0
        const inquiryUsers = [] as number[]
        inquiry.InquiryAnswers.forEach((answer) => {
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
            <Markdown text={`# ${inquiry.title}`} className={styles.title} />
            {text && (
                <ShowMoreLess height={150} style={{ marginBottom: 10 }}>
                    <DraftText stringifiedDraft={text} />
                </ShowMoreLess>
            )}
            <Row centerX className={styles.inquiryResults}>
                <PieChart
                    type={inquiry.type}
                    postId={id}
                    totalVotes={totalVotes}
                    totalPoints={totalPoints}
                    totalUsers={totalUsers}
                    answers={inquiryAnswers}
                />
                {totalVotes > 0 && (
                    <TimeGraph
                        type={inquiry.type}
                        postId={id}
                        answers={inquiryAnswers}
                        startTime={postData.createdAt}
                    />
                )}
            </Row>
            <Row centerY spaceBetween style={{ marginBottom: 15 }}>
                <Row>
                    <p className='grey'>Inquiry type: {inquiry.type}</p>
                    {inquiry.type === 'weighted-choice' && (
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
                <Column className={styles.inquiryAnswers}>
                    {newInquiryAnswers.map((answer, i) => (
                        <InquiryAnswer
                            key={answer.id}
                            index={i}
                            type={inquiry.type}
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

export default Inquiry
