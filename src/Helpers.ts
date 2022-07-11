import { v4 as uuidv4 } from 'uuid'

// constants
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

// functions
export function isPlural(value: number): boolean {
    return value < 1 || value > 1
}

export function pluralise(value: number): string {
    return value < 1 || value > 1 ? 's' : ''
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
    return `${month} ${day}, ${year} at ${hours}:${mins < 10 ? `0${mins}` : mins}`
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

export function getParamString(params: any, param?: string, value?: string): string {
    const newParams = { ...params }
    if (param) newParams[param] = value
    const queryString = [] as string[]
    Object.keys(newParams).forEach((p) => {
        queryString.push(`${p}=${newParams[p]}`)
    })
    return `?${queryString.join('&')}`
}
