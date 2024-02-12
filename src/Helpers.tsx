/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-control-regex */
import config from '@src/Config'
import {
    AudioIcon,
    CalendarIcon,
    CardIcon,
    CastaliaIcon,
    ImageIcon,
    LinkIcon,
    PollIcon,
    TextIcon,
} from '@svgs/all'
import axios from 'axios'
import { EditorState, convertFromRaw } from 'draft-js'
import React from 'react'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'
import { IUser } from './Interfaces'

// constants
export const megaByte = 1048576
export const imageMBLimit = 10
export const audioMBLimit = 30
export const totalMBUploadLimit = 50
export const allowedImageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
export const allowedAudioTypes = ['.mp3', '.mpeg']
export const maxPostChars = 5000
export const maxUrls = 5
const cookies = new Cookies()

export type GameSettings = {
    synchronous: boolean
    multiplayer: boolean
    players: IUser[]
    startTime?: string
    endTime?: string
    allowedBeadTypes: MediaType[]
    totalMoves?: number
    movesPerPlayer?: number
    moveDuration?: number
    introDuration?: number | null
    intervalDuration?: number
    outroDuration?: number
    characterLimit?: number
    moveTimeWindow?: number
}

export type GameState = GameSettings & {
    totalBeads: number
    state: 'active' | 'cancelled'
    nextMoveDeadline: number
}

export type GameData = GameSettings & { id: number; locked?: boolean }

type GameConfig = {
    defaultSettings: GameSettings
    settingsEditable?: boolean
}

export const GAMES: Record<GameType, GameConfig> = {
    'glass-bead-game': {
        defaultSettings: {
            synchronous: true,
            startTime: '',
            endTime: '',
            multiplayer: true,
            players: [],
            allowedBeadTypes: ['audio'],
            totalMoves: 0,
            movesPerPlayer: 5,
            moveDuration: 60,
            introDuration: 0,
            intervalDuration: 0,
            outroDuration: 0,
            characterLimit: 0,
            moveTimeWindow: 0,
        },
        settingsEditable: true,
    },
    'wisdom-gym': {
        defaultSettings: {
            synchronous: true,
            multiplayer: true,
            players: [],
            allowedBeadTypes: ['audio'],
        },
        settingsEditable: false,
    },
}

export const GAME_TYPES = ['glass-bead-game', 'wisdom-gym'] as const

export type GameType = (typeof GAME_TYPES)[number]

export const isGame = (type: string): type is GameType => GAME_TYPES.includes(type as GameType)

export const includesGame = (mediaTypes: string) =>
    GAME_TYPES.some((type) => mediaTypes.includes(type))

export const getGameType = (mediaTypes: string) =>
    GAME_TYPES.find((type) => mediaTypes.includes(type))!

export const MEDIA_TYPES = [
    'text',
    'url',
    'image',
    'audio',
    'event',
    'poll',
    ...GAME_TYPES,
    'card',
] as const

export type MediaType = (typeof MEDIA_TYPES)[number]

export const POST_TYPE = [
    'post',
    'comment',
    'bead',
    'poll-answer',
    'card-face',
    'gbg-room-comment',
    'url-block',
    'image-block',
    'audio-block',
] as const

export type PostType = (typeof POST_TYPE)[number]

export type UrlBlock = {
    Post: BlockPost<UrlMediaLink>
}

export type BlockPost<MediaLinkType> = {
    MediaLink: MediaLinkType
}

export type UrlMediaLink = {
    Url: Url
}

export type Url = any

export type ImageBlock = {
    Post: BlockPost<ImageMediaLink>
}

export type ImageMediaLink = {
    Image: any
}

export type AudioBlock = {
    Post: BlockPost<AudioMediaLink>
}

export type AudioMediaLink = {
    Audio: unknown
}

