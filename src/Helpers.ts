/* eslint-disable no-nested-ternary */
/* eslint-disable no-control-regex */
import config from '@src/Config'
import { convertFromRaw, EditorState } from 'draft-js'
import { v4 as uuidv4 } from 'uuid'

// constants
export const imageMBLimit = 10
export const audioMBLimit = 25
export const totalMBUploadLimit = 50

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
    type: 'text',
    text: '',
    url: '',
    urlImage: null,
    urlDomain: null,
    urlTitle: null,
    urlDescription: null,
    totalLikes: 0,
    totalComments: 0,
    totalReposts: 0,
    totalRatings: 0,
    totalLinks: 0,
    Creator: {
        id: 0,
        handle: '',
        name: '',
        flagImagePath: '',
    },
    DirectSpaces: [] as any[],
    IndirectSpaces: [] as any[],
    Reactions: [] as any[],
    IncomingLinks: [] as any[],
    OutgoingLinks: [] as any[],
    PostImages: [] as any[],
    Event: null as any,
    Inquiry: null as any,
    GlassBeadGame: null as any,
    StringPosts: [] as any[],
    Weave: null as any,
    StringPlayers: [] as any[],
}

export const defaultBeadData = {
    id: uuidv4(),
    type: 'text',
    color: '#fff',
    text: '',
    url: '',
    urlData: null,
    audioFile: null,
    audioBlob: null,
    audioType: '',
    images: [],
}

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

export const defaultGBGSettings = {
    synchronous: true,
    startTime: '',
    endTime: '',
    multiplayer: false,
    openToAllUsers: true,
    players: [],
    fixPlayerColors: false,
    totalMoves: 5,
    movesPerPlayer: 5,
    moveDuration: 60,
    introDuration: 0,
    intervalDuration: 0,
    outroDuration: 0,
    allowedBeadTypes: ['Text', 'Url', 'Audio', 'Image'],
    characterLimit: 0,
    moveTimeWindow: 0,
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
    const date = `${d[4]}:${d[5]} on ${d[2]} ${d[1]} ${d[3]}`
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

export function notNull(value: number | null): number | false {
    return value !== null ? value : false
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

export function findDraftLength(stringifiedDraft: string): number {
    if (!stringifiedDraft.length) return 0
    const contentState = convertFromRaw(JSON.parse(stringifiedDraft))
    const editorState = EditorState.createWithContent(contentState)
    return editorState.getCurrentContent().getPlainText().length
}

export function getDraftPlainText(stringifiedDraft: string): string {
    const isDraft = stringifiedDraft.slice(0, 10) === `{"blocks":`
    if (isDraft) {
        const contentState = convertFromRaw(JSON.parse(stringifiedDraft))
        const editorState = EditorState.createWithContent(contentState)
        return editorState.getCurrentContent().getPlainText()
    }
    return stringifiedDraft
}

export function scrollToElement(element: HTMLElement): void {
    const yOffset = window.screen.height / 2.3
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
