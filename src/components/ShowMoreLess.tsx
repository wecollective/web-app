import styles from '@styles/components/ShowMoreLess.module.scss'
import { ChevronDownIcon } from '@svgs/all'
import React, { useEffect, useRef, useState } from 'react'

function ShowMoreLess(props: {
    height: number
    gradientColor?: 'white' | 'grey'
    style?: any
    children: any
}): JSX.Element {
    const { height, gradientColor, style, children } = props
    const [overflow, setOverflow] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    function contentHeight() {
        return contentRef.current ? contentRef.current.scrollHeight : 0
    }

    useEffect(() => {
        if (contentHeight() > height) setOverflow(true)
        // listen for content height changes after draft text initialises
        const resizeObserver = new ResizeObserver(() => {
            if (!overflow && contentHeight() > height) {
                setOverflow(true)
                resizeObserver.disconnect()
            }
        })
        resizeObserver.observe(contentRef.current!)
    }, [])

    function showMoreLess() {
        // // if expanded, scroll back to top of content
        // if (expanded && contentRef.current) {
        //     const contentTop = contentRef.current.getBoundingClientRect().top
        //     const yOffset = window.pageYOffset - window.screen.height / 2 + 200
        //     const top = contentTop + yOffset
        //     window.scrollTo({ top, behavior: 'smooth' })
        // }
        setExpanded(!expanded)
    }

    return (
        <div className={styles.wrapper} style={style}>
            <div
                ref={contentRef}
                className={styles.content}
                style={{
                    maxHeight: expanded ? contentHeight() : height,
                    overflow: overflow && !expanded ? 'hidden' : 'visible',
                }}
            >
                {children}
                {overflow && !expanded && (
                    <div className={`${styles.gradient} ${styles[gradientColor || 'white']}`} />
                )}
            </div>
            {overflow && (
                <button
                    className={`${styles.button} ${expanded && styles.expanded}`}
                    type='button'
                    onClick={showMoreLess}
                >
                    <ChevronDownIcon />
                </button>
            )}
        </div>
    )
}

ShowMoreLess.defaultProps = {
    gradientColor: 'white',
    style: null,
}

export default ShowMoreLess
