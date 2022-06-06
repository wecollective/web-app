import React, { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import { v4 as uuidv4 } from 'uuid'
import styles from '@styles/components/Markdown.module.scss'

const Markdown = (props: { text: string; style?: any; className?: any }): JSX.Element => {
    const { text, style, className } = props
    const id = uuidv4()
    useEffect(() => {
        const markdown = document.getElementById(id)
        if (markdown) {
            const links = markdown.getElementsByTagName('a')
            for (let i = 0; i < links.length; i += 1) {
                links[i].setAttribute('target', '_blank')
                links[i].setAttribute('rel', 'noopener noreferrer')
            }
        }
    }, [])
    return (
        <div className={`${styles.markdown} ${className}`} id={id} style={style}>
            <ReactMarkdown source={text} plugins={[gfm]} escapeHtml={false} />
        </div>
    )
}

Markdown.defaultProps = {
    style: null,
    className: '',
}

export default Markdown
