import CircleButton from '@components/CircleButton'
import GlobalSearchBar from '@components/GlobalSearchBar'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import Tooltip from '@components/Tooltip'
import { AccountContext } from '@contexts/AccountContext'
import styles from '@styles/components/Toolbar.module.scss'
import { AppsIcon, EyeIcon, PlusIcon, PostIcon, SlidersIcon, SpacesIcon, UserIcon } from '@svgs/all'
import React, { useContext } from 'react'

const Toolbar = (): JSX.Element => {
    const { accountData } = useContext(AccountContext)

    // todo: grab followed spaces when needed

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Row centerY centerX className={styles.container}>
                <CircleButton size={45} icon={<PlusIcon />} style={{ marginRight: 10 }}>
                    <Tooltip top={40} width={150} centered>
                        <p>Create post</p>
                        <p>Create space</p>
                    </Tooltip>
                </CircleButton>
                <CircleButton size={45} icon={<SpacesIcon />} style={{ marginRight: 10 }}>
                    <Tooltip top={40} width={180} centered>
                        {accountData.FollowedSpaces.slice(0, 5).map((space, index) => (
                            <ImageTitle
                                type='space'
                                imagePath={space.flagImagePath}
                                imageSize={35}
                                title={space.name}
                                fontSize={14}
                                style={{
                                    marginBottom: index < 4 ? 5 : 0,
                                }}
                            />
                        ))}
                    </Tooltip>
                </CircleButton>
                <CircleButton size={45} icon={<UserIcon />} style={{ marginRight: 10 }} />
                <div className={styles.divider} />
                <GlobalSearchBar style={{ width: 400, marginRight: 10 }} />
                <CircleButton size={45} icon={<SlidersIcon />} style={{ marginRight: 10 }} />
                <CircleButton size={45} icon={<EyeIcon />} style={{ marginRight: 10 }} />
                <div className={styles.divider} />
                <CircleButton size={45} icon={<AppsIcon />} style={{ marginRight: 10 }} />
                <CircleButton size={45} icon={<PostIcon />} />
            </Row>
        </Row>
    )
}

export default Toolbar
