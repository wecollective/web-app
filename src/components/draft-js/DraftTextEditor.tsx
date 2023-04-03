/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
import Button from '@components/Button'
import Column from '@components/Column'
import Mention from '@components/draft-js/Mention'
import Suggestion from '@components/draft-js/Suggestion'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
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
// import createEmojiPlugin, { defaultTheme as emojiTheme } from '@draft-js-plugins/emoji'
// import '@draft-js-plugins/emoji/lib/plugin.css'
import createLinkifyPlugin, { extractLinks } from '@draft-js-plugins/linkify'
import createMentionPlugin from '@draft-js-plugins/mention'
import '@draft-js-plugins/mention/lib/plugin.css'
import createToolbarPlugin from '@draft-js-plugins/static-toolbar'
import createTextAlignmentPlugin from '@draft-js-plugins/text-alignment'
import config from '@src/Config'
import styles from '@styles/components/draft-js/DraftText.module.scss'
import axios from 'axios'
import { ContentState, convertFromRaw, convertToRaw, EditorState } from 'draft-js'
import React, { useContext, useEffect, useRef, useState } from 'react'

function DraftTextEditor(props: {
    id?: string
    type: 'post' | 'comment' | 'bead' | 'other'
    stringifiedDraft: string
    onChange: (text: string, mentions: any[], urls: string[]) => void
    onSubmit?: () => void
    submitLoading?: boolean
    maxChars?: number
    state?: 'default' | 'valid' | 'invalid'
    errors?: string[]
    className?: string
    style?: any
}): JSX.Element {
    const {
        id,
        type,
        stringifiedDraft,
        onChange,
        onSubmit,
        submitLoading,
        maxChars,
        state,
        errors,
        className,
        style,
    } = props
    const { accountData } = useContext(AccountContext)
    const [editorState, setEditorState] = useState<any>(null)
    const [toolbarPlugin] = useState(
        createToolbarPlugin({ theme: { buttonStyles: styles, toolbarStyles: styles } })
    )
    const [mentionPlugin] = useState(
        createMentionPlugin({
            mentionTrigger: '@',
            mentionComponent: Mention,
        })
    )
    // const [emojiPlugin] = useState(
    //     createEmojiPlugin({
    //         theme: {
    //             ...emojiTheme,
    //             emojiSelectButton: styles.emojiSelectButton,
    //             emojiSelectButtonPressed: `${styles.emojiSelectButton} ${styles.selected}`,
    //             emojiSelectPopover: styles.emojiSelectPopover,
    //         },
    //         // useNativeArt: true,
    //     })
    // )
    const [textAlignmentPlugin] = useState(
        createTextAlignmentPlugin({
            theme: {
                alignmentStyles: {
                    draftLeft: styles.alignLeft,
                    draftCenter: styles.alignCenter,
                    draftRight: styles.alignRight,
                },
            },
        })
    )
    const [linkPlugin] = useState(
        createLinkPlugin({
            theme: {
                ...anchorTheme,
                input: styles.linkInput,
            },
            placeholder: 'Add a valid URL & press Enter...',
        })
    )
    const [linkifyPlugin] = useState(
        createLinkifyPlugin({
            component: (linkifyProps) => <a {...linkifyProps} />,
        })
    )
    const plugins = [
        toolbarPlugin,
        textAlignmentPlugin,
        mentionPlugin,
        // emojiPlugin,
        linkPlugin,
        linkifyPlugin,
    ]
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [characterLength, setCharacterLength] = useState(0)
    const [focused, setFocused] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // const { EmojiSuggestions, EmojiSelect } = emojiPlugin
    const { TextAlignment } = textAlignmentPlugin as any
    const { LinkButton } = linkPlugin
    const { Toolbar } = toolbarPlugin
    const { MentionSuggestions } = mentionPlugin

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

    function onEditorStateChange(newEditorState) {
        setEditorState(newEditorState)
        const contentState = newEditorState.getCurrentContent()
        setCharacterLength(contentState.getPlainText().length)
        // extract urls
        let urls = [] as any
        const extractedLinks = extractLinks(contentState.getPlainText())
        if (extractedLinks) urls = extractedLinks.map((link) => link.url)
        // extract mentions
        const mentions = [] as any
        const rawDraft = convertToRaw(contentState)
        const entities = rawDraft.entityMap
        Object.keys(entities).forEach((key) => {
            if (entities[key].type === 'mention') mentions.push(entities[key].data.mention)
        })
        onChange(JSON.stringify(rawDraft), mentions, urls)
    }

    function onSearchChange({ value }) {
        const data = { query: value }
        axios
            .post(`${config.apiURL}/find-people`, data)
            .then((res) => {
                setSuggestions(
                    res.data.map((user) => {
                        return {
                            name: user.name,
                            link: user.handle,
                            avatar: user.flagImagePath,
                        }
                    })
                )
            })
            .catch((error) => console.log(error))
    }

    function handleClickOutside(e) {
        if (!wrapperRef.current!.contains(e.target)) setFocused(false)
    }

    useEffect(() => {
        // isDraft boolean used as temporary solution until old markdown converted to draft
        const isDraft = stringifiedDraft && stringifiedDraft.slice(0, 10) === `{"blocks":`
        const contentState = isDraft
            ? convertFromRaw(JSON.parse(stringifiedDraft))
            : ContentState.createFromText(stringifiedDraft || '')
        const newEditorState = EditorState.createWithContent(contentState)
        setEditorState(newEditorState)
        setCharacterLength(newEditorState.getCurrentContent().getPlainText().length)
    }, [])

    // set up listener for clicks outside element to update focus state
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    })

    return (
        <div
            id={id}
            className={`${styles.wrapper} ${styles.editable} ${styles[type]} ${className} ${
                styles[state || 'default']
            }`}
            ref={wrapperRef}
            style={style}
            role='button'
            tabIndex={0}
            onClick={() => setFocused(true)}
        >
            <Column className={styles.reverseColumn}>
                {/* <div className={styles.emojiButtonWrapper}>
                    <EmojiSelect closeOnEmojiSelect />
                    <EmojiSuggestions />
                </div> */}
                {editorState && (
                    <Row className={styles.editorWrapper}>
                        {type === 'comment' && (
                            <FlagImage
                                type='user'
                                size={35}
                                imagePath={accountData.flagImagePath}
                                style={{ marginTop: 10 }}
                            />
                        )}
                        <Editor
                            placeholder='Text...'
                            editorState={editorState}
                            plugins={plugins}
                            customStyleMap={styleMap}
                            onChange={onEditorStateChange}
                            stripPastedStyles
                            spellCheck
                        />
                        {type === 'comment' && (
                            <Button
                                color='blue'
                                size='medium-large'
                                text='Add'
                                loading={submitLoading}
                                onClick={onSubmit}
                                style={{ marginTop: 10 }}
                            />
                        )}
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
                                {/* <div className={styles.separator} /> */}
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
            <MentionSuggestions
                onSearchChange={onSearchChange}
                suggestions={suggestions}
                open={showSuggestions}
                onOpenChange={(openState) => setShowSuggestions(openState)}
                onAddMention={() => null}
                entryComponent={Suggestion}
            />
            <Row className={`${styles.characters} ${focused && styles.visible}`}>
                <p className={maxChars && characterLength > maxChars ? styles.error : ''}>
                    {characterLength}
                    {maxChars ? `/${maxChars}` : ''} Chars
                </p>
            </Row>

            {/* {(type === 'post' || state === 'invalid') && (
                <Row
                    centerY
                    spaceBetween
                    className={`${styles.stats} ${state === 'invalid' && styles.error}`}
                >
                    <Row className={styles.errors}>
                        {state === 'invalid' && <DangerIcon />}
                        {state === 'valid' && <SuccessIcon />}
                        {state === 'invalid' && errors!.map((error) => <p key={error}>{error}</p>)}
                    </Row>
                    <p>
                        {characterLength}
                        {maxChars ? `/${maxChars}` : ''} Chars
                    </p>
                </Row>
            )} */}
        </div>
    )
}

DraftTextEditor.defaultProps = {
    id: null,
    onSubmit: null,
    submitLoading: false,
    maxChars: null,
    state: 'default',
    errors: [],
    className: '',
    style: null,
}

export default DraftTextEditor
