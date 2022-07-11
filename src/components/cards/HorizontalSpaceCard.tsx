import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Markdown from '@components/Markdown'
import Row from '@components/Row'
import ShowMoreLess from '@components/ShowMoreLess'
import StatButton from '@components/StatButton'
import { statTitle } from '@src/Helpers'
import styles from '@styles/components/cards/HorizontalSpaceCard.module.scss'
import { ReactComponent as CommentIconSVG } from '@svgs/comment-solid.svg'
import { ReactComponent as PostIconSVG } from '@svgs/edit-solid.svg'
import { ReactComponent as ReactionIconSVG } from '@svgs/fire-alt-solid.svg'
import { ReactComponent as UsersIconSVG } from '@svgs/users-solid.svg'
import React from 'react'
import { Link } from 'react-router-dom'

const HorizontalSpaceCard = (props: { space: any; style?: any }): JSX.Element => {
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
        totalReactions,
    } = space

    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    return (
        <Row className={styles.wrapper} style={style}>
            <Link to={`/s/${handle}/spaces?view=List`} className={styles.images}>
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
                <Link to={`/s/${handle}/spaces?view=List`}>
                    <h1>{name}</h1>
                    <h2>s/{handle}</h2>
                </Link>
                <Row style={{ marginBottom: 10 }}>
                    <ShowMoreLess height={75}>
                        <Markdown text={description} />
                    </ShowMoreLess>
                </Row>
                <Row className={styles.stats}>
                    <StatButton
                        icon={<UsersIconSVG />}
                        text={totalFollowers}
                        title={statTitle('Follower', totalFollowers)}
                    />
                    <StatButton
                        icon={<PostIconSVG />}
                        text={totalPosts}
                        title={statTitle('Post', totalPosts)}
                    />
                    <StatButton
                        icon={<CommentIconSVG />}
                        text={totalComments}
                        title={statTitle('Comment', totalComments)}
                    />
                    <StatButton
                        icon={<ReactionIconSVG />}
                        text={totalReactions}
                        title={statTitle('Reaction', totalReactions)}
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
