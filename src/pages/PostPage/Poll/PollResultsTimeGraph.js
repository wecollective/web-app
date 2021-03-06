import { PostContext } from '@contexts/PostContext'
import config from '@src/Config'
import axios from 'axios'
import * as d3 from 'd3'
import React, { useContext, useEffect, useState } from 'react'

const PollResultsTimeGraph = () => {
    // : JSX.Element => {
    const { postData, postId, colorScale } = useContext(PostContext)

    const [pollVotes, setPollVotes] = useState([])
    const [bezierCurves, setBezierCurves] = useState(false)

    const width = 600
    const height = 350
    const margin = { top: 50, right: 50, bottom: 50, left: 50 }

    function formatMinutes(number) {
        if (number < 10) return `0${number}`
        return number
    }

    useEffect(() => {
        if (postData.id) {
            console.log('PollResultsTimeGraph: getPollVotes')
            axios
                .get(`${config.apiURL}/poll-votes?postId=${postId}`)
                .then((res) => setPollVotes(res.data))
        }
    }, [postData.id])

    const pollVotesGroupedByAnswer = d3
        .nest()
        .key((d) => d.pollAnswerId)
        .entries(pollVotes)

    pollVotesGroupedByAnswer.forEach((answer) => {
        // create array of vote values (times each value by 100 to avoid JS decimal issues)
        const valuesArray = answer.values.map((votes) => Number((votes.value * 100).toFixed(0)))
        // create array of accumulated vote values
        const accumulatedValuesArray = []
        valuesArray.reduce((a, b, i) => {
            return (accumulatedValuesArray[i] = a + b)
        }, 0)
        // add accumulated values to votes
        answer.values.forEach((vote, i) => (vote.accumulatedValue = accumulatedValuesArray[i]))
        // add start and end values to vote arrays
        answer.values.unshift({
            accumulatedValue: 0,
            parsedCreatedAt: Date.parse(new Date(postData.createdAt)),
        })
        answer.values.push({
            accumulatedValue: accumulatedValuesArray[accumulatedValuesArray.length - 1],
            parsedCreatedAt: Date.parse(new Date()),
        })
        // add total score to answer
        answer.totalScore = answer.values[answer.values.length - 1].accumulatedValue
    })

    pollVotesGroupedByAnswer.sort((a, b) => b.totalScore - a.totalScore)

    // X-axis (horizontal) = time
    const minX = Date.parse(postData.createdAt)
    const maxX = Date.parse(new Date())
    // Y-axis (vertical) = points
    const minY = 0
    const maxY = d3.max(pollVotes.map((vote) => vote.accumulatedValue / 100))

    const x = d3
        .scaleLinear()
        .domain([minX, maxX])
        .range([margin.left, width - margin.right])

    const y = d3
        .scaleLinear()
        .domain([minY, maxY])
        .range([height - margin.bottom, margin.top])

    const line = d3
        .line()
        .x(function (d) {
            return x(d.parsedCreatedAt)
        })
        .y(function (d) {
            return y(d.accumulatedValue / 100)
        })

    if (bezierCurves) {
        line.curve(d3.curveBundle.beta(1))
    }

    const xAxis = d3
        .axisBottom()
        .scale(x)
        .tickFormat(function (d) {
            const date = new Date(d)
            return `${date.getHours()}:${formatMinutes(date.getMinutes())} | ${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
        })
        .tickArguments([2])
    // .tickArguments([d3.timeMinute.every(15)])
    // .tickValues([1, 2])

    const yAxis = d3.axisLeft().scale(y).tickArguments([6])

    useEffect(() => {
        if (postData.PollAnswers.length) {
            console.log('second useEffect run on TimeGraph comp')
            pollVotesGroupedByAnswer.forEach((answer, i) => {
                if (answer.values[0].parsedCreatedAt) {
                    const line = d3.selectAll(`#line-${answer.key}`)
                    const totalLength = line.node().getTotalLength()
                    line.attr('stroke-dasharray', totalLength)
                        .attr('stroke-dashoffset', totalLength)
                        .attr('stroke-width', 10)
                        .transition()
                        .duration(3000)
                        .attr('stroke-width', 3)
                        .attr('stroke-dashoffset', 0)

                    d3.select('#time-graph-svg')
                        .append('g')
                        .selectAll('dot')
                        .data(
                            answer.values.filter(
                                (value, i) => i !== answer.values.length - 1 && i !== 0
                            )
                        )
                        .enter()
                        .append('circle')
                        .attr('cx', function (d) {
                            return x(d.parsedCreatedAt)
                        })
                        .attr('cy', function (d) {
                            return y(d.accumulatedValue / 100)
                        })
                        .attr('r', 3)
                        .style('fill', colorScale(i))
                        .style('opacity', 0)
                        .transition()
                        .duration(3000)
                        .style('opacity', 0.4)
                }
            })

            d3.select('#time-graph-svg')
                .append('g')
                .call(xAxis)
                .attr('transform', `translate(0,${height - margin.bottom})`)
                .style('opacity', 0)
                .transition()
                .duration(2000)
                .style('opacity', 1)

            d3.select('#time-graph-svg')
                .append('g')
                .call(yAxis)
                .attr('transform', 'translate(50,0)')
                .style('opacity', 0)
                .transition()
                .duration(2000)
                .style('opacity', 1)
        }
    }, [pollVotes])

    return (
        <div>
            <button onClick={() => setBezierCurves(!bezierCurves)}>Toggle bezier curves</button>
            <svg id='time-graph-svg' height={height} width={width}>
                <g>
                    {postData.createdAt &&
                        pollVotesGroupedByAnswer.map((answer, i) => (
                            <path
                                key={i}
                                id={`line-${answer.key}`}
                                d={line(answer.values)}
                                fill='transparent'
                                stroke={colorScale(i)}
                                strokeWidth={3}
                            />
                        ))}
                </g>
            </svg>
        </div>
    )
}

export default PollResultsTimeGraph
