/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import * as d3 from 'd3'
import React, { useEffect, useState } from 'react'

const TimeGraph = (props: {
    type: string
    postId: number
    answers: any[]
    startTime: Date
}): JSX.Element => {
    const { type, postId, answers, startTime } = props
    const [bezierCurves, setBezierCurves] = useState(false)
    const weighted = type === 'weighted-choice'
    const width = document.body.clientWidth < 450 ? document.body.clientWidth : 450
    const height = 280
    const margin = { top: 20, right: 20, bottom: 20, left: 35 }

    const colorScale = d3
        .scaleSequential()
        .domain([0, answers.length])
        .interpolator(d3.interpolateViridis)

    function formatMinutes(number) {
        if (number < 10) return `0${number}`
        return number
    }

    // todo: put build step in function or seperate useeffect to seperate from canvas build step
    useEffect(() => {
        // get all time points
        const times = [new Date(startTime).getTime()]
        const votes = [] as any[]
        answers.forEach((answer) => {
            answer.Reactions.forEach((r) => {
                const createdAt = new Date(r.createdAt).getTime()
                const updatedAt = new Date(r.updatedAt).getTime()
                if (!times.includes(createdAt)) times.push(createdAt)
                if (r.state === 'removed' && !times.includes(updatedAt)) times.push(updatedAt)
                votes.push(r)
            })
        })
        times.sort((a, b) => a - b)
        times.push(new Date().getTime())

        // get data for each time point
        const timesData = [] as any
        let topScore = 0
        times.forEach((time) => {
            const activeVotes = votes.filter(
                (v) =>
                    new Date(v.createdAt).getTime() <= time &&
                    (v.state === 'active' || new Date(v.updatedAt).getTime() > time)
            )
            const voteData = [] as any
            answers.forEach((answer) => {
                const answerVotes = activeVotes.filter((v) => v.inquiryAnswerId === answer.id)
                const answerPoints = weighted
                    ? +answerVotes.map((v) => +v.value).reduce((a, b) => a + b, 0)
                    : 0
                const totalPoints = +activeVotes.map((v) => +v.value).reduce((a, b) => a + b, 0)
                const score = weighted ? totalPoints : activeVotes.length
                let percentageScore = 0
                if (activeVotes.length && weighted) percentageScore = (answerPoints / score) * 100
                if (activeVotes.length && !weighted)
                    percentageScore = (answerVotes.length / score) * 100
                if (percentageScore > topScore) topScore = percentageScore
                voteData.push({ answerId: answer.id, percentageScore })
            })
            timesData.push({ time, voteData })
        })

        // step through time points, find values changed, recalculate total, add to lines
        const lineData = [] as any[]
        answers.forEach((answer) => {
            const data = {
                key: answer.id,
                values: [] as any,
            }
            timesData.forEach((time) => {
                const vote = time.voteData.find((v) => v.answerId === answer.id)
                data.values.push({
                    time: time.time,
                    value: vote ? vote.percentageScore : 0,
                })
            })
            lineData.push(data)
        })
        lineData.sort(
            (a, b) => b.values[b.values.length - 1].value - a.values[a.values.length - 1].value
        )

        const minX = new Date(startTime).getTime()
        const maxX = new Date().getTime()
        const minY = 0
        const maxY = topScore

        const xScale = d3
            .scaleLinear()
            .domain([minX, maxX])
            .range([margin.left, width - margin.right])

        const yScale = d3
            .scaleLinear()
            .domain([minY, maxY])
            .range([height - margin.bottom, margin.top])

        const line = d3
            .line()
            .x((d) => xScale(d.time))
            .y((d) => yScale(d.value))

        if (bezierCurves) line.curve(d3.curveBundle.beta(1))

        const xAxis = d3
            .axisBottom()
            .scale(xScale)
            .tickFormat((d) => {
                const date = new Date(d)
                return `${date.getHours()}:${formatMinutes(
                    date.getMinutes()
                )} | ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
            })
            .tickArguments([2])

        const yAxis = d3
            .axisLeft()
            .scale(yScale)
            .tickFormat((d) => `${d}%`)
            .tickArguments([6])

        const canvas = d3.select(`#time-graph-${postId}`)
        // remove old chart if present
        d3.select(canvas.node()).select('svg').remove()
        // build new chart
        const svg = d3
            .select(canvas.node())
            .append('svg')
            .attr('id', 'svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .on('click', () => setBezierCurves(!bezierCurves))

        lineData.forEach((answer, index) => {
            const path = svg
                .append('path')
                .attr('id', `path-${answer.key}`)
                .attr('d', line(answer.values))

            const pathLength = path.node().getTotalLength()

            path.attr('stroke-dasharray', pathLength)
                .attr('stroke-dashoffset', pathLength)
                .attr('fill', 'transparent')
                .attr('stroke', colorScale(index))
                .attr('stroke-width', 10)
                .transition()
                .duration(3000)
                .attr('stroke-width', 3)
                .attr('stroke-dashoffset', 0)

            svg.append('g')
                .selectAll('dot')
                .data(answer.values.filter((value, i) => i !== answer.values.length - 1 && i !== 0))
                .enter()
                .append('circle')
                .attr('cx', (d) => xScale(d.time))
                .attr('cy', (d) => yScale(d.value))
                .attr('r', 3)
                .style('fill', colorScale(index))
                .style('opacity', 0)
                .transition()
                .duration(3000)
                .style('opacity', 0.4)
        })

        d3.select(canvas.node())
            .select('svg')
            .append('g')
            .call(xAxis)
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .style('opacity', 0)
            .transition()
            .duration(2000)
            .style('opacity', 1)

        d3.select(canvas.node())
            .select('svg')
            .append('g')
            .call(yAxis)
            .attr('transform', `translate(${margin.left},0)`)
            .style('opacity', 0)
            .transition()
            .duration(2000)
            .style('opacity', 1)
    }, [answers])

    return <div id={`time-graph-${postId}`} />
}

export default TimeGraph
