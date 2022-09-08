import Markdown from '@components/Markdown'
import Mention from '@components/Mention'
import Editor from '@draft-js-plugins/editor'
import createEmojiPlugin, { defaultTheme } from '@draft-js-plugins/emoji'
import '@draft-js-plugins/emoji/lib/plugin.css'
import createMentionPlugin from '@draft-js-plugins/mention'
import '@draft-js-plugins/mention/lib/plugin.css'
import createTextAlignmentPlugin from '@draft-js-plugins/text-alignment'
import styles from '@styles/components/DraftText.module.scss'
import { ContentState, convertFromRaw, EditorState } from 'draft-js'
import React, { useEffect, useRef, useState } from 'react'

const DraftText = (props: {
    stringifiedDraft: string
    className?: string
    style?: any
}): JSX.Element => {
    const { stringifiedDraft, className, style } = props
    const [type, setType] = useState('')
    const [editorState, setEditorState] = useState<any>(null)
    const [mentionPlugin] = useState(
        createMentionPlugin({
            mentionTrigger: '@',
            mentionComponent: Mention,
        })
    )
    const [emojiPlugin] = useState(
        createEmojiPlugin({
            theme: {
                ...defaultTheme,
                emojiSelectButton: styles.emojiSelectButton,
                emojiSelectButtonPressed: `${styles.emojiSelectButton} ${styles.selected}`,
                emojiSelectPopover: styles.emojiSelectPopover,
            },
            // useNativeArt: true,
        })
    )
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
    const plugins = [textAlignmentPlugin, mentionPlugin, emojiPlugin]
    const editorRef = useRef<any>(null)

    useEffect(() => {
        // isDraft boolean used as temporary solution until old markdown converted to draft
        const isDraft = stringifiedDraft.slice(0, 10) === `{"blocks":`
        const contentState = isDraft
            ? convertFromRaw(JSON.parse(stringifiedDraft))
            : ContentState.createFromText(stringifiedDraft)
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
                    readOnly
                    ref={(element) => {
                        editorRef.current = element
                    }}
                />
            )}
            {type === 'markdown' && <Markdown text={stringifiedDraft} />}
        </div>
    )
}

DraftText.defaultProps = {
    className: '',
    style: null,
}

export default DraftText
