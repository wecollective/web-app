import Column from '@components/Column'
import styles from '@styles/components/cards/PostCard/FileCard.module.scss'
import { DownloadIcon } from '@svgs/all'
import React from 'react'

function FileCard(props: { data: any; style?: any }): JSX.Element {
    const { data, style } = props
    const { url, name, mbsize, type } = data.File

    return (
        <Column className={styles.wrapper} centerX centerY style={style}>
            <a href={url} download={name} target='_blank' rel='noreferrer'>
                <DownloadIcon />
                {mbsize && <p>{mbsize} MB</p>}
                {type && <p style={{ fontSize: 12 }}>{type}</p>}
            </a>
            {name && <p>{name}</p>}
        </Column>
    )
}

FileCard.defaultProps = {
    style: null,
}

export default FileCard
