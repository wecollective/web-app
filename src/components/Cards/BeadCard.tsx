import React, { useContext, useEffect, useRef } from 'react'
import styles from '@styles/components/cards/BeadCard.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import ImageTitle from '@components/ImageTitle'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import { toggleBeadAudio } from '@src/Functions'

const BeadCard = (props: {
    postId: number
    index: number
    bead: any
    style?: any
}): JSX.Element => {
    const { postId, index, bead, style } = props
    const { accountData } = useContext(AccountContext)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        if (audioRef && audioRef.current) audioRef.current.src = bead.beadUrl
    }, [])

    return (
        <Column
            spaceBetween
            id={`gbg-bead-${postId}-${index}`}
            className={`gbg-bead ${styles.bead} ${styles.paused}`}
            style={style}
        >
            <ImageTitle
                type='user'
                imagePath={bead.user.flagImagePath}
                title={bead.user.id === accountData.id ? 'You' : bead.user.name}
                fontSize={12}
                imageSize={20}
                style={{ marginRight: 10 }}
            />
            <img src='/icons/gbg/sound-wave.png' alt='sound-wave' />
            <Row className={styles.controls}>
                <button
                    className={styles.playButton}
                    type='button'
                    aria-label='toggle-audio'
                    onClick={() => toggleBeadAudio(postId, index)}
                />
            </Row>
            <audio ref={audioRef}>
                <track kind='captions' />
            </audio>
        </Column>
    )
}

BeadCard.defaultProps = {
    style: null,
}

export default BeadCard
