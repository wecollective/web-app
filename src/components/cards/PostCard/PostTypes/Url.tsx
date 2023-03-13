import UrlPreview from '@components/cards/PostCard/UrlPreview'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import ShowMoreLess from '@components/ShowMoreLess'
import React from 'react'

const Url = (props: { postData: any }): JSX.Element => {
    const { postData } = props
    const { text, url, urlDescription, urlDomain, urlImage, urlTitle } = postData
    const urlData = {
        url,
        image: urlImage,
        title: urlTitle,
        description: urlDescription,
        domain: urlDomain,
    }
    return (
        <Column>
            {text && (
                <Column style={{ marginBottom: 10 }}>
                    <ShowMoreLess height={300}>
                        <DraftText stringifiedDraft={text} />
                    </ShowMoreLess>
                </Column>
            )}
            <UrlPreview urlData={urlData} />
        </Column>
    )
}

export default Url
