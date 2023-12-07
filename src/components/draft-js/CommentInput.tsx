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
import Mention from '@components/draft-js/Mention'
import Suggestion from '@components/draft-js/Suggestion'
import { AccountContext } from '@contexts/AccountContext'
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
    formatTimeMMSS,
    imageMBLimit,
} from '@src/Helpers'
import styles from '@styles/components/draft-js/CommentInput.module.scss'
import draftStyles from '@styles/components/draft-js/TextStyling.module.scss'
import { MicrophoneIcon, PaperClipIcon } from '@svgs/all'
import axios from 'axios'
import { ContentState, EditorState, convertToRaw } from 'draft-js'
import React, { useContext, useEffect, useRef, useState } from 'react'
import RecordRTC from 'recordrtc'
import { v4 as uuidv4 } from 'uuid'

function CommentInput(props: {
    placeholder: string
    onSave: (data: any) => void
    saveLoading?: boolean
    maxChars?: number
    className?: string
    style?: any
}): JSX.Element {
    const { placeholder, onSave, saveLoading, maxChars, className, style } = props
    const { accountData } = useContext(AccountContext)
    const [editorState, setEditorState] = useState<any>(null)
    const [urls, setUrls] = useState<string[]>([])
    const [mentions, setMentions] = useState([])
    const [images, setImages] = useState<any[]>([])
    const [imageSizeError, setImageSizeError] = useState(false)
    const [audios, setAudios] = useState<any[]>([])
    const [audioSizeError, setAudioSizeError] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const audioRecorder = useRef<any>(null)
    const recordingInterval = useRef<any>(null)
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [characterLength, setCharacterLength] = useState(0)
    const [focused, setFocused] = useState(false)
    const [totalUploadSizeError, setTotalUploadSizeError] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any>(null)
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

    function onEditorStateChange(newEditorState) {
        setEditorState(newEditorState)
        const contentState = newEditorState.getCurrentContent()
        setCharacterLength(contentState.getPlainText().length)
        // extract urls
        const extractedLinks = extractLinks(contentState.getPlainText())
        if (extractedLinks) setUrls(extractedLinks.map((link) => link.url))
        // extract mentions
        const newMentions = [] as any
        const rawDraft = convertToRaw(contentState)
        const entities = rawDraft.entityMap
        Object.keys(entities).forEach((key) => {
            if (entities[key].type === 'mention') newMentions.push(entities[key].data.mention)
        })
        setMentions(newMentions)
        // onChange(JSON.stringify(rawDraft), mentions, urls)
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
                if (allowedImageTypes.includes(`.${fileType}`)) {
                    if (input.files[i].size > imageMBLimit * 1024 * 1024) setImageSizeError(true)
                    else {
                        const newImage = {
                            id: uuidv4(),
                            Image: {
                                file: input.files[i],
                                url: URL.createObjectURL(input.files[i]),
                            },
                        }
                        setImages((oldImages) => [...oldImages, newImage])
                    }
                }
                if (allowedAudioTypes.includes(`.${fileType}`)) {
                    if (input.files[i].size > audioMBLimit * 1024 * 1024) setAudioSizeError(true)
                    else {
                        const newAudio = {
                            id: uuidv4(),
                            Audio: {
                                file: input.files[i],
                                url: URL.createObjectURL(input.files[i]),
                            },
                        }
                        setAudios((oldAudios) => [...oldAudios, newAudio])
                    }
                }
            }
        }
    }

    function removeImage(id) {
        setTotalUploadSizeError(false)
        setImages(images.filter((image) => image.id !== id))
    }

    function removeAudio(id) {
        setTotalUploadSizeError(false)
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

    useEffect(() => {
        initializeDropBox()
        // set up editor
        // isDraft boolean used as temporary solution until old markdown converted to draft
        // const isDraft = text && text.slice(0, 10) === `{"blocks":`
        const contentState = ContentState.createFromText('')
        const newEditorState = EditorState.createWithContent(contentState)
        setEditorState(newEditorState)
        setCharacterLength(newEditorState.getCurrentContent().getPlainText().length)
        // set up click outside handler
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={wrapperRef} className={`${styles.wrapper} ${className}`} style={style}>
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
                                loading={saveLoading}
                                onClick={() => onSave('')}
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
            <Row className={`${styles.characters} ${focused && styles.visible}`}>
                <p className={maxChars && characterLength > maxChars ? styles.error : ''}>
                    {characterLength}
                    {maxChars ? `/${maxChars}` : ''} Chars
                </p>
            </Row>
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
                        <Column key={audio.id} style={{ position: 'relative', margin: '10px 0' }}>
                            <CloseButton
                                size={18}
                                onClick={() => removeAudio(audio.id)}
                                style={{
                                    position: 'absolute',
                                    right: -4,
                                    top: -8,
                                    zIndex: 5,
                                }}
                            />
                            <AudioCard
                                id={audio.id}
                                url={audio.Audio.url}
                                staticBars={400}
                                location='new-post'
                                style={{ height: 100 }}
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
    saveLoading: false,
    maxChars: null,
    className: '',
    style: null,
}

export default CommentInput
