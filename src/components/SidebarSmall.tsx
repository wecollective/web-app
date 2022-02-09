import React, { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from '@styles/components/SidebarSmall.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import FlagImage from '@components/FlagImage'
import Column from '@components/Column'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'

const SidebarSmall = (): JSX.Element => {
    const { accountData, loggedIn } = useContext(AccountContext)
    const { selectedSpaceSubPage } = useContext(SpaceContext)
    const { FollowedHolons: followedSpaces } = accountData

    useEffect(() => {
        // todo: get root space data
    }, [])

    return (
        <div className={`${styles.wrapper} hide-scrollbars`}>
            <Link to={`/s/all/${selectedSpaceSubPage || 'posts'}`}>
                <FlagImage
                    type='space'
                    size={50}
                    imagePath='https://weco-prod-space-flag-images.s3.eu-west-1.amazonaws.com/1614556880362'
                />
            </Link>
            <div className={styles.divider} />
            <Column className={`${styles.section} hide-scrollbars`}>
                {followedSpaces.map((space) => (
                    <Link
                        key={space.id}
                        to={`/s/${space.handle}/${selectedSpaceSubPage || 'posts'}`}
                    >
                        <FlagImage type='space' size={50} imagePath={space.flagImagePath} />
                    </Link>
                ))}
                <button className={styles.followSpaceButton} type='button'>
                    <PlusIconSVG />
                </button>
            </Column>
        </div>
    )
}

export default SidebarSmall
