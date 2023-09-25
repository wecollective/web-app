import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import StatButton from '@components/StatButton'
import { statTitle } from '@src/Helpers'
import styles from '@styles/components/cards/HorizontalSpaceCard.module.scss'
import { CommentIcon, LikeIcon, PostIcon, UsersIcon } from '@svgs/all'
import React from 'react'
import { Link } from 'react-router-dom'

function HorizontalSpaceCard(props: { space: any; style?: any }): JSX.Element {
    const { space, style } = props
    const {
        handle,
        name,
        description,
        flagImagePath,
        coverImagePath,
        totalFollowers,
        totalPosts,
        totalComments,
        totalPostLikes,
    } = space

    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    return (
        <Row className={styles.wrapper} style={style}>
            <Link to={`/s/${handle}/spaces?lens=List`} className={styles.images}>
                <div className={styles.coverImage} style={{ backgroundImage }} />
                <FlagImage
                    className={styles.flagImage}
                    size={120}
                    type='space'
                    imagePath={flagImagePath}
                    outline
                    shadow
                />
            </Link>
            <Column className={styles.content}>
                <Link to={`/s/${handle}/spaces?lens=List`}>
                    <h1>{name}</h1>
                    <h2>s/{handle}</h2>
                </Link>
                <Row style={{ marginBottom: 10 }}>
                    <ShowMoreLess height={75}>
                        <DraftText stringifiedDraft={description} />
                    </ShowMoreLess>
                </Row>
                <Row className={styles.stats}>
                    <StatButton
                        icon={<UsersIcon />}
                        text={totalFollowers}
                        title={statTitle('Follower', totalFollowers)}
                    />
                    <StatButton
                        icon={<PostIcon />}
                        text={totalPosts}
                        title={statTitle('Post', totalPosts)}
                    />
                    <StatButton
                        icon={<CommentIcon />}
                        text={totalComments}
                        title={statTitle('Comment', totalComments)}
                    />
                    <StatButton
                        icon={<LikeIcon />}
                        text={totalPostLikes}
                        title={statTitle('Like', totalPostLikes)}
                    />
                </Row>
            </Column>
        </Row>
    )
}

HorizontalSpaceCard.defaultProps = {
    style: null,
}

export default HorizontalSpaceCard