export type Post = {
    id: number
    type: PostType
    mediaTypes: string
    title: string
    text: string
    createdAt: string
    updatedAt: string
    totalComments: number
    totalLikes: number
    totalRatings: number
    totalReposts: number
    totalLinks: number
    Creator: IUser
    DirectSpaces: { id: number }[]
    UrlBlocks?: UrlBlock[]
    ImageBlocks?: ImageBlock[]
    AudioBlocks?: AudioBlock[]
    Event: Event
    Image: { url: string }
    Audio: { id: number; url: string }
    Url: { id: number }
}

export type Event = {
    id: number
    startTime: string
    endTime: string
    Going: UserEvent[]
    Interested: UserEvent[]
}

export type UserEvent = { id: number; flagImagePath: string }

export const weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
]

export const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

export const defaultErrorState = {
    required: true,
    errors: [] as string[],
    state: 'default' as 'default' | 'valid' | 'invalid',
}

export const defaultPostData = {
    id: uuidv4(),
    type: 'post',
    text: '',
    totalLikes: 0,
    totalComments: 0,
    totalReposts: 0,
    totalRatings: 0,
    totalLinks: 0,
    Creator: { id: 0, handle: '', name: '', flagImagePath: '' },
    DirectSpaces: [] as any[],
    IndirectSpaces: [] as any[],
    Comments: [] as any[],
    Reactions: [] as any[],
    IncomingLinks: [] as any[],
    OutgoingLinks: [] as any[],
    // Link: [] as any[],
    Images: [] as any[],
    Audios: [] as any[],
    Event: null as any,
    Poll: null as any,
    GlassBeadGame: null as any,
    Beads: [] as any[],
    // Weave: null as any,
    Players: [] as any[],
}

// export const defaultBeadData = {
//     id: uuidv4(),
//     type: 'text',
//     color: '#fff',
//     // text: '',
//     // // url: '',
//     // // urlData: null,
//     // // audioFile: null,
//     // // audioBlob: null,
//     // // audioType: '',
//     // urlData: null,
//     // image: null,
//     // audio: null,
// }

export const defaultSpaceData = {
    id: uuidv4(),
    handle: '',
    name: '',
    description: '',
    flagImagePath: null,
    coverImagePath: null,
    createdAt: new Date(),
    totalFollowers: 0,
    totalComments: 0,
    totalReactions: 0,
    totalLikes: 0,
    totalRatings: 0,
    totalPosts: 0,
    totalChildren: 0,
}

export const postTypeIcons = {
    text: <TextIcon />,
    url: <LinkIcon />,
    image: <ImageIcon />,
    audio: <AudioIcon />,
    event: <CalendarIcon />,
    poll: <PollIcon />,
    card: <CardIcon />,
    'glass-bead-game': <CastaliaIcon />,
}

// functions
export function isPlural(number: number): boolean {
    return number < 1 || number > 1
}

export function pluralise(number: number): string {
    return number < 1 || number > 1 ? 's' : ''
}

