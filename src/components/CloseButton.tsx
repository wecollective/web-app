import { TimesIcon } from '@svgs/all'
import React from 'react'
import PlainButton from './modals/PlainButton'

function CloseButton(props: {
    className?: string
    size: number
    onClick: () => void
    style?: any
}): JSX.Element {
    const { className, size, onClick, style } = props

    return (
        <PlainButton className={className} size={size} onClick={onClick} style={style}>
            <TimesIcon width={size} height={size} />
        </PlainButton>
    )
}

CloseButton.defaultProps = {
    className: '',
    style: null,
}

export default CloseButton
