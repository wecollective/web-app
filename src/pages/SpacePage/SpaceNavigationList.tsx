import React, { useContext } from 'react'
import axios from 'axios'
import config from '@src/Config'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpaceNavigationList.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import ImageTitle from '@components/ImageTitle'
import Scrollbars from '@src/components/Scrollbars'
import { ReactComponent as ArrowUpIconSVG } from '@svgs/arrow-up-solid.svg' // chevron-up-solid.svg'
import { ReactComponent as ArrowDownIconSVG } from '@svgs/arrow-down-solid.svg' // chevron-down-solid.svg'
import { ReactComponent as PlusIconSVG } from '@svgs/plus.svg'
import { ReactComponent as MinusIconSVG } from '@svgs/minus-solid.svg'

const SpaceNavigationList = (): JSX.Element => {
    const { accountData } = useContext(AccountContext)
    const { spaceData, setSpaceData, selectedSpaceSubPage } = useContext(SpaceContext)
    const { DirectParentHolons: parentSpaces, DirectChildHolons: childSpaces } = spaceData

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
        <Scrollbars className={styles.wrapper}>
            {parentSpaces.length > 0 && (
                <Column className={styles.spaces}>
                    <Row>
                        <ArrowUpIconSVG />
                        <p>Parent spaces</p>
                    </Row>
                    <Column>
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
                                    <Column scroll className={styles.childSpaces}>
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
                                                </Row>
                                            </Column>
                                        ))}
                                    </Column>
                                )}
                            </Column>
                        ))}
                    </Column>
                </Column>
            )}
            {childSpaces.length > 0 && (
                <Column className={styles.spaces}>
                    <Row>
                        <ArrowDownIconSVG />
                        <p>Child spaces</p>
                    </Row>
                    <Column>
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
                                            {space.expanded ? <MinusIconSVG /> : <PlusIconSVG />}
                                        </button>
                                    )}
                                </Row>
                                {space.expanded && (
                                    <Column scroll className={styles.childSpaces}>
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
                                                </Row>
                                            </Column>
                                        ))}
                                    </Column>
                                )}
                            </Column>
                        ))}
                    </Column>
                </Column>
            )}
        </Scrollbars>
    )
}

export default SpaceNavigationList
