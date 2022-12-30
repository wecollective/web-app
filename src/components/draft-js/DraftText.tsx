/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable react/jsx-props-no-spreading */
import Mention from '@components/draft-js/Mention'
import Markdown from '@components/Markdown'
import createLinkPlugin from '@draft-js-plugins/anchor'
import Editor from '@draft-js-plugins/editor'
// import createEmojiPlugin, { defaultTheme } from '@draft-js-plugins/emoji'
// import '@draft-js-plugins/emoji/lib/plugin.css'
import createLinkifyPlugin from '@draft-js-plugins/linkify'
import createMentionPlugin from '@draft-js-plugins/mention'
import '@draft-js-plugins/mention/lib/plugin.css'
import createTextAlignmentPlugin from '@draft-js-plugins/text-alignment'
import styles from '@styles/components/draft-js/DraftText.module.scss'
import { ContentState, convertFromRaw, EditorState } from 'draft-js'
import React, { useEffect, useRef, useState } from 'react'

const DraftText = (props: {
    stringifiedDraft: string
    className?: string
    markdownStyles?: string
    style?: any
}): JSX.Element => {
    const { stringifiedDraft, className, markdownStyles, style } = props
    const [type, setType] = useState('')
    const [editorState, setEditorState] = useState<any>(null)
    const [mentionPlugin] = useState(
        createMentionPlugin({
            mentionTrigger: '@',
            mentionComponent: Mention,
        })
    )
    // const [emojiPlugin] = useState(
    //     createEmojiPlugin({
    //         theme: {
    //             ...defaultTheme,
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
    const [linkPlugin] = useState(createLinkPlugin())
    const [linkifyPlugin] = useState(
        createLinkifyPlugin({
            component: (linkifyProps) => <a {...linkifyProps} />,
        })
    )
    const plugins = [textAlignmentPlugin, mentionPlugin, linkPlugin, linkifyPlugin] // emojiPlugin
    const editorRef = useRef<any>(null)

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

    useEffect(() => {
        // isDraft boolean used as temporary solution until old markdown converted to draft
        const isDraft = stringifiedDraft && stringifiedDraft.slice(0, 10) === `{"blocks":`
        const contentState = isDraft
            ? convertFromRaw(JSON.parse(stringifiedDraft))
            : ContentState.createFromText(stringifiedDraft || '')
        const newEditorState = EditorState.createWithContent(contentState)
        setEditorState(newEditorState)
        setType(isDraft ? 'draft' : 'markdown')
    }, [stringifiedDraft])

    return (
        <div className={`${styles.wrapper} ${className}`} style={style}>
            {type === 'draft' && (
                <Editor
                    editorState={editorState}
                    onChange={(newState) => setEditorState(newState)}
                    plugins={plugins}
                    customStyleMap={styleMap}
                    readOnly
                    ref={(element) => {
                        editorRef.current = element
                    }}
                />
            )}
            {type === 'markdown' && <Markdown text={stringifiedDraft} className={markdownStyles} />}
        </div>
    )
}

DraftText.defaultProps = {
    className: '',
    markdownStyles: '',
    style: null,
}

export default DraftText
