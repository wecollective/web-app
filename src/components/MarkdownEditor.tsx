import React from 'react'
import { Editor } from 'react-draft-wysiwyg'
import draftToMarkdown from 'draftjs-to-markdown'
import { markdownToDraft } from 'markdown-draft-js'
import { convertToRaw } from 'draft-js'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import styles from '@styles/components/MarkdownEditor.module.scss'

const MarkdownEditor = (props: {
    initialValue: string
    onChange: (value: string) => void
    className?: string
    style?: any
}): JSX.Element => {
    const { initialValue, onChange, className, style } = props

    function parseMarkdown(markdown) {
        return markdown
            .replaceAll('<sup>', '^')
            .replaceAll('</sup>', '^')
            .replaceAll('<sub>', '~')
            .replaceAll('</sub>', '~')
    }

    return (
        <div className={`${styles.wrapper} ${className}`} style={style}>
            <Editor
                defaultContentState={markdownToDraft(parseMarkdown(initialValue), {
                    remarkableOptions: { html: true },
                    remarkablePreset: 'full',
                    blockStyles: {
                        sup: 'SUPERSCRIPT',
                        sub: 'SUBSCRIPT',
                    },
                })}
                onEditorStateChange={(value) => {
                    onChange(draftToMarkdown(convertToRaw(value.getCurrentContent())))
                }}
            />
        </div>
    )
}

MarkdownEditor.defaultProps = {
    className: '',
    style: null,
}

export default MarkdownEditor
