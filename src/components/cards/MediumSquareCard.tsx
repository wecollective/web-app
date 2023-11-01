import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import { getDraftPlainText, trimText } from '@src/Helpers'
import styles from '@styles/components/cards/MediumSquareCard.module.scss'
import { CommentIcon, LikeIcon, PostIcon, UsersIcon } from '@svgs/all'
import React from 'react'

// todo: set up to replace BeadCard
function MediumSquareCard(props: {
    type: 'space' | 'user' | 'post' | 'bead' | 'comment'
    data: any
    style?: any
    className?: string
}): JSX.Element {
    const { type, data, style, className } = props
    const {
        handle,
        name,
        flagImagePath,
        coverImagePath,
        bio,
        description,
        totalPostLikes,
        totalPosts,
        totalComments,
        totalFollowers,
    } = data
    const id = `${type}-${data.id}`
    const itemId = `medium-card-${id}`
    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'
    const text = trimText(getDraftPlainText(bio || description), 80)

    return (
        <Column id={itemId} className={`${styles.wrapper} ${className}`} style={style} draggable>
            <Column centerX className={styles.agent}>
                <div className={styles.coverImage} style={{ backgroundImage }} />
                <FlagImage
                    className={styles.flagImage}
                    size={100}
                    type={type === 'space' ? 'space' : 'user'}
                    imagePath={flagImagePath}
                    outline={4}
                    style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
                />
                <h1>{name}</h1>
                <h2>
                    {type[0]}/{handle}
                </h2>
                <Column centerX style={{ height: 65, margin: '0 15px 5px 15px' }}>
                    <p>{text}</p>
                </Column>
                <Row centerY centerX>
                    <Row className={styles.stat}>
                        <PostIcon />
                        <p>{totalPosts}</p>
                    </Row>
                    <Row className={styles.stat}>
                        <CommentIcon />
                        <p>{totalComments}</p>
                    </Row>
                    {totalPostLikes > 0 && (
                        <Row className={styles.stat}>
                            <LikeIcon />
                            <p>{totalPostLikes}</p>
                        </Row>
                    )}
                    {totalFollowers > 0 && (
                        <Row className={styles.stat}>
                            <UsersIcon />
                            <p>{totalFollowers}</p>
                        </Row>
                    )}
                </Row>
            </Column>
        </Column>
    )
}

MediumSquareCard.defaultProps = {
    style: null,
    className: '',
}

export default MediumSquareCard

// let text = ''
// if (data.title) text = trimText(data.title, 20)
// else if (data.text) text = trimText(getDraftPlainText(data.text), 20)
// let image = ''
// if (!text && ['post', 'bead'].includes(type)) {
//     if (data.type.includes('image')) image = data.Images[0].url
//     if (data.type.includes('url')) image = data.Urls[0].image
// }

// function findTypeIcon(option) {
//     return postTypeIcons[option] || null
// }

/* {['post', 'bead', 'comment'].includes(type) ? (
    <Column className={styles.item}>
        <Row spaceBetween centerY>
            {type === 'comment' ? <CommentIcon /> : <PostIcon />}
            <FlagImage
                type='user'
                imagePath={data.Creator.flagImagePath}
                size={18}
                style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
            />
        </Row>
        <Column centerX centerY className={styles.center}>
            {text && <p>{text}</p>}
            {image && <div style={{ backgroundImage: `url(${image})` }} />}
        </Column>
        <Row spaceBetween>
            {findTypeIcon(data.type)}
            <div />
        </Row>
    </Column>
) : ( */
