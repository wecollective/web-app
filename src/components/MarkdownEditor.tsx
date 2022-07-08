import React from 'react'
import { Editor } from 'react-draft-wysiwyg'
import draftToMarkdown from 'draftjs-to-markdown'
import { markdownToDraft } from 'markdown-draft-js'
import { convertToRaw } from 'draft-js'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import styles from '@styles/components/MarkdownEditor.module.scss'
import { ReactComponent as DangerIconSVG } from '@svgs/exclamation-circle-solid.svg'
import { ReactComponent as SuccessIconSVG } from '@svgs/check-circle-solid.svg'

const MarkdownEditor = (props: {
    initialValue: string
    onChange: (value: string) => void
    state?: 'default' | 'valid' | 'invalid'
    errors?: string[]
    className?: string
    style?: any
}): JSX.Element => {
    const { initialValue, onChange, state, errors, className, style } = props

    function parseMarkdown(markdown) {
        return markdown
            .replaceAll('<sup>', '^')
            .replaceAll('</sup>', '^')
            .replaceAll('<sub>', '~')
            .replaceAll('</sub>', '~')
    }

    return (
        <div
            className={`${styles.wrapper} ${className} ${styles[state || 'default']}`}
            style={style}
        >
            <Editor
                placeholder='Enter text...'
                defaultContentState={markdownToDraft(parseMarkdown(initialValue), {
                    remarkableOptions: { html: true },
                    remarkablePreset: 'full',
                    blockStyles: {
                        sup: 'SUPERSCRIPT',
                        sub: 'SUBSCRIPT',
                    },
                })}
                onEditorStateChange={(value) => {
                    onChange(
                        draftToMarkdown(convertToRaw(value.getCurrentContent()), null, null, {
                            emptyLineBeforeBlock: true,
                        })
                    )
                }}
                toolbar={{
                    options: [
                        'inline',
                        'blockType',
                        'fontSize',
                        'fontFamily',
                        'list',
                        // 'textAlign',
                        'colorPicker',
                        'link',
                        // 'embedded',
                        'emoji',
                        'image',
                        'remove',
                        'history',
                    ],
                    inline: {
                        options: [
                            'bold',
                            'italic',
                            // 'underline',
                            // 'strikethrough',
                            'monospace',
                            'superscript',
                            'subscript',
                        ],
                    },
                }}
            />
            {/* <div className={styles.stateIcon}>
                {state === 'invalid' && <DangerIconSVG />}
                {state === 'valid' && <SuccessIconSVG />}
            </div> */}
            {state === 'invalid' && errors && errors.map((error) => <p key={error}>{error}</p>)}
        </div>
    )
}

MarkdownEditor.defaultProps = {
    state: 'default',
    errors: [],
    className: '',
    style: null,
}

export default MarkdownEditor
