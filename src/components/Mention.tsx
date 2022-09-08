import Row from '@components/Row'
import styles from '@styles/components/Mention.module.scss'
import React, { useState } from 'react'

const MentionComponent = (props: { mention; children }): JSX.Element => {
    const { mention, children } = props
    const [modalOpen, setModalOpen] = useState(false)
    const openPage = () => window.open(`/u/${mention.link}`, '_blank')
    return (
        <span className={styles.mentionComponent}>
            <span
                className={styles.text}
                role='button'
                tabIndex={0}
                onKeyDown={openPage}
                onClick={openPage}
                onMouseEnter={() => setModalOpen(true)}
                onMouseLeave={() => setModalOpen(false)}
            >
                @{children}
            </span>
            {modalOpen && (
                <Row className={styles.modal} centerY>
                    <img src={mention.avatar} alt='' />
                    <p>u/{mention.link}</p>
                </Row>
            )}
        </span>
    )
}

export default MentionComponent