export function capitalise(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function resizeTextArea(target: HTMLElement): void {
    const t = target
    t.style.height = ''
    t.style.height = `${target.scrollHeight}px`
}

export function dateCreated(createdAt: string | undefined): string | undefined {
    if (createdAt === undefined) return undefined
    const sourceDate = new Date(createdAt)
    const d = sourceDate.toString().split(/[ :]/)
    const date = `${d[2]}-${d[1]}-${d[3]} @ ${d[4]}:${d[5]}`
    return date
}

export function timeSinceCreated(createdAt: string | undefined): string | undefined {
    if (createdAt === undefined) return undefined
    const now = Date.parse(new Date().toString())
    const createdAtDate = Date.parse(createdAt)
    const difference = now - createdAtDate
    const second = 1000
    const minute = second * 60
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    const year = day * 365

    let time
    if (difference < minute) {
        const number = Number((difference / second).toFixed(0))
        time = `${number} second${pluralise(number)} ago`
    }
    if (difference >= minute && difference < hour) {
        const number = Number((difference / minute).toFixed(0))
        time = `${number} minute${pluralise(number)} ago`
    }
    if (difference >= hour && difference < day) {
        const number = Number((difference / hour).toFixed(0))
        time = `${number} hour${pluralise(number)} ago`
    }
    if (difference >= day && difference < week) {
        const number = Number((difference / day).toFixed(0))
        time = `${number} day${pluralise(number)} ago`
    }
    if (difference >= week && difference < year) {
        const number = Number((difference / week).toFixed(0))
        time = `${number} week${pluralise(number)} ago`
    }
    if (difference >= year) {
        const number = Number((difference / year).toFixed(0))
        time = `${number} year${pluralise(number)} ago`
    }
    return time
}

export function timeSinceCreatedShort(createdAt: string | undefined): string | undefined {
    if (createdAt === undefined) return undefined
    const now = Date.parse(new Date().toString())
    const createdAtDate = Date.parse(createdAt)
    const difference = now - createdAtDate
    const second = 1000
    const minute = second * 60
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    const year = day * 365

    let time
    if (difference < minute) {
        const number = Number((difference / second).toFixed(0))
        time = `${number}s`
    }
    if (difference >= minute && difference < hour) {
        const number = Number((difference / minute).toFixed(0))
        time = `${number}m`
    }
    if (difference >= hour && difference < day) {
        const number = Number((difference / hour).toFixed(0))
        time = `${number}h`
    }
    if (difference >= day && difference < week) {
        const number = Number((difference / day).toFixed(0))
        time = `${number}d`
    }
    if (difference >= week && difference < year) {
        const number = Number((difference / week).toFixed(0))
        time = `${number}w`
    }
    if (difference >= year) {
        const number = Number((difference / year).toFixed(0))
        time = `${number}y`
    }
    return time
}

export function formatTimeMMSS(seconds: number): string {
    // output: '00m 00s'
    const s = Math.floor(seconds)
    const mins = Math.floor(s / 60)
    const secs = mins ? s - mins * 60 : s
    return `${mins < 10 ? '0' : ''}${mins}m ${+secs < 10 ? '0' : ''}${secs}s`
}

export function formatTimeHHDDMMSS(seconds: number): string {
    // output: '1d 2h 3m 4s'
    // values only included if > 0
    const min = 60
    const hour = min * 60
    const day = hour * 24
    const days = Math.floor(seconds / day)
    const hours = Math.floor(seconds / hour) - days * 24
    const mins = Math.floor(seconds / min) - (days * 60 * 24 + hours * 60)
    const secs = Math.floor(seconds) - (days * 24 * 60 * 60 + hours * 60 * 60 + mins * 60)
    const dayText = days ? `${days}d ` : ''
    const hourText = hours ? `${hours}h ` : ''
    const minText = mins ? `${mins}m ` : ''
    const secText = secs ? `${secs}s` : ''
    return `${dayText}${hourText}${minText}${secText}`
}

export function formatTimeDHM(seconds: number): string {
    // output: '0 days, 0 hours, 0 mins' (days and hours only included if > 0)
    const min = 60
    const hour = min * 60
    const day = hour * 24
    const days = Math.floor(seconds / day)
    const hours = Math.floor(seconds / hour) - days * 24
    const mins = Math.floor(seconds / min) - (days * 1440 + hours * 60)

    return `${days ? `${days} day${pluralise(days)}${hours || mins ? ', ' : ''}` : ''}${
        hours ? `${hours} hour${pluralise(hours)}${mins ? ', ' : ''}` : ''
    }${mins ? `${mins} min${pluralise(mins)}` : ''}`
}

export function formatTimeMDYT(isoDate: Date): string {
    // output: 'March 22, 2022 14:02'
    const date = new Date(isoDate)
    const month = monthNames[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    const hours = date.getHours()
    const mins = date.getMinutes()
    return `${month} ${day}, ${year} @ ${hours}:${mins < 10 ? `0${mins}` : mins}`
}

export function formatTimeHM(isoDate: Date): string {
    // output: '14:02'
    const date = new Date(isoDate)
    const hours = date.getHours()
    const mins = date.getMinutes()
    return `${hours}:${mins < 10 ? `0${mins}` : mins}`
}

export function onPageBottomReached(set: (payload: boolean) => void): void {
    const offset = 150
    const d = document.documentElement
    if (d.scrollHeight - d.scrollTop - offset < d.clientHeight) set(true)
    else set(false)
}

export function onElementBottomReached(id: string, set: (payload: boolean) => void): void {
    const element = document.getElementById(id) as HTMLElement
    const { scrollTop, clientHeight, scrollHeight } = element
    const offset = 10
    const height = scrollHeight - clientHeight
    const bottomReached = scrollTop + offset > height
    set(bottomReached)
}

export function allValid(items: any, setItems: (newItems: any) => void): boolean {
    let valid = true
    const newItems = { ...items }
    Object.keys(newItems).forEach((itemKey) => {
        const item = newItems[itemKey]
        const errors = item.required ? item.validate(item.value) : []
        item.state = errors.length ? 'invalid' : 'valid'
        item.errors = errors
        if (errors.length) valid = false
    })
    setItems(newItems)
    return valid
}

export function isValid(item: any, setItem: (newItem: any) => void): boolean {
    let valid = true
    const newItem = { ...item }
    newItem.errors = item.required ? item.validate(item.value) : []
    newItem.state = newItem.errors.length ? 'invalid' : 'valid'
    if (newItem.errors.length) valid = false
    setItem(newItem)
    return valid
}

export function updateFormItem(
    form: any,
    setForm: (newForm: any) => void,
    item: string,
    value: any
): void {
    setForm({
        ...form,
        [item]: {
            ...form[item],
            state: 'default',
            value,
        },
    })
}

export function invalidateFormItem(
    form: any,
    setForm: (newForm: any) => void,
    item: string,
    error: string
): void {
    setForm({
        ...form,
        [item]: {
            ...form[item],
            state: 'invalid',
            errors: [error],
        },
    })
}

export function statTitle(text: string, value: number): string {
    return `${value} ${text}${pluralise(value)}`
}

export function isValidUrl(urlString: string): boolean {
    let url
    try {
        url = new URL(urlString)
    } catch (_) {
        return false
    }
    return url.protocol === 'http:' || url.protocol === 'https:'
}

export function isValidEmail(email: string): boolean {
    const emailRegex =
        /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    return email.match(emailRegex) !== null && !email.includes(' ')
}

export function getParamString(params: any, param?: string, value?: string): string {
    const newParams = { ...params }
    if (param) newParams[param] = value
    const queryString = [] as string[]
    Object.keys(newParams).forEach((p) => {
        queryString.push(`${p}=${newParams[p]}`)
    })
    return `?${queryString.join('&')}`
}

export function handleImageError(e: any, image: string): void {
    e.target.onerror = null
    // if http address and not already proxied via images.weserv.nl, proxy via images.weserv.nl
    if (!e.target.src.includes('https://') && !e.target.src.includes('//images.weserv.nl/')) {
        e.target.src = `//images.weserv.nl/?url=${image}`
    } else {
        e.target.src = `${config.publicAssets}/images/placeholders/broken-image.jpg`
    }
}

export function findDraftLength(text: string): number {
    if (!text.length) return 0
    const contentState = convertFromRaw(JSON.parse(text))
    const editorState = EditorState.createWithContent(contentState)
    return editorState.getCurrentContent().getPlainText().length
}

export function getDraftPlainText(text: string): string {
    const isDraft = text.slice(0, 10) === `{"blocks":`
    if (isDraft) {
        const contentState = convertFromRaw(JSON.parse(text))
        const editorState = EditorState.createWithContent(contentState)
        return editorState.getCurrentContent().getPlainText()
    }
    return text
}

export function scrollToElement(element: HTMLElement): void {
    const yOffset = window.screen.height / 3
    const top = element.getBoundingClientRect().top + window.pageYOffset - yOffset
    window.scrollTo({ top, behavior: 'smooth' })
}

export function findEventTimes(start, end?) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const sameDay =
        end &&
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate()
    const sameMinute =
        sameDay &&
        startDate.getHours() === endDate.getHours() &&
        startDate.getMinutes() === endDate.getMinutes()
    // no end or ends the same minute: June 29, 2022 at 22:00
    // ends on same day: June 29, 2022 at 22:00 → 23:00
    // ends on different day: June 29, 2022 at 22:00 → June 30, 2022 at 22:00
    return `${formatTimeMDYT(start)} ${
        end && !sameMinute ? `→ ${sameDay ? formatTimeHM(end) : formatTimeMDYT(end)}` : ''
    }`
}

export function findEventDuration(start, end?) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const sameMinute =
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate() &&
        startDate.getHours() === endDate.getHours() &&
        startDate.getMinutes() === endDate.getMinutes()
    const difference = (endDate.getTime() - startDate.getTime()) / 1000
    if (end && !sameMinute)
        // rounded up to nearest minute
        return `(${formatTimeDHM(Math.ceil(difference / 60) * 60)})`
    return null
}

