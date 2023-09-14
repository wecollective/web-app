/* eslint-disable jsx-a11y/control-has-associated-label */
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import {
    dateCreated,
    getDraftPlainText,
    timeSinceCreated,
    timeSinceCreatedShort,
    trimText,
} from '@src/Helpers'
import styles from '@styles/components/cards/Comments/CommentCardPreview.module.scss'
import React from 'react'
import { Link } from 'react-router-dom'

function CommentCardPreview(props: {
    comment: any
    link: string
    onClick?: () => void
    style?: any
}): JSX.Element {
    const { comment, link, onClick, style } = props
    const { id, text, createdAt, updatedAt, Creator } = comment
    const mobileView = document.documentElement.clientWidth < 900

    return (
        <Link to={link} onClick={onClick} className={styles.wrapper} style={style}>
            <FlagImage type='user' size={28} imagePath={Creator.flagImagePath} />
            <Column className={styles.content}>
                <Row spaceBetween className={styles.header}>
                    <Row>
                        <p style={{ fontWeight: 800, marginRight: 5 }}>{Creator.name}</p>
                        <Row className={styles.time}>
                            <p className='grey' title={`Posted at ${dateCreated(createdAt)}`}>
                                •{' '}
                                {mobileView
                                    ? timeSinceCreatedShort(createdAt)
                                    : timeSinceCreated(createdAt)}
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
                    </Row>
                    <Row>
                        <p className='grey'>ID:</p>
                        <p style={{ marginLeft: 5 }}>{id}</p>
                    </Row>
                </Row>
                {text && <p className={styles.text}>{trimText(getDraftPlainText(text), 80)}</p>}
            </Column>
        </Link>
    )
}

CommentCardPreview.defaultProps = {
    style: null,
    onClick: null,
}

export default CommentCardPreview
