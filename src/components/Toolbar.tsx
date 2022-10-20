import { AccountContext } from '@contexts/AccountContext'
import React, { useContext } from 'react'
import Row from '@components/Row'
import styles from '@styles/components/Toolbar.module.scss'
import { ReactComponent as EyeIcon } from '@svgs/eye-solid.svg'
import { ReactComponent as PlusIcon } from '@svgs/plus.svg'
import { ReactComponent as SlidersIcon } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as PostIcon } from '@svgs/edit-solid.svg'
import { ReactComponent as SpaceIcon } from '@svgs/overlapping-circles-thick.svg'
import { ReactComponent as AppsIcon } from '@svgs/apps-grid-icon.svg'
import { ReactComponent as UserIcon } from '@svgs/user-solid.svg'
import CircleButton from '@components/CircleButton'
import GlobalSearchBar from '@components/GlobalSearchBar'
import Tooltip from '@components/Tooltip'
import ImageTitle from './ImageTitle'

const Toolbar = (): JSX.Element => {
    const { accountData } = useContext(AccountContext)

    return (
        <Row centerY centerX className={styles.wrapper}>
            <Row centerY centerX className={styles.container}>
                <CircleButton size={45} icon={<PlusIcon />} style={{ marginRight: 10 }}>
                    <Tooltip top={40} width={150} centered>
                        <p>Create post</p>
                        <p>Create space</p>
                    </Tooltip>
                </CircleButton>
                <CircleButton size={45} icon={<SpaceIcon />} style={{ marginRight: 10 }}>
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
