import Column from '@components/Column'
import Row from '@components/Row'
import styles from '@styles/components/DraftTextEditor.module.scss'
import '@styles/DraftJSStyling.scss'
import { ReactComponent as SuccessIconSVG } from '@svgs/check-circle-solid.svg'
import { ReactComponent as DangerIconSVG } from '@svgs/exclamation-circle-solid.svg'
import { ContentState, convertFromRaw, convertToRaw, EditorState } from 'draft-js'
import React, { useEffect, useState } from 'react'
import { Editor } from 'react-draft-wysiwyg'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

const DraftTextEditor = (props: {
    stringifiedDraft: string
    onChange: (value: string) => void
    maxChars?: number
    state?: 'default' | 'valid' | 'invalid'
    errors?: string[]
    className?: string
    style?: any
}): JSX.Element => {
    const { stringifiedDraft, onChange, maxChars, state, errors, className, style } = props

    const toolbarSettings = {
        options: [
            'inline',
            'blockType',
            'fontSize',
            'fontFamily',
            'list',
            'textAlign',
            'colorPicker',
            'link',
            // 'embedded',
            'emoji',
            'image',
            'remove',
            'history',
        ],
        inline: {
            inDropdown: true,
            options: [
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'monospace',
                'superscript',
                'subscript',
            ],
        },
        list: {
            inDropdown: true,
        },
        textAlign: {
            inDropdown: true,
            options: ['left', 'center', 'right'],
        },
        // link: {
        //     showOpenOptionOnHover: false,
        // },
    }

    const [editorState, setEditorState] = useState(EditorState.createEmpty())
    const [characterLength, setCharacterLength] = useState(0)

    function onEditorStateChange(newEditorState) {
        setEditorState(newEditorState)
        const contentState = newEditorState.getCurrentContent()
        setCharacterLength(contentState.getPlainText().length)
        const rawDraft = convertToRaw(contentState)
        onChange(JSON.stringify(rawDraft))
    }

    useEffect(() => {
        // isDraft boolean used as temporary solution until old markdown converted to draft
        const isDraft = stringifiedDraft.slice(0, 10) === `{"blocks":`
        const contentState = isDraft
            ? convertFromRaw(JSON.parse(stringifiedDraft))
            : ContentState.createFromText(stringifiedDraft)
        const newEditorState = EditorState.createWithContent(contentState)
        setEditorState(newEditorState)
        setCharacterLength(newEditorState.getCurrentContent().getPlainText().length)
    }, [])

    return (
        <Column
            className={`${styles.wrapper} ${className} ${styles[state || 'default']}`}
            style={style}
        >
            <Editor
                placeholder='Enter text...'
                editorState={editorState}
                onEditorStateChange={onEditorStateChange}
                toolbar={toolbarSettings}
            />
            <Row
                centerY
                spaceBetween
                className={`${styles.stats} ${state === 'invalid' && styles.error}`}
            >
                <Row className={styles.errors}>
                    {state === 'invalid' && <DangerIconSVG />}
                    {state === 'valid' && <SuccessIconSVG />}
                    {state === 'invalid' && errors!.map((error) => <p key={error}>{error}</p>)}
                </Row>
                <p>
                    {characterLength}
                    {maxChars ? `/${maxChars}` : ''} Chars
                </p>
            </Row>
        </Column>
    )
}

DraftTextEditor.defaultProps = {
    maxChars: null,
    state: 'default',
    errors: [],
    className: '',
    style: null,
}

export default DraftTextEditor
