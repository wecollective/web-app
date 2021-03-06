import PostCardLikePreview from '@components/cards/PostCard/PostCardLikePreview'
import PostCardLinkPreview from '@components/cards/PostCard/PostCardLinkPreview'
import PostCardRatingPreview from '@components/cards/PostCard/PostCardRatingPreview'
import PostCardRepostPreview from '@components/cards/PostCard/PostCardRepostPreview'
import styles from '@styles/components/PostCardReactionItem.module.scss'
import React from 'react'

const PostCardReactionItem = (props: {
    reactions: any
    text: string
    previewOpen: boolean
    setPreviewOpen: (payload: boolean) => void
    accountReaction: number
    totalReactions: number
    totalReactionPoints?: number
    iconPath: string
    onClick: () => void
}): JSX.Element => {
    const {
        reactions,
        text,
        previewOpen,
        setPreviewOpen,
        accountReaction,
        totalReactions,
        totalReactionPoints,
        iconPath,
        onClick,
    } = props

    const previewModalOpen = totalReactions > 0 && previewOpen

    return (
        <div className={styles.itemWrapper}>
            <div
                className={styles.item}
                role='button'
                tabIndex={0}
                onKeyDown={() => setPreviewOpen(!previewModalOpen)}
                onMouseEnter={() => setPreviewOpen(true)}
                onMouseLeave={() => setPreviewOpen(false)}
                onClick={onClick}
            >
                <img
                    className={`
                        ${styles.icon}
                        ${accountReaction > 0 && styles.selected}
                        ${text === 'Reposts' && styles.large}
                    `}
                    src={`/icons/${iconPath}`}
                    alt=''
                />
                <span className='greyText'>
                    {totalReactions} {text}
                </span>
            </div>

            {previewModalOpen && (
                <>
                    {text === 'Likes' && <PostCardLikePreview reactions={reactions} />}
                    {text === 'Reposts' && <PostCardRepostPreview reactions={reactions} />}
                    {text === 'Ratings' && (
                        <PostCardRatingPreview
                            reactions={reactions}
                            totalReactions={totalReactions}
                            totalReactionPoints={totalReactionPoints}
                        />
                    )}
                    {text === 'Links' && <PostCardLinkPreview links={reactions} />}
                </>
            )}
        </div>
    )
}

PostCardReactionItem.defaultProps = {
    totalReactionPoints: null,
}

export default PostCardReactionItem

/* {previewOpen && totalReactions > 0 &&
    <div className={styles.modal}>
        {text === 'Ratings' &&
            <div className={styles.}>
                <div className={styles.totalScoreBar}>
                    <div className={styles.totalScorePercentage} style={{width: totalReactions ? totalRatingScore() : 0}}/>
                    <div className={styles.totalScoreText}>{ totalRatingScore() }</div>
                </div>
            </div>
        }
        {reactions && reactions.map((reaction, index) =>
            <div className={styles.modalItem} key={index}>
                {reaction.creator.flagImagePath
                    ? <img className={styles.image} src={reaction.creator.flagImagePath}/>
                    : <div className={styles.placeholderWrapper}>
                        <img className={styles.placeholder} src='/icons/user-solid.svg' alt=''/>
                    </div>
                }
                <div className={`${styles.modalItemText} mr-10`}>{reaction.creator.name}</div>

                {text === 'Reposts' &&
                    <>
                        <div className={`${styles.modalItemText} mr-10`}>to</div>
                        {reaction.space.flagImagePath
                            ? <img className={styles.image} src={reaction.space.flagImagePath}/>
                            : <div className={styles.placeholderWrapper}>
                                <img className={styles.placeholder} src='/icons/users-solid.svg' alt=''/>
                            </div>
                        }
                        <div className={styles.modalItemText}>{reaction.space.name}</div>
                    </>
                }

                {text === 'Ratings' &&
                    <>
                        <div className={styles.totalScoreBar}>
                            <div className={styles.totalScorePercentage} style={{width: `${reaction.value}%`}}/>
                            <div className={styles.totalScoreText}>{`${reaction.value}%`}</div>
                        </div>
                    </>
                }

            </div>
        )}
    </div>
} */