export function trimNumber(number, maxValue) {
    // if invalid number: return 0
    // if greater than max value: return max value
    return number ? (number > maxValue ? maxValue : number) : 0
}

export function trimText(text: string, maxChars: number) {
    if (text) return text.length > maxChars ? text.substring(0, maxChars).concat('...') : text
    return '...'
}

export function simplifyText(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

export function findDHMFromMinutes(minutes) {
    // return { days, hours, minutes } object from minutes
    const days = Math.floor(minutes / 60 / 24)
    const hours = Math.floor(minutes / 60) - days * 24
    const mins = minutes - days * 24 * 60 - hours * 60
    return { days, hours, minutes: mins }
}

export function findMinutesFromDHM(values) {
    // find minutes from { days, hours, minutes } object
    return values.days * 24 * 60 + values.hours * 60 + values.minutes
}

export function findUrlSearchableText(urlData) {
    const { url, title, description, domain } = urlData
    const fields = [] as any
    if (url) fields.push(url)
    if (title) fields.push(title)
    if (description) fields.push(description)
    if (domain) fields.push(domain)
    return fields.length ? fields.join(' ') : null
}

export function findSearchableText(post) {
    const { title, text, urls, images, audios, card } = post
    let fields = [] as any
    if (title) fields.push(title)
    if (text) fields.push(getDraftPlainText(text))
    if (urls) urls.forEach((url) => url.searchableText && fields.push(url.searchableText))
    if (images) images.forEach((image) => image.text && fields.push(image.text))
    if (audios) audios.forEach((audio) => audio.text && fields.push(audio.text))
    if (card && card.front.searchableText) fields.push(card.front.searchableText)
    if (card && card.back.searchableText) fields.push(card.back.searchableText)
    fields = fields.filter((field) => field)
    return fields.length ? fields.join(' ') : null
}

export function getTextSelection() {
    let text = ''
    let selection
    if (window.getSelection) {
        selection = window.getSelection()
        if (selection.rangeCount) {
            const fragment = selection.getRangeAt(0).cloneContents()
            const element = document.createElement('div')
            element.appendChild(fragment)
            text = element.innerHTML
        }
    }
    return text
}

export function scrapeUrl(url): any {
    const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
    return axios.get(`${config.apiURL}/scrape-url?url=${url}`, options)
}

function findTotalUploadSize(post) {
    const { images, audios, poll, glassBeadGame, card } = post
    let imageSize = 0
    if (images)
        imageSize = images
            .filter((i) => i.Image.file)
            .map((i) => i.Image.file.size)
            .reduce((a, b) => a + b, 0)
    let audioSize = 0
    if (audios) audioSize = audios.map((a) => a.Audio.file.size).reduce((a, b) => a + b, 0)
    let pollSize = 0
    if (poll) pollSize = poll.answers.map((a) => a.totalSize).reduce((a, b) => a + b, 0)
    let gbgSize = 0
    if (glassBeadGame) {
        const { topicImage, beads } = glassBeadGame
        if (topicImage.Image.file) gbgSize += topicImage.Image.file.size
        gbgSize += beads.map((a) => a.totalSize).reduce((a, b) => a + b, 0)
    }
    let cardSize = 0
    if (card && card.front.image) cardSize += card.front.image.file.size
    if (card && card.back.image) cardSize += card.back.image.file.size
    const total = imageSize + audioSize + pollSize + gbgSize + cardSize
    return +(total / megaByte).toFixed(2)
}

export function validatePost(post, constraints?) {
    const { mediaTypes, title, text, images, audios, event, poll, card, glassBeadGame } = post
    const errors = [] as string[]
    // upload size
    const totalSize = findTotalUploadSize(post)
    if (totalSize > totalMBUploadLimit)
        errors.push(
            `Total upload size (${totalSize} MBs) must be less than ${totalMBUploadLimit} MBs`
        )
    // image
    if (mediaTypes.includes('image') && !images.length) errors.push('No images added')
    // audio
    if (mediaTypes.includes('audio') && !audios.length) errors.push('No audio added')
    // event
    if (mediaTypes.includes('event')) {
        const { startTime } = event
        if (!startTime) errors.push('Start time required for events')
        if (!title && !text) errors.push('Title or text required for events')
    }
    // poll
    if (mediaTypes.includes('poll')) {
        const { answers, locked } = poll
        if (locked && answers.length < 2)
            errors.push('At least 2 answers required for locked polls')
        if (!title && !text) errors.push('Title or text required for polls')
    }
    // glass bead game
    if (mediaTypes.includes('glass-bead-game')) {
        const { settings, beads } = glassBeadGame
        const { synchronous, multiplayer } = settings
        if (!title) errors.push('Topic required')
        if (!synchronous && !multiplayer && !beads.length)
            errors.push('At least 1 bead required for single player games')
    }
    // card
    if (mediaTypes.includes('card')) {
        const { front, back } = card
        if (!front.images[0] && !findDraftLength(front.text))
            errors.push('No content added to front of card')
        if (!back.images[0] && !findDraftLength(back.text))
            errors.push('No content added to back of card')
    }
    return { errors, totalSize }
}

function attachPostFiles(formData, postData) {
    // attaches postData files to formData (recursive for poll answers, cards, and beads)
    const { mediaTypes, images, audios, poll, card, glassBeadGame } = postData
    if (mediaTypes.includes('image')) {
        images.forEach((i) => {
            if (i.Image.file) formData.append('image', i.Image.file, i.id)
        })
    }
    if (mediaTypes.includes('audio')) {
        audios.forEach((a) =>
            formData.append(`audio${a.Audio.file.name ? '' : '-blob'}`, a.Audio.file, a.id)
        )
    }
    if (poll) poll.answers.forEach((answer) => attachPostFiles(formData, answer))
    if (glassBeadGame) {
        const { topicImage, beads } = glassBeadGame
        if (topicImage.Image.file) formData.append('image', topicImage.Image.file, topicImage.id)
        beads.forEach((bead) => attachPostFiles(formData, bead))
    }
    if (card) attachPostFiles(formData, card.front)
    if (card) attachPostFiles(formData, card.back)
    // // add other contextual data
    // if (sourceId) {
    //     postData.sourceType = sourceType
    //     postData.sourceId = sourceId
    //     postData.linkDescription = linkDescription || null
    // }
    // if (governance) {
    //     postData.governance = true
    //     postData.pollAction = pollAction
    //     postData.pollThreshold = pollThreshold
    // }
    postData.searchableText = findSearchableText(postData)
}

export function uploadPost(post) {
    const postData = { ...post }
    const formData = new FormData()
    attachPostFiles(formData, postData)
    formData.append('post-data', JSON.stringify(postData))
    const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
    let route = post.type
    if (post.type === 'chat-reply') route = 'chat-message'
    return axios.post(`${config.apiURL}/create-${route}`, formData, options)
}

export function baseUserData(accountData) {
    const { id, name, handle, flagImagePath } = accountData
    return { id, name, handle, flagImagePath }
}
