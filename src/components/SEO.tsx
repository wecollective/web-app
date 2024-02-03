import React from 'react'
import { Helmet } from 'react-helmet-async'

function SEO(props: {
    title: string
    description: string
    image: string
    creator?: string
}): JSX.Element {
    const { title, description, image, creator } = props
    const imageFallBack =
        'https://weco-prod-public-assets.s3.eu-west-1.amazonaws.com/images/weco-logo.png'
    return (
        <Helmet>
            <title>{title}</title>
            <meta name='description' content={description} />
            <meta property='og:description' content={description} />
            <meta property='og:image' content={image || imageFallBack} />
            <meta name='twitter:card' content='webapp' />
            <meta name='twitter:title' content={title} />
            <meta name='twitter:description' content={description} />
            {creator && <meta name='twitter:creator' content={creator} />}
        </Helmet>
    )
}

SEO.defaultProps = {
    creator: null,
}

export default SEO
