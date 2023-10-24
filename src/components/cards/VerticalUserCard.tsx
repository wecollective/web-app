import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import StatButton from '@components/StatButton'
import { statTitle } from '@src/Helpers'
import styles from '@styles/components/cards/VerticalUserCard.module.scss'
import { CommentIcon, PostIcon } from '@svgs/all'
import React from 'react'
import { Link } from 'react-router-dom'

function VerticalUserCard(props: { user: any; style?: any }): JSX.Element {
    const { user, style } = props
    const { handle, name, bio, flagImagePath, coverImagePath, totalPosts, totalComments } = user

    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    return (
        <Column spaceBetween className={styles.wrapper} style={style}>
            <Column centerX className={styles.content}>
                <div className={styles.coverImage} style={{ backgroundImage }} />
                <Link to={`/u/${handle}/posts`}>
                    <FlagImage
                        className={styles.flagImage}
                        size={110}
                        type='user'
                        imagePath={flagImagePath}
                        outline={4}
                        style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
                    />
                </Link>
                <Column className={styles.textContent}>
                    <Link to={`/u/${handle}/posts`}>
                        <h1>{name}</h1>
                        <h2>{`u/${handle}`}</h2>
                    </Link>
                    <ShowMoreLess height={75}>
                        <DraftText stringifiedDraft={bio} />
                    </ShowMoreLess>
                </Column>
            </Column>
            <Row centerY centerX className={styles.footer}>
                <StatButton
                    icon={<PostIcon />}
                    text={totalPosts}
                    // text={`${totalPosts} Post${pluralise(totalPosts)}`}
                    title={statTitle('Post', totalPosts)}
                />
                <StatButton
                    icon={<CommentIcon />}
                    text={totalComments}
                    // text={`${totalComments} Comment${pluralise(totalComments)}`}
                    title={statTitle('Comment', totalComments)}
                />
            </Row>
        </Column>
    )
}

VerticalUserCard.defaultProps = {
    style: null,
}

export default VerticalUserCard
