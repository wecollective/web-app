import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import FileCard from '@components/cards/PostCard/FileCard'
import styles from '@styles/components/cards/PostCard/Files.module.scss'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function Files(props: { postId: number; fileBlocks?: any[]; style?: any }): JSX.Element {
    const { postId, fileBlocks, style } = props
    const [loading, setLoading] = useState(false)
    const [blocks, setBlocks] = useState<any[]>(fileBlocks || [])

    console.log('fileBlocks:', fileBlocks)

    if (loading)
        return (
            <Row centerX centerY className={styles.loading} style={style}>
                <LoadingWheel size={30} />
            </Row>
        )

    return (
        <Row wrap centerX style={style} className={styles.wrapper}>
            {blocks.map((block) => (
                <Column centerX key={block.id} style={{ position: 'relative', cursor: 'auto' }}>
                    <Link to={`/p/${block.id}`} className={styles.id} title='Open post page'>
                        <p className='grey'>ID:</p>
                        <p style={{ marginLeft: 5 }}>{block.id}</p>
                    </Link>
                    <FileCard data={block} />
                    {block.text && <p>{block.text}</p>}
                </Column>
            ))}
        </Row>
    )
}

Files.defaultProps = {
    fileBlocks: null,
    style: null,
}

export default Files
