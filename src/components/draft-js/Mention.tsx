import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import styles from '@styles/components/draft-js/Mention.module.scss'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const MentionComponent = (props: { mention; children }): JSX.Element => {
    const { mention, children } = props
    const [modalOpen, setModalOpen] = useState(false)
    return (
        <span className={styles.mentionComponent}>
            <Link
                to={`/u/${mention.link}`}
                className={styles.text}
                onMouseEnter={() => setModalOpen(true)}
                onMouseLeave={() => setModalOpen(false)}
            >
                @{children}
            </Link>
            {modalOpen && (
                <Row className={styles.modal}>
                    <ImageTitle
                        type='user'
                        imagePath={mention.avatar}
                        title={`u/${mention.link}`}
                        shadow
                    />
                </Row>
            )}
        </span>
    )
}

export default MentionComponent
