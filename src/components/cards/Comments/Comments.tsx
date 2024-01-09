import Column from '@components/Column'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import CommentCard from '@components/cards/Comments/CommentCard'
import CommentInput from '@components/draft-js/CommentInput'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import styles from '@styles/components/cards/Comments/Comments.module.scss'
import { ClockIcon, NewIcon, RankingIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'

// todo: test deleted and muted comments
function Comments(props: {
    post: any
    location: string
    totalComments: number
    incrementTotalComments: (value: number) => void
    style?: any
}): JSX.Element {
    const { post, location, totalComments, incrementTotalComments, style } = props
    const { id, type } = post
    const { loggedIn } = useContext(AccountContext)
    const [comments, setComments] = useState<any[]>([])
    const [remainingComments, setRemainingComments] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('top')

    function getComments(offset) {
        if (!offset) setLoading(true)
        axios
            .get(`${config.apiURL}/post-comments?postId=${id}&offset=${offset}&filter=${filter}`)
            .then((res) => {
                // console.log('post-comments: ', res.data)
                const newComments = offset ? [...comments, ...res.data.comments] : res.data.comments
                setComments(newComments)
                setRemainingComments(res.data.totalChildren - newComments.length)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function findCommentById(children: any[], commentId: number) {
        for (let i = 0; i < children.length; i += 1) {
            if (children[i].id === commentId) return children[i]
            const match = findCommentById(children[i].Comments, commentId)
            if (match) return match
        }
        return null
    }

    function addComment(comment) {
        const { parent } = comment
        if (parent.id === post.id) setComments([comment, ...comments])
        else {
            const newComments = [...comments]
            const parentComment = findCommentById(newComments, parent.id)
            if (parentComment) parentComment.Comments.unshift(comment)
            setComments(newComments)
        }
        incrementTotalComments(1)
    }

    function removeComment(comment) {
        incrementTotalComments(-1)
        const newComments = [...comments]
        const removedComment = findCommentById(newComments, comment.id)
        removedComment.state = 'deleted'
        setComments(newComments)
    }

    useEffect(() => {
        setComments([])
        if (totalComments) getComments(0)
        else setLoading(false)
    }, [filter])

    return (
        <Column style={style}>
            {loggedIn && (
                <CommentInput
                    type='comment'
                    placeholder='Comment...'
                    parent={{ id, type }}
                    onSave={(newComment) => addComment(newComment)}
                    maxChars={5000}
                    style={{ marginBottom: 10 }}
                />
            )}
            {totalComments > 0 && (
                <Row>
                    <button
                        type='button'
                        className={`${styles.filter} ${filter === 'top' && styles.selected}`}
                        onClick={() => setFilter('top')}
                        style={{ marginRight: 10 }}
                    >
                        <RankingIcon />
                        <p>Top</p>
                    </button>
                    <button
                        type='button'
                        className={`${styles.filter} ${filter === 'new' && styles.selected}`}
                        onClick={() => setFilter('new')}
                        style={{ marginRight: 10 }}
                    >
                        <NewIcon />
                        <p>New</p>
                    </button>
                    <button
                        type='button'
                        className={`${styles.filter} ${filter === 'old' && styles.selected}`}
                        onClick={() => setFilter('old')}
                        style={{ marginRight: 10 }}
                    >
                        <ClockIcon />
                        <p>Old</p>
                    </button>
                </Row>
            )}
            {loading ? (
                <Row centerX style={{ margin: '10px 0' }}>
                    <LoadingWheel size={30} />
                </Row>
            ) : (
                <Column>
                    {comments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            depth={0}
                            comment={comment}
                            filter={filter}
                            addComment={addComment}
                            removeComment={removeComment}
                            location={location}
                        />
                    ))}
                    {remainingComments > 0 && (
                        <button
                            className={styles.loadMore}
                            type='button'
                            onClick={() => getComments(comments.length)}
                        >
                            Load more ({remainingComments})
                        </button>
                    )}
                </Column>
            )}
        </Column>
    )
}

Comments.defaultProps = {
    style: null,
}

export default Comments
