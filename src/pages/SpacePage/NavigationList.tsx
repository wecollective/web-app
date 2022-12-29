import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/NavigationList.module.scss'
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, PlusIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext } from 'react'
import Cookies from 'universal-cookie'

const NavigationList = (props: { onLocationChange?: () => void; style?: any }): JSX.Element => {
    const { onLocationChange, style } = props
    const { spaceData, setSpaceData, selectedSpaceSubPage } = useContext(SpaceContext)
    const { DirectParentSpaces: parentSpaces, DirectChildSpaces: childSpaces } = spaceData
    const cookies = new Cookies()

    function expandSpace(type, spaceId) {
        // todo: use local space arrays instead of mutating spaceData in context
        const key = `Direct${type}Spaces`
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
            newSpace.loading = true
            setSpaceData({ ...spaceData, [key]: newSpaces })
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            const filters =
                'timeRange=AllTime&sortBy=Likes&sortOrder=Descending&depth=Only Direct Descendants&offset=0'
            axios
                .get(`${config.apiURL}/space-spaces?spaceId=${spaceId}&${filters}`, options)
                .then((res) => {
                    newSpace[key] = res.data
                    newSpace.expanded = true
                    newSpace.loading = false
                    setSpaceData({ ...spaceData, [key]: newSpaces })
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Scrollbars className={styles.wrapper} style={style}>
            {parentSpaces.length > 0 && (
                <Column className={styles.spaces}>
                    <Row>
                        <ArrowUpIcon />
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
                                        onClick={() => onLocationChange && onLocationChange()}
                                        wrapText
                                    />
                                    <button
                                        className={styles.expandSpaceButton}
                                        type='button'
                                        onClick={() => expandSpace('Parent', space.id)}
                                    >
                                        {space.loading ? (
                                            <LoadingWheel size={20} style={{ marginLeft: 7 }} />
                                        ) : (
                                            <>{space.expanded ? <MinusIcon /> : <PlusIcon />}</>
                                        )}
                                    </button>
                                </Row>
                                {space.expanded && (
                                    <Column scroll className={styles.childSpaces}>
                                        {(space.DirectParentSpaces || []).map((s) => (
                                            <Column key={s.id}>
                                                <Row centerY style={{ marginBottom: 10 }}>
                                                    <ImageTitle
                                                        type='space'
                                                        imagePath={s.flagImagePath}
                                                        title={s.name}
                                                        link={`/s/${s.handle}/${selectedSpaceSubPage}`}
                                                        fontSize={14}
                                                        imageSize={30}
                                                        onClick={() =>
                                                            onLocationChange && onLocationChange()
                                                        }
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
                        <ArrowDownIcon />
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
                                        onClick={() => onLocationChange && onLocationChange()}
                                        wrapText
                                    />
                                    {space.totalChildren > 0 && (
                                        <button
                                            className={styles.expandSpaceButton}
                                            type='button'
                                            onClick={() => expandSpace('Child', space.id)}
                                        >
                                            {space.loading ? (
                                                <LoadingWheel size={20} style={{ marginLeft: 7 }} />
                                            ) : (
                                                <>{space.expanded ? <MinusIcon /> : <PlusIcon />}</>
                                            )}
                                        </button>
                                    )}
                                </Row>
                                {space.expanded && (
                                    <Column scroll className={styles.childSpaces}>
                                        {(space.DirectChildSpaces || []).map((s) => (
                                            <Column key={s.id}>
                                                <Row centerY style={{ marginBottom: 10 }}>
                                                    <ImageTitle
                                                        type='space'
                                                        imagePath={s.flagImagePath}
                                                        title={s.name}
                                                        link={`/s/${s.handle}/${selectedSpaceSubPage}`}
                                                        fontSize={14}
                                                        imageSize={30}
                                                        onClick={() =>
                                                            onLocationChange && onLocationChange()
                                                        }
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

NavigationList.defaultProps = {
    onLocationChange: null,
    style: null,
}

export default NavigationList
