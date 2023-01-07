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
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

const Space = (props: {
    space: any
    type: 'parent' | 'child'
    selectedSubPage: string
    expand: (space: any, type: 'parent' | 'child') => void
    onLocationChange: (() => void) | undefined
}): JSX.Element => {
    // recursive component used to render space trees in the NavigationList component below
    const { space, type, selectedSubPage, expand, onLocationChange } = props
    const { handle, name, flagImagePath, children, totalChildren, expanded, loading } = space
    return (
        <Column>
            <Row centerY style={{ marginBottom: 10 }}>
                <ImageTitle
                    type='space'
                    imagePath={flagImagePath}
                    title={name}
                    link={`/s/${handle}/${selectedSubPage}`}
                    fontSize={14}
                    imageSize={35}
                    onClick={() => onLocationChange && onLocationChange()}
                    wrapText
                />
                {totalChildren > 0 && (
                    <button
                        className={styles.expandButton}
                        type='button'
                        onClick={() => expand(space, type)}
                    >
                        {loading ? (
                            <LoadingWheel size={20} style={{ marginLeft: 7 }} />
                        ) : (
                            <>{expanded ? <MinusIcon /> : <PlusIcon />}</>
                        )}
                    </button>
                )}
            </Row>
            {expanded && (
                <Column scroll className={styles.childSpaces}>
                    {children &&
                        children.map((child) => (
                            <Space
                                key={child.id}
                                space={child}
                                type={type}
                                selectedSubPage={selectedSubPage}
                                expand={expand}
                                onLocationChange={onLocationChange}
                            />
                        ))}
                </Column>
            )}
        </Column>
    )
}

const NavigationList = (props: { onLocationChange?: () => void; style?: any }): JSX.Element => {
    const { onLocationChange, style } = props
    const { spaceData, selectedSpaceSubPage } = useContext(SpaceContext)
    const [parentSpaces, setParentSpaces] = useState<any[]>([])
    const [childSpaces, setChildSpaces] = useState<any[]>([])
    const [renderKey, setRenderKey] = useState(0)
    const [loading, setLoading] = useState(true)
    const cookies = new Cookies()
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    async function getSpaces() {
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        const getParentSpaces = await axios.get(
            `${config.apiURL}/nav-list-parent-spaces?spaceId=${spaceData.id}`,
            options
        )
        const getChildSpaces = await axios.get(
            `${config.apiURL}/nav-list-child-spaces?spaceId=${spaceData.id}`,
            options
        )
        Promise.all([getParentSpaces, getChildSpaces])
            .then((responses) => {
                setParentSpaces(responses[0].data)
                setChildSpaces(responses[1].data)
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function findSpace(spaces: any[], id: number) {
        // recursively traverses the space tree to find a matching space
        const match = spaces.find((s) => s.id === id)
        if (match) return match
        for (let i = 0; i < spaces.length; i += 1) {
            if (spaces[i].children) {
                const childMatch = findSpace(spaces[i].children, id)
                if (childMatch) return childMatch
            }
        }
        return null
    }

    function setSpaces(type: 'parent' | 'child', spaces: any[]) {
        if (type === 'parent') setParentSpaces(spaces)
        else setChildSpaces(spaces)
    }

    async function expandSpace(space: any, type: 'parent' | 'child') {
        const { id, expanded } = space
        const spaces = type === 'parent' ? parentSpaces : childSpaces
        const newSpaces = [...spaces]
        const newSpace = findSpace(newSpaces, id)
        if (expanded) {
            newSpace.expanded = false
            setSpaces(type, newSpaces)
        } else {
            newSpace.loading = true
            setSpaces(type, newSpaces)
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .get(`${config.apiURL}/nav-list-child-spaces?spaceId=${id}`, options)
                .then((res) => {
                    newSpace.children = res.data
                    newSpace.expanded = true
                    newSpace.loading = false
                    setSpaces(type, newSpaces)
                    setRenderKey(renderKey + 1)
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setLoading(true)
        else getSpaces()
    }, [spaceData.id, location])

    return (
        <Scrollbars className={styles.wrapper} style={style}>
            {!loading && (
                <Column>
                    {parentSpaces.length > 0 && (
                        <Column className={styles.spaces}>
                            <Row>
                                <ArrowUpIcon />
                                <p>Parent spaces</p>
                            </Row>
                            <Column key={renderKey}>
                                {parentSpaces.map((space) => (
                                    <Space
                                        key={space.id}
                                        space={space}
                                        type='parent'
                                        selectedSubPage={selectedSpaceSubPage}
                                        expand={expandSpace}
                                        onLocationChange={onLocationChange}
                                    />
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
                            <Column key={renderKey}>
                                {childSpaces.map((space) => (
                                    <Space
                                        key={space.id}
                                        space={space}
                                        type='child'
                                        selectedSubPage={selectedSpaceSubPage}
                                        expand={expandSpace}
                                        onLocationChange={onLocationChange}
                                    />
                                ))}
                            </Column>
                        </Column>
                    )}
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
