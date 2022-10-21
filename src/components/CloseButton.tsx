import styles from '@styles/components/CloseButton.module.scss'
import { TimesIcon } from '@svgs/all'
import React from 'react'

const CloseButton = (props: { size: number; onClick: () => void; style?: any }): JSX.Element => {
    const { size, onClick, style } = props

    return (
        <button
            className={styles.closeButton}
            type='button'
            onClick={onClick}
            style={{ ...style, width: size, height: size }}
        >
            <TimesIcon width={size} height={size} />
        </button>
    )
}

CloseButton.defaultProps = {
    style: null,
}

export default CloseButton
