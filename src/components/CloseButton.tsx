import { TimesIcon } from '@svgs/all'
import React from 'react'
import PlainButton from './modals/PlainButton'

function CloseButton(props: { size: number; onClick: () => void; style?: any }): JSX.Element {
    const { size, onClick, style } = props

    return (
        <PlainButton size={size} onClick={onClick} style={style}>
            <TimesIcon width={size} height={size} />
        </PlainButton>
    )
}

CloseButton.defaultProps = {
    style: null,
}

export default CloseButton
