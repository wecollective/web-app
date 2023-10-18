import DraftText from '@components/draft-js/DraftText'
import FlagImage from '@components/FlagImage'
import ShowMoreLess from '@components/ShowMoreLess'
import styles from '@styles/components/VerticalCard.module.scss'
import React from 'react'
import { Link } from 'react-router-dom'

function VerticalCard(props: {
    type: 'user' | 'space'
    route: string
    onClick?: () => void
    coverImagePath: string
    flagImagePath: string
    title: string
    subTitle: string
    text: string
    footer?: any
}): JSX.Element {
    const { type, route, onClick, coverImagePath, flagImagePath, title, subTitle, text, footer } =
        props

    const backgroundImage = coverImagePath
        ? `url(${coverImagePath})`
        : 'linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%'

    return (
        <div className={styles.wrapper}>
            <div className={styles.content}>
                <div className={styles.coverImage} style={{ backgroundImage }} />
                <Link to={route} onClick={onClick}>
                    <div className={styles.flagImageWrapper}>
                        <FlagImage
                            size={130}
                            type={type}
                            imagePath={flagImagePath}
                            outline={8}
                            style={{ boxShadow: `0 0 20px rgba(0, 0, 0, 0.2)` }}
                        />
                    </div>
                </Link>
                <div className={styles.text}>
                    <Link to={route} onClick={onClick}>
                        <p className={styles.title}>{title}</p>
                        <p className={styles.subTitle}>{subTitle}</p>
                    </Link>
                    <ShowMoreLess height={75}>
                        <DraftText stringifiedDraft={text} />
                    </ShowMoreLess>
                </div>
            </div>
            {footer && <div className={styles.footer}>{footer}</div>}
        </div>
    )
}
VerticalCard.defaultProps = {
    onClick: null,
    footer: null,
}

export default VerticalCard
