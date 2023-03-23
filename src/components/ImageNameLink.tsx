import FlagImage from '@components/FlagImage'
import styles from '@styles/components/ImageNameLink.module.scss'
import React from 'react'
import { Link } from 'react-router-dom'

function ImageNameLink(props: {
    type: 'space' | 'user'
    data: {
        name: string
        handle: string
        flagImagePath: string
    }
    onClick?: () => void
}): JSX.Element {
    const { type, data, onClick } = props
    const route = `/${type[0]}/${data.handle}`
    return (
        <Link
            className={styles.container}
            to={route}
            onClick={onClick}
            style={{ pointerEvents: data.handle ? 'auto' : 'none' }}
        >
            <FlagImage type={type} size={30} imagePath={data.flagImagePath} />
            {data.handle ? <p>{data.name}</p> : <p className='grey'>[Account deleted]</p>}
        </Link>
    )
}

ImageNameLink.defaultProps = {
    onClick: null,
}

export default ImageNameLink
