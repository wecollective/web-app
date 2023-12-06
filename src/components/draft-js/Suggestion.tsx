import FlagImage from '@components/FlagImage'
import styles from '@styles/components/draft-js/Suggestion.module.scss'
import React from 'react'

function Suggestion(props: {
    mention: any
    onMouseDown: any
    onMouseEnter: any
    onMouseUp: any
}): JSX.Element {
    const { mention, onMouseDown, onMouseEnter, onMouseUp } = props

    return (
        <button
            key={mention.id}
            className={styles.wrapper}
            type='button'
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseUp={onMouseUp}
        >
            <FlagImage type='user' size={30} imagePath={mention.avatar} />
            <p>{mention.name}</p>
            <span>{`(u/${mention.link})`}</span>
        </button>
    )
}

export default Suggestion
