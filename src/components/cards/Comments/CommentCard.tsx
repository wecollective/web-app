import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import EditCommentModal from '@components/cards/Comments/EditCommentModal'
import DraftText from '@components/draft-js/DraftText'
import DeleteCommentModal from '@components/modals/DeleteCommentModal'
import { AccountContext } from '@contexts/AccountContext'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import LikeModal from '@src/components/modals/LikeModal'
import LinkModal from '@src/components/modals/LinkModal'
import RatingModal from '@src/components/modals/RatingModal'
import styles from '@styles/components/cards/Comments/CommentCard.module.scss'
import {
    DeleteIcon,
    EditIcon,
    LikeIcon,
    LinkIcon,
    ReplyIcon,
    StarIcon,
    VerticalEllipsisIcon,
} from '@svgs/all'
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'

function CommentCard(props: {
    comment: any
    highlighted: boolean
    location: string
    toggleReplyInput: () => void
    removeComment: (comment: any) => void
    editComment: (comment: any, newText: string) => void
    updateCommentReactions: (
        commentId: number,
        reactionType: string,
        increment: boolean,
        rating?: number
    ) => void
}): JSX.Element {
    const {
        comment,
        highlighted,
        location,
        toggleReplyInput,
        removeComment,
        editComment,
        updateCommentReactions,
    } = props
    const {
        id,
        itemId,
        text,
        state,
        totalLikes,
        totalReposts,
        totalRatings,
        totalLinks,
        totalGlassBeadGames,
        accountLike,
        accountRating,
        accountLinks,
        createdAt,
        updatedAt,
        Creator,
    } = comment

    const { loggedIn, accountData } = useContext(AccountContext)
    const [menuOpen, setMenuOpen] = useState(false)
    const [editCommentModalOpen, setEditCommentModalOpen] = useState(false)
    const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false)
    const [likeModalOpen, setLikeModalOpen] = useState(false)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const isOwnComment = Creator.id === accountData.id

    return (
        <Column
            id={`comment-${comment.id}`}
            className={`${styles.wrapper} ${highlighted && styles.highlighted}`}
        >
            <Row>
                <Link
                    to={`/u/${Creator.handle}`}
                    style={{ pointerEvents: Creator.handle ? 'auto' : 'none' }}
                >
                    <FlagImage type='user' size={30} imagePath={Creator.flagImagePath} />
                </Link>
                <Column className={styles.content}>
                    <Row spaceBetween className={styles.header}>
                        <Row>
                            {state === 'account-deleted' ? (
                                <p className='grey' style={{ marginRight: 5 }}>
                                    [Account deleted]
                                </p>
                            ) : (
                                <Link to={`/u/${Creator.handle}`} style={{ marginRight: 5 }}>
                                    <p style={{ fontWeight: 600 }}>{Creator.name}</p>
                                </Link>
                            )}
                            <p className='grey' title={dateCreated(createdAt)}>
                                {`• ${timeSinceCreated(createdAt)}`}
                            </p>
                            {createdAt !== updatedAt && (
                                <p
                                    className='grey'
                                    title={`Edited at ${dateCreated(updatedAt)}`}
                                    style={{ paddingLeft: 5 }}
                                >
                                    *
                                </p>
                            )}
                        </Row>
                        <Row>
                            <Link
                                to={`/p/${itemId}?commentId=${id}`}
                                className={styles.id}
                                title='Open post page'
                            >
                                <p className='grey'>ID:</p>
                                <p style={{ marginLeft: 5 }}>{id}</p>
                            </Link>
                            {isOwnComment && (
                                <button
                                    type='button'
                                    className={styles.menuButton}
                                    onClick={() => setMenuOpen(!menuOpen)}
                                >
                                    <VerticalEllipsisIcon />
                                </button>
                            )}
                            {menuOpen && (
                                <CloseOnClickOutside onClick={() => setMenuOpen(false)}>
                                    <Column className={styles.menu}>
                                        <Column>
                                            <button
                                                type='button'
                                                onClick={() => setEditCommentModalOpen(true)}
                                            >
                                                <EditIcon />
                                                Edit comment
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setDeleteCommentModalOpen(true)}
                                            >
                                                <DeleteIcon />
                                                Delete comment
                                            </button>
                                        </Column>
                                    </Column>
                                </CloseOnClickOutside>
                            )}
                        </Row>
                    </Row>
                    {state !== 'account-deleted' && (
                        <ShowMoreLess height={250} gradientColor='grey'>
                            <DraftText
                                stringifiedDraft={state === 'deleted' ? '[comment deleted]' : text}
                                markdownStyles={`${styles.markdown} ${
                                    state === 'deleted' && styles.deleted
                                }`}
                            />
                        </ShowMoreLess>
                    )}
                </Column>
            </Row>
            {state === 'visible' && (
                <Row className={styles.buttons}>
                    <button
                        type='button'
                        className={styles.reply}
                        onClick={() => toggleReplyInput()}
                    >
                        <ReplyIcon />
                    </button>
                    <button
                        type='button'
                        className={accountLike ? styles.blue : ''}
                        onClick={() => setLikeModalOpen(true)}
                    >
                        <LikeIcon />
                        <p>{totalLikes}</p>
                    </button>
                    <button
                        type='button'
                        className={accountRating ? styles.blue : ''}
                        onClick={() => setRatingModalOpen(true)}
                    >
                        <StarIcon />
                        <p>{totalRatings}</p>
                    </button>
                    <button
                        type='button'
                        className={accountLinks > 0 ? styles.blue : ''}
                        onClick={() => setLinkModalOpen(true)}
                    >
                        <LinkIcon />
                        <p>{totalLinks}</p>
                    </button>
                </Row>
            )}
            {likeModalOpen && (
                <LikeModal
                    itemType='comment'
                    itemData={comment}
                    updateItem={() => updateCommentReactions(comment, 'Like', !accountLike)}
                    close={() => setLikeModalOpen(false)}
                />
            )}
            {ratingModalOpen && (
                <RatingModal
                    itemType='comment'
                    itemData={comment}
                    updateItem={(rating) =>
                        updateCommentReactions(comment, 'Rating', !accountRating, rating)
                    }
                    close={() => setRatingModalOpen(false)}
                />
            )}
            {linkModalOpen && (
                <LinkModal
                    itemType='comment'
                    itemData={comment}
                    parentItemId={comment.itemId}
                    location={location}
                    close={() => setLinkModalOpen(false)}
                />
            )}
            {editCommentModalOpen && (
                <EditCommentModal
                    comment={comment}
                    editComment={editComment}
                    close={() => setEditCommentModalOpen(false)}
                />
            )}
            {deleteCommentModalOpen && (
                <DeleteCommentModal
                    comment={comment}
                    removeComment={removeComment}
                    close={() => setDeleteCommentModalOpen(false)}
                />
            )}
        </Column>
    )
}

export default CommentCard
