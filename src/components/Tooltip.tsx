import Column from '@components/Column'
import styles from '@styles/components/Tooltip.module.scss'
import React from 'react'

function Tooltip(props: {
    children: any
    top: number
    left?: number
    width?: number
    centered?: boolean
    className?: string
}): JSX.Element {
    const { children, top, left, width, centered, className } = props
    const centeredLeft = width ? `${-width / 2 + 22.5}px` : 0
    return (
        <Column
            className={`${className} ${styles.wrapper}`}
            style={{ bottom: top, left: centered ? centeredLeft : left, width }}
        >
            <Column className={styles.content}>{children}</Column>
            <div className={styles.pointer} />
        </Column>
    )
}

Tooltip.defaultProps = {
    left: 0,
    centered: false,
    width: null,
    className: '',
}

export default Tooltip
