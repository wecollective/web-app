/* eslint-disable no-param-reassign */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import RecordingIcon from '@components/animations/RecordingIcon'
import AudioCard from '@components/cards/PostCard/AudioCard'
import UrlCard from '@components/cards/PostCard/UrlCard'
import Mention from '@components/draft-js/Mention'
import Suggestion from '@components/draft-js/Suggestion'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import createLinkPlugin, { defaultTheme as anchorTheme } from '@draft-js-plugins/anchor'
import {
    BlockquoteButton,
    BoldButton,
    CodeBlockButton,
    CodeButton,
    ItalicButton,
    OrderedListButton,
    UnderlineButton,
    UnorderedListButton,
} from '@draft-js-plugins/buttons'
import Editor from '@draft-js-plugins/editor'
import '@draft-js-plugins/image/lib/plugin.css'
import createLinkifyPlugin, { extractLinks } from '@draft-js-plugins/linkify'
import createMentionPlugin from '@draft-js-plugins/mention'
import '@draft-js-plugins/mention/lib/plugin.css'
import createToolbarPlugin from '@draft-js-plugins/static-toolbar'
import createTextAlignmentPlugin from '@draft-js-plugins/text-alignment'
import config from '@src/Config'
import {
    allowedAudioTypes,
    allowedImageTypes,
    audioMBLimit,
    findSearchableText,
    findUrlSearchableText,
    formatTimeMMSS,
    imageMBLimit,
    maxPostChars,
    maxUrls,
    scrapeUrl,
    uploadPost,
    validatePost,
} from '@src/Helpers'
import styles from '@styles/components/draft-js/CommentInput.module.scss'
import draftStyles from '@styles/components/draft-js/TextStyling.module.scss'
import { MicrophoneIcon, PaperClipIcon } from '@svgs/all'
import axios from 'axios'
import { ContentState, EditorState, convertToRaw } from 'draft-js'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import RecordRTC from 'recordrtc'
import { v4 as uuidv4 } from 'uuid'

