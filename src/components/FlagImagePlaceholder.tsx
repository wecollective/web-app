import Row from '@components/Row'
import styles from '@styles/components/FlagImagePlaceholder.module.scss'
import { PostIcon, UserIcon, UsersIcon } from '@svgs/all'
import React from 'react'

function FlagImagePlaceholder(props: { type: 'space' | 'user' | 'post' }): JSX.Element {
    const { type } = props

    let iconSVG
    let iconWidth
    switch (type) {
        case 'space':
            iconSVG = <UsersIcon />
            iconWidth = '60%'
            break
        case 'user':
            iconSVG = <UserIcon />
            iconWidth = '45%'
            break
        case 'post':
            iconSVG = <PostIcon />
            iconWidth = '50%'
            break
        default:
            iconSVG = null
            iconWidth = null
    }

    return (
        <Row centerX centerY className={styles.wrapper}>
            <Row centerX centerY style={{ width: iconWidth }}>
                {iconSVG}
            </Row>
        </Row>
    )
}

export default FlagImagePlaceholder
