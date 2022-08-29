import Markdown from '@components/Markdown'
import { convertFromRaw, EditorState } from 'draft-js'
import React, { useEffect, useState } from 'react'
import { Editor } from 'react-draft-wysiwyg'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

const DraftText = (props: { text: string; className?: string; style?: any }): JSX.Element => {
    const { text, className, style } = props
    const [type, setType] = useState('')
    const [editorState, setEditorState] = useState(EditorState.createEmpty())

    useEffect(() => {
        // type used as temporary solution until old markdown converted to draft
        const textType = text.slice(0, 10) === `{"blocks":` ? 'draft' : 'markdown'
        if (textType === 'draft') {
            const contentState = convertFromRaw(JSON.parse(text))
            setEditorState(EditorState.createWithContent(contentState))
        }
        setType(textType)
    }, [text])

    return (
        <div className={className} style={{ ...style, width: '100%' }}>
            {type === 'draft' && <Editor editorState={editorState} readOnly toolbarHidden />}
            {type === 'markdown' && <Markdown text={text} />}
        </div>
    )
}

DraftText.defaultProps = {
    className: '',
    style: null,
}

export default DraftText
