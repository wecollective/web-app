import DraftText from '@components/draft-js/DraftText'
import ShowMoreLess from '@components/ShowMoreLess'
import React from 'react'

function Text(props: { postData: any }): JSX.Element {
    const { postData } = props
    const { text } = postData
    return (
        <ShowMoreLess height={300}>
            <DraftText stringifiedDraft={text} />
        </ShowMoreLess>
    )
}

export default Text
