import React, { useContext, useState } from 'react'
import axios from 'axios'
import config from '@src/Config'
import { useHistory } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageSidebar.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import ImageTitle from '@components/ImageTitle'
import ImageFade from '@components/ImageFade'
import Scrollbars from '@src/components/Scrollbars'
import ImageUploadModal from '@components/modals/ImageUploadModal'
// import SpacePageSideBarLeftPlaceholder from './SpacePageSideBarLeftPlaceholder'
import FlagImageHighlights from '@components/FlagImageHighlights'
import FlagImagePlaceholder from '@components/FlagImagePlaceholder'
import { ReactComponent as ArrowUpIconSVG } from '@svgs/arrow-up-solid.svg' // chevron-up-solid.svg'
import { ReactComponent as ArrowDownIconSVG } from '@svgs/arrow-down-solid.svg' // chevron-down-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'
import { ReactComponent as EyeSlashIconSVG } from '@svgs/eye-slash-solid.svg'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'
import { ReactComponent as MinusIconSVG } from '@svgs/minus-solid.svg'
import { isPlural } from '@src/Functions'

const SpacePageSidebar = (): JSX.Element => {
    const { loggedIn, accountData, updateAccountData } = useContext(AccountContext)
    const {
        spaceData,
        setSpaceData,
        isFollowing,
        setIsFollowing,
        isModerator,
        selectedSpaceSubPage,
    } = useContext(SpaceContext)
    const {
        HolonUsers: users,
        DirectParentHolons: parentSpaces,
        DirectChildHolons: childSpaces,
        totalUsers,
    } = spaceData

    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)
    // const loading = accountDataLoading || spaceDataLoading
    const history = useHistory()
    const imagePaths = (users || []).map((user) => user.flagImagePath)

    function followSpace() {
        // todo: merge into single request
        if (isFollowing) {
            axios
                .post(`${config.apiURL}/unfollow-space`, {
                    holonId: spaceData.id,
                    userId: accountData.id,
                })
                .then((res) => {
                    if (res.data === 'success') {
                        setIsFollowing(false)
                        updateAccountData(
                            'FollowedHolons',
                            accountData.FollowedHolons.filter((h) => h.handle !== spaceData.handle)
                        )
                    }
                })
                .catch((error) => {
                    console.log(error)
                })
        } else {
            axios
                .post(`${config.apiURL}/follow-space`, {
                    holonId: spaceData.id,
                    userId: accountData.id,
                })
                .then((res) => {
                    if (res.data === 'success') {
                        setIsFollowing(true)
                        const newFollowedSpaces = [...accountData.FollowedHolons]
                        newFollowedSpaces.push({
                            handle: spaceData.handle,
                            name: spaceData.name,
                            flagImagePath: spaceData.flagImagePath,
                        })
                        updateAccountData('FollowedHolons', newFollowedSpaces)
                    }
                })
                .catch((error) => {
                    console.log(error)
                })
        }
    }

    function expandSpace(type, spaceId) {
        const key = `Direct${type}Holons`
        const space = spaceData[key].find((s) => s.id === spaceId)
        const newSpaces = [...spaceData[key]]
        const newSpace = newSpaces.find((s) => s.id === spaceId)

        if (space.expanded) {
            newSpace.expanded = false
            setSpaceData({ ...spaceData, [key]: newSpaces })
        } else if (space[key]) {
            newSpace.expanded = true
            setSpaceData({ ...spaceData, [key]: newSpaces })
        } else {
            const filters =
                'timeRange=AllTime&sortBy=Likes&sortOrder=Descending&depth=Only Direct Descendants&offset=0'
            axios
                .get(
                    `${config.apiURL}/space-spaces?accountId=${accountData.id}&spaceId=${spaceId}&${filters}`
                )
                .then((res) => {
                    newSpace[key] = res.data
                    newSpace.expanded = true
                    setSpaceData({ ...spaceData, [key]: newSpaces })
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Column className={styles.wrapper}>
            <div className={styles.flagImage}>
                <ImageFade imagePath={spaceData.flagImagePath} speed={1000}>
                    <FlagImagePlaceholder type='space' />
                </ImageFade>
                {isModerator && (
                    <button
                        type='button'
                        className={styles.uploadButton}
                        onClick={() => setImageUploadModalOpen(true)}
                    >
                        Add a new flag image
                    </button>
                )}
                {imageUploadModalOpen && (
                    <ImageUploadModal
                        type='space-flag'
                        shape='square'
                        id={spaceData.id}
                        title='Add a new flag image'
                        mbLimit={2}
                        onSaved={(imageURL) =>
                            setSpaceData({ ...spaceData, flagImagePath: imageURL })
                        }
                        close={() => setImageUploadModalOpen(false)}
                    />
                )}
            </div>
            <Column className={styles.content}>
                <h1>{spaceData.name}</h1>
                <p className='grey'>{`s/${spaceData.handle}`}</p>
                {/* <p className={styles.description}>{spaceData.description}</p> */}
                <FlagImageHighlights
                    type='user'
                    imagePaths={imagePaths}
                    text={`${totalUsers} ${isPlural(totalUsers) ? 'People' : 'Person'}`}
                    style={{ marginBottom: 20 }}
                    onClick={() => history.push(`/s/${spaceData.handle}/people`)}
                    outline
                />
                {loggedIn && spaceData.handle !== 'all' && (
                    <button className={styles.followButton} type='button' onClick={followSpace}>
                        {isFollowing ? <EyeIconSVG /> : <EyeSlashIconSVG />}
                        <p>{isFollowing ? 'Following' : 'Not Following'}</p>
                    </button>
                )}
                {/* Todo: reorganise space expansion and make recursive */}
                {parentSpaces.length > 0 && (
                    <Column className={styles.spacesWrapper}>
                        <Row>
                            <ArrowUpIconSVG />
                            <p>Parent spaces</p>
                        </Row>
                        <Scrollbars className={styles.spaces}>
                            {parentSpaces.map((space) => (
                                <Column key={space.id}>
                                    <Row centerY style={{ marginBottom: 10 }}>
                                        <ImageTitle
                                            type='space'
                                            imagePath={space.flagImagePath}
                                            title={space.name}
                                            link={`/s/${space.handle}/${selectedSpaceSubPage}`}
                                            fontSize={14}
                                            imageSize={35}
                                            wrapText
                                        />
                                        <button
                                            className={styles.expandSpaceButton}
                                            type='button'
                                            onClick={() => expandSpace('Parent', space.id)}
                                        >
                                            {space.expanded ? <MinusIconSVG /> : <PlusIconSVG />}
                                        </button>
                                    </Row>
                                    {space.expanded && (
                                        <Column
                                            scroll
                                            className={styles.spaces}
                                            style={{ marginLeft: 15 }}
                                        >
                                            {(space.DirectParentHolons || []).map((s) => (
                                                <Column key={s.id}>
                                                    <Row centerY style={{ marginBottom: 10 }}>
                                                        <ImageTitle
                                                            type='space'
                                                            imagePath={s.flagImagePath}
                                                            title={s.name}
                                                            link={`/s/${s.handle}/${selectedSpaceSubPage}`}
                                                            fontSize={14}
                                                            imageSize={30}
                                                            wrapText
                                                        />
                                                        {/* {space.totalChildren > 0 && (
                                                            <button
                                                                className={styles.expandSpaceButton}
                                                                type='button'
                                                                onClick={() =>
                                                                    expandSpace('Parent', s.id)
                                                                }
                                                            >
                                                                {s.expanded ? (
                                                                    <MinusIconSVG />
                                                                ) : (
                                                                    <PlusIconSVG />
                                                                )}
                                                            </button>
                                                        )} */}
                                                    </Row>
                                                </Column>
                                            ))}
                                        </Column>
                                    )}
                                </Column>
                            ))}
                        </Scrollbars>
                    </Column>
                )}
                {childSpaces.length > 0 && (
                    <Column className={styles.spacesWrapper}>
                        <Row>
                            <ArrowDownIconSVG />
                            <p>Child spaces</p>
                        </Row>
                        <Scrollbars className={styles.spaces}>
                            {childSpaces.map((space) => (
                                <Column key={space.id}>
                                    <Row centerY style={{ marginBottom: 10 }}>
                                        <ImageTitle
                                            type='space'
                                            imagePath={space.flagImagePath}
                                            title={space.name}
                                            link={`/s/${space.handle}/${selectedSpaceSubPage}`}
                                            fontSize={14}
                                            imageSize={35}
                                            wrapText
                                        />
                                        {space.totalChildren > 0 && (
                                            <button
                                                className={styles.expandSpaceButton}
                                                type='button'
                                                onClick={() => expandSpace('Child', space.id)}
                                            >
                                                {space.expanded ? (
                                                    <MinusIconSVG />
                                                ) : (
                                                    <PlusIconSVG />
                                                )}
                                            </button>
                                        )}
                                    </Row>
                                    {space.expanded && (
                                        <Column
                                            scroll
                                            className={styles.spaces}
                                            style={{ marginLeft: 15 }}
                                        >
                                            {(space.DirectChildHolons || []).map((s) => (
                                                <Column key={s.id}>
                                                    <Row centerY style={{ marginBottom: 10 }}>
                                                        <ImageTitle
                                                            type='space'
                                                            imagePath={s.flagImagePath}
                                                            title={s.name}
                                                            link={`/s/${s.handle}/${selectedSpaceSubPage}`}
                                                            fontSize={14}
                                                            imageSize={30}
                                                            wrapText
                                                        />
                                                        {/* {space.totalChildren > 0 && (
                                                            <button
                                                                className={styles.expandSpaceButton}
                                                                type='button'
                                                                onClick={() =>
                                                                    expandSpace('Parent', s.id)
                                                                }
                                                            >
                                                                {s.expanded ? (
                                                                    <MinusIconSVG />
                                                                ) : (
                                                                    <PlusIconSVG />
                                                                )}
                                                            </button>
                                                        )} */}
                                                    </Row>
                                                </Column>
                                            ))}
                                        </Column>
                                    )}
                                </Column>
                            ))}
                        </Scrollbars>
                    </Column>
                )}
            </Column>
            {/* <div className={styles.description}>{spaceData.description}</div> */}
        </Column>
    )
    // }
    // return null // add side bar placeholder here? {/* <SpacePageSideBarLeftPlaceholder/> */}
}

export default SpacePageSidebar