function CommentInput(props: {
    type: 'comment' | 'poll-answer' | 'chat-message' | 'chat-reply' // group thread, gbg room (?)
    links?: any
    placeholder: string
    preview?: boolean // determines whether onSave function uploads or just passes data back to parent
    maxChars?: number // todo: does this make sense to pass in here?
    className?: string
    style?: any
    onSave: (data: any) => void
    signalTyping?: (typing: boolean) => void
}): JSX.Element {
    const { type, links, preview, placeholder, maxChars, className, style, onSave, signalTyping } =
        props
    const { accountData } = useContext(AccountContext)
    const { spaceData } = useContext(SpaceContext)
    const [editorState, setEditorState] = useState<any>(null)
    const [rawUrls, setRawUrls] = useState<any[]>([])
    const [urls, setUrls] = useState<any[]>([])
    const [mentions, setMentions] = useState<any[]>([])
    const [images, setImages] = useState<any[]>([])
    const [audios, setAudios] = useState<any[]>([])
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [totalChars, setTotalChars] = useState(0)
    const [focused, setFocused] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [saveLoading, setSaveLoading] = useState(false)
    const audioRecorder = useRef<any>(null)
    const recordingInterval = useRef<any>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any>(null)
    const typingTimeout = useRef<any>(null)
    const inputId = uuidv4()
    const allowedFileTypes = [...allowedImageTypes, ...allowedAudioTypes]
    const styleMap = {
        CODE: {
            fontFamily: 'monospace',
            padding: 5,
            margin: '0 5px',
            borderRadius: 5,
            backgroundColor: '#ededef',
            lineHeight: '30px',
        },
    }
    const overMaxChars = totalChars > (maxChars || maxPostChars)
    const totalCharsText = `${totalChars}/${maxChars || maxPostChars}`
    const location = useLocation()
    const [x, page] = location.pathname.split('/')

    // plugins
    const toolbarOptions = { theme: { buttonStyles: styles, toolbarStyles: styles } }
    const mentionOptions = { mentionTrigger: '@', mentionComponent: Mention }
    const linkifyOptions = { target: '_blank', component: (Props) => <a {...Props} /> }
    const linkOptions = {
        theme: { ...anchorTheme, input: styles.linkInput },
        placeholder: 'Add a valid URL & press Enter...',
        linkTarget: '_blank',
    }
    const { draftLeft, draftCenter, draftRight } = draftStyles
    const alignmentOptions = { theme: { alignmentStyles: { draftLeft, draftCenter, draftRight } } }
    const [toolbarPlugin] = useState(createToolbarPlugin(toolbarOptions))
    const [mentionPlugin] = useState(createMentionPlugin(mentionOptions))
    const [linkifyPlugin] = useState(createLinkifyPlugin(linkifyOptions))
    const [linkPlugin] = useState(createLinkPlugin(linkOptions))
    const [alignmentPlugin] = useState(createTextAlignmentPlugin(alignmentOptions))
    const plugins = [toolbarPlugin, mentionPlugin, linkifyPlugin, linkPlugin, alignmentPlugin]
    const { TextAlignment } = alignmentPlugin as any
    const { LinkButton } = linkPlugin
    const { Toolbar } = toolbarPlugin
    const { MentionSuggestions } = mentionPlugin

    function focus() {
        setFocused(true)
        editorRef.current!.focus()
    }

    function handleClickOutside(e) {
        if (!wrapperRef.current!.contains(e.target)) setFocused(false)
    }

    function onEditorStateChange(newState) {
        setErrors([])
        setEditorState(newState)
        const content = newState.getCurrentContent()
        const plainText = content.getPlainText()
        const rawDraft = convertToRaw(content)
        // signal typing and set timeout
        if (signalTyping && totalChars < plainText.length) {
            if (typingTimeout.current) clearTimeout(typingTimeout.current)
            else signalTyping(true)
            typingTimeout.current = setTimeout(() => {
                signalTyping(false)
                typingTimeout.current = null
            }, 2000)
        }
        setTotalChars(plainText.length)
        // extract urls
        const extractedLinks = extractLinks(plainText)
        if (extractedLinks) setRawUrls(extractedLinks.map((link) => link.url))
        // extract mentions
        const newMentions = [] as any
        const entities = rawDraft.entityMap
        Object.keys(entities).forEach((key) => {
            if (entities[key].type === 'mention') newMentions.push(entities[key].data.mention)
        })
        setMentions(newMentions)
    }

    function findSuggestions({ value }) {
        axios
            .post(`${config.apiURL}/find-people`, { query: value })
            .then((res) => {
                setSuggestions(
                    res.data.map((u) => {
                        return { id: u.id, name: u.name, link: u.handle, avatar: u.flagImagePath }
                    })
                )
            })
            .catch((error) => console.log(error))
    }

    function addFiles(drop?) {
        const input = drop || (document.getElementById(`file-input-${inputId}`) as HTMLInputElement)
        if (input && input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i += 1) {
                const fileType = input.files[i].type.split('/')[1]
                // images
                if (allowedImageTypes.includes(`.${fileType}`)) {
                    const tooLarge = input.files[i].size > imageMBLimit * 1024 * 1024
                    if (tooLarge) setErrors([`Max image size: ${imageMBLimit} MBs`])
                    else {
                        const newImage = {
                            id: uuidv4(),
                            Image: {
                                file: input.files[i],
                                url: URL.createObjectURL(input.files[i]),
                            },
                        }
                        setImages((oldImages) => [...oldImages, newImage])
                        setErrors([])
                    }
                }
                // audio
                if (allowedAudioTypes.includes(`.${fileType}`)) {
                    const tooLarge = input.files[i].size > audioMBLimit * 1024 * 1024
                    if (tooLarge) setErrors([`Max audio size: ${audioMBLimit} MBs`])
                    else {
                        const newAudio = {
                            id: uuidv4(),
                            Audio: {
                                file: input.files[i],
                                url: URL.createObjectURL(input.files[i]),
                            },
                        }
                        setAudios((oldAudios) => [...oldAudios, newAudio])
                        setErrors([])
                    }
                }
            }
        }
    }

    function removeUrl(url) {
        setUrls(urls.filter((urlData) => urlData.url !== url))
    }

    function removeImage(id) {
        setErrors([])
        setImages(images.filter((image) => image.id !== id))
    }

    function removeAudio(id) {
        setErrors([])
        setAudios(audios.filter((audio) => audio.id !== id))
    }

    function toggleAudioRecording() {
        if (recording) {
            audioRecorder.current.stopRecording(() => {
                clearInterval(recordingInterval.current)
                const file = new File([audioRecorder.current.getBlob()], '', { type: 'audio/wav' })
                const newAudio = {
                    id: uuidv4(),
                    Audio: { file, url: URL.createObjectURL(file) },
                }
                setAudios((audio) => [...audio, newAudio])
            })
            setRecording(false)
        } else {
            setRecordingTime(0)
            navigator.mediaDevices
                .getUserMedia({ audio: { sampleRate: 24000 } })
                .then((audioStream) => {
                    audioRecorder.current = RecordRTC(audioStream, {
                        type: 'audio',
                        mimeType: 'audio/wav',
                        recorderType: RecordRTC.StereoAudioRecorder,
                        bufferSize: 16384,
                        numberOfAudioChannels: 1,
                        desiredSampRate: 24000,
                    })
                    audioRecorder.current.startRecording()
                    recordingInterval.current = setInterval(() => {
                        setRecordingTime((t) => t + 1)
                    }, 1000)
                    setRecording(true)
                })
        }
    }

    function initializeDropBox() {
        let dragLeaveCounter = 0 // used to avoid dragleave firing when hovering child elements
        const dropbox = wrapperRef.current
        if (dropbox) {
            dropbox.addEventListener('dragover', (e) => e.preventDefault())
            dropbox.addEventListener('dragenter', () => {
                dragLeaveCounter += 1
                if (dragLeaveCounter === 1) dropbox.classList.add(styles.dragOver)
            })
            dropbox.addEventListener('dragleave', () => {
                dragLeaveCounter -= 1
                if (dragLeaveCounter === 0) dropbox.classList.remove(styles.dragOver)
            })
            dropbox.addEventListener('drop', (e) => {
                e.preventDefault()
                dragLeaveCounter = 0
                dropbox.classList.remove(styles.dragOver)
                if (e.dataTransfer) addFiles(e.dataTransfer)
            })
        }
    }

    function findText() {
        const contentState = editorState.getCurrentContent()
        const rawDraft = convertToRaw(contentState)
        const text = JSON.stringify(rawDraft)
        return totalChars ? text : null
    }

    function findMediaTypes(post) {
        const mediaTypes = [] as string[]
        if (post.title || post.text) mediaTypes.push('text')
        if (post.urls.length) mediaTypes.push('url')
        if (post.images.length) mediaTypes.push('image')
        if (post.audios.length) mediaTypes.push('audio')
        return mediaTypes.join(',')
    }

    function saveDisabled() {
        const urlsLoading = urls.find((u) => u.loading)
        const noContent = !totalChars && !urls.length && !images.length && !audios.length
        return saveLoading || urlsLoading || noContent || overMaxChars
    }

    function resetData() {
        setSaveLoading(false)
        const newContentState = ContentState.createFromText('')
        const newEditorState = EditorState.createWithContent(newContentState)
        setEditorState(newEditorState)
        setTotalChars(newEditorState.getCurrentContent().getPlainText().length)
        setImages([])
        setAudios([])
        setUrls([])
    }

    function save() {
        setSaveLoading(true)
        // structure data
        const post = {
            id: inputId,
            type,
            text: findText(),
            mentions: mentions.map((m) => m.id),
            urls,
            images,
            audios,
        } as any
        post.mediaTypes = findMediaTypes(post)
        post.searchableText = findSearchableText(post)
        if (page === 's') post.originSpaceId = spaceData.id
        // validate post
        const validation = validatePost(post)
        if (validation.errors.length) {
            // display errors
            setErrors(validation.errors)
            setSaveLoading(false)
        } else if (preview) {
            // return post data to parent component
            const { id, handle, name, flagImagePath } = accountData
            post.Creator = { id, handle, name, flagImagePath }
            post.totalSize = validation.totalSize
            onSave(post)
            resetData()
        } else {
            post.links = links
            uploadPost(post)
                .then((res) => {
                    const newPost = res.data
                    const { id, handle, name, flagImagePath } = accountData
                    newPost.Creator = { id, handle, name, flagImagePath }
                    newPost.Comments = []
                    newPost.Reactions = []
                    newPost.links = links
                    if (type === 'poll-answer') newPost.Link = { state: 'active' }
                    onSave(newPost)
                    setFocused(false)
                    resetData()
                })
                .catch((error) => console.log(error))
        }
    }

    // initialize component
    useEffect(() => {
        initializeDropBox()
        // set up editor
        // todo: create with new state rather than from empty text
        const contentState = ContentState.createFromText('')
        const newEditorState = EditorState.createWithContent(contentState)
        setEditorState(newEditorState)
        setTotalChars(newEditorState.getCurrentContent().getPlainText().length)
        // set up click outside handler
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // grab metadata for new urls added to text field
    const requestIndex = useRef(0)
    useEffect(() => {
        const filteredUrls = Array.from(new Set(rawUrls)) // remove duplicates
            .filter((url) => !urls.find((u) => u.url === url)) // remove matches
            .slice(0, maxUrls - urls.length) // trim to maxUrl limit
        if (filteredUrls.length) {
            // requestIndex & setTimeout used to block requests until user has finished typing
            requestIndex.current += 1
            const index = requestIndex.current
            setTimeout(() => {
                if (requestIndex.current === index) {
                    filteredUrls.forEach(async (url) => {
                        // if no match in urls array
                        if (!urls.find((u) => u.url === url)) {
                            // add url loading state
                            setUrls((us) => [...us, { url, loading: true }])
                            // scrape url data
                            const { data } = await scrapeUrl(url)
                            // todo: handle error
                            if (data) {
                                data.url = url
                                data.searchableText = findUrlSearchableText(data)
                                // update urls array
                                setUrls((us) => {
                                    const newUrls = [...us.filter((u) => u.url !== url)]
                                    newUrls.push(data)
                                    return newUrls
                                })
                            }
                        }
                    })
                }
            }, 500)
        }
    }, [rawUrls])

    // focus on errors
    useEffect(() => {
        if (errors.length) setFocused(true)
    }, [errors])

    return (
        <div
            ref={wrapperRef}
            className={`${styles.wrapper} ${styles[type]} ${className}`}
            style={style}
        >
            <Column className={styles.reverseColumn}>
                {editorState && (
                    <Row className={styles.inputWrapper}>
                        <FlagImage
                            type='user'
                            size={35}
                            imagePath={accountData.flagImagePath}
                            style={{ marginTop: 3 }}
                        />
                        <Column className={draftStyles.editor}>
                            {!focused && (
                                <button
                                    type='button'
                                    className={styles.focusButton}
                                    onClick={focus}
                                    aria-label='Focus'
                                />
                            )}
                            <Editor
                                ref={editorRef}
                                placeholder={placeholder}
                                editorState={editorState}
                                plugins={plugins}
                                customStyleMap={styleMap}
                                onChange={onEditorStateChange}
                                stripPastedStyles
                                spellCheck
                            />
                        </Column>
                        <Row style={{ marginTop: 3, position: 'relative' }}>
                            {recording && (
                                <Row centerY className={styles.recordingTime}>
                                    <RecordingIcon />
                                    <p>{formatTimeMMSS(recordingTime)}</p>
                                </Row>
                            )}
                            <button
                                type='button'
                                className={styles.mediaButton}
                                onClick={toggleAudioRecording}
                            >
                                {recording ? <div className={styles.stop} /> : <MicrophoneIcon />}
                            </button>
                            <div className={styles.mediaButton}>
                                <label htmlFor={`file-input-${inputId}`}>
                                    <PaperClipIcon />
                                    <input
                                        id={`file-input-${inputId}`}
                                        type='file'
                                        accept={allowedFileTypes.join(',')}
                                        onChange={() => addFiles()}
                                        multiple
                                        hidden
                                    />
                                </label>
                            </div>
                            <Button
                                color='blue'
                                size='medium-large'
                                text='Add'
                                disabled={saveDisabled()}
                                loading={saveLoading}
                                onClick={save}
                            />
                        </Row>
                    </Row>
                )}
                <Row className={`${styles.toolbarWrapper} ${focused && styles.visible}`}>
                    <Toolbar>
                        {(externalProps) => (
                            <Row wrap>
                                <BoldButton {...externalProps} />
                                <ItalicButton {...externalProps} />
                                <UnderlineButton {...externalProps} />
                                <CodeButton {...externalProps} />
                                <UnorderedListButton {...externalProps} />
                                <OrderedListButton {...externalProps} />
                                <BlockquoteButton {...externalProps} />
                                <CodeBlockButton {...externalProps} />
                                <TextAlignment {...externalProps} />
                                <LinkButton {...externalProps} />
                            </Row>
                        )}
                    </Toolbar>
                </Row>
            </Column>
            <Row spaceBetween className={`${styles.footer} ${focused && styles.visible}`}>
                {errors.length > 0 ? <p className={styles.error}>{errors[0]}</p> : <p />}
                <p className={overMaxChars ? styles.error : ''}>{totalCharsText}</p>
            </Row>
            {/* todo: eventually replace with media sections like on PostCard? */}
            {urls.map((urlData) => (
                <Column key={urlData.url} style={{ marginTop: 10, position: 'relative' }}>
                    <CloseButton
                        size={18}
                        onClick={() => removeUrl(urlData.url)}
                        style={{ position: 'absolute', top: 5, right: 5, zIndex: 5 }}
                    />
                    <UrlCard
                        type='post'
                        urlData={urlData}
                        loading={urlData.loading}
                        style={{ backgroundColor: 'white' }}
                    />
                </Column>
            ))}
            {images.length > 0 && (
                <Row style={{ marginTop: 10 }}>
                    {images.map((image) => (
                        <Column key={image.id} className={styles.image}>
                            <CloseButton
                                size={16}
                                onClick={() => removeImage(image.id)}
                                style={{ position: 'absolute', top: 2, right: 2 }}
                            />
                            <img src={image.Image.url} alt='upload' />
                        </Column>
                    ))}
                </Row>
            )}
            {audios.length > 0 && (
                <Column style={{ marginTop: 10 }}>
                    {audios.map((audio) => (
                        <Column key={audio.id} className={styles.audio}>
                            <CloseButton
                                size={18}
                                onClick={() => removeAudio(audio.id)}
                                style={{ position: 'absolute', right: 5, top: 5, zIndex: 5 }}
                            />
                            <AudioCard
                                id={audio.id}
                                url={audio.Audio.url}
                                staticBars={250}
                                location='new-post'
                                style={{ height: '100%', width: '100%' }}
                            />
                        </Column>
                    ))}
                </Column>
            )}
            <MentionSuggestions
                onSearchChange={findSuggestions}
                suggestions={suggestions}
                entryComponent={Suggestion}
                open={showSuggestions}
                onOpenChange={(openState) => setShowSuggestions(openState)}
                onAddMention={() => null}
            />
        </div>
    )
}

CommentInput.defaultProps = {
    links: null,
    preview: false,
    maxChars: 0,
    className: '',
    style: null,
    signalTyping: null,
}

export default CommentInput
