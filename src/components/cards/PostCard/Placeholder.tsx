import styles from '@styles/components/cards/PostCard/Placeholder.module.scss'
import React from 'react'

function Placeholder(): JSX.Element {
    // todo: re-write
    return (
        <div className={styles.PHPost}>
            <div className='PHPostShine' />
            <div className={styles.PHPostId}>
                <div className={styles.PHPostIdBlock} />
            </div>
            <div className={styles.PHPostBody}>
                <div className={styles.PHPostTags}>
                    <div className={styles.PHPostUserImage} />{' '}
                    <span className={styles.PHPostTagsBlock1} />
                    <span className={styles.PHPostTagsBlock2} />
                </div>
                <div className={styles.PHPostContent}>
                    <div className={styles.PHPostTitle} />
                    <div className={styles.PHPostDescription} />
                    <div className={styles.PHPostInteract}>
                        <div className={styles.PHPostInteractItem}>
                            <div className={styles.PHPostInteractItemCircle} />
                            <div className={styles.PHPostInteractItemBlock} />
                        </div>
                        <div className={styles.PHPostInteractItem}>
                            <div className={styles.PHPostInteractItemCircle} />
                            <div className={styles.PHPostInteractItemBlock} />
                        </div>
                        <div className={styles.PHPostInteractItem}>
                            <div className={styles.PHPostInteractItemCircle} />
                            <div className={styles.PHPostInteractItemBlock} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Placeholder
