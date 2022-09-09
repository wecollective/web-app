/* eslint-disable react/jsx-props-no-spreading */
import FlagImage from '@components/FlagImage'
import Row from '@components/Row'
import styles from '@styles/components/draft-js/Suggestion.module.scss'
import React from 'react'

const Suggestion = (props: { mention }): JSX.Element => {
    const { mention, ...parentProps } = props
    return (
        <div {...parentProps}>
            <Row centerY className={styles.wrapper}>
                <FlagImage type='user' size={30} imagePath={mention.avatar} />
                <p>{mention.name}</p>
                <span>{`(u/${mention.link})`}</span>
            </Row>
        </div>
    )
}

export default Suggestion
