import Column from '@components/Column'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import SpaceButton from '@components/SpaceButton'
import LoadingWheel from '@components/animations/LoadingWheel'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/NavigationList.module.scss'
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, PlusIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'universal-cookie'

function Space(props: {
    space: any
    type: 'parent' | 'child'
    expand: (space: any, type: 'parent' | 'child') => void
    getNextChildren: (id: number, type: 'parent' | 'child') => void
    onLocationChange: (() => void) | undefined
}): JSX.Element {
    // recursive component used to render space trees in the NavigationList component below
    const { space, type, expand, getNextChildren, onLocationChange } = props
    const { id, privacy, children, totalChildren, expanded, loading, nextChildrenLoading } = space
    const { loggedIn } = useContext(AccountContext)
    const [showExpander, setShowExpander] = useState(totalChildren > 0 && privacy === 'public')
    // check access
    useEffect(() => {
        // todo: see if there's a way to prevent this from firing when the array is updated
        if (loggedIn && totalChildren > 0 && type === 'child' && privacy !== 'public') {
            const cookies = new Cookies()
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .get(`${config.apiURL}/space-access?spaceId=${id}`, options)
                .then((res) => setShowExpander(res.data))
                .catch((error) => console.log(error))
        }
    }, [])
    return (
        <Column>
            <Row centerY style={{ marginBottom: 10 }}>
                <SpaceButton
                    space={space}
                    imageSize={35}
                    maxChars={24}
                    onClick={() => onLocationChange && onLocationChange()}
                />
                {showExpander && (
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
                <Column scroll className={styles.children}>
                    {children &&
                        children.map((child) => (
                            <Space
                                key={child.id}
                                space={child}
                                type={type}
                                expand={expand}
                                getNextChildren={getNextChildren}
                                onLocationChange={onLocationChange}
                            />
                        ))}
                    {children.length < totalChildren && (
                        <Row centerX centerY style={{ height: 30, overflow: 'hidden' }}>
                            {nextChildrenLoading ? (
                                <LoadingWheel size={20} />
                            ) : (
                                <button
                                    type='button'
                                    onClick={() => getNextChildren(id, type)}
                                    className={styles.loadMore}
                                >
                                    Load more ({totalChildren - children.length})
                                </button>
                            )}
                        </Row>
                    )}
                </Column>
            )}
        </Column>
    )
}

function NavigationList(props: {
    excludeChildren?: boolean
    onLocationChange?: () => void
    style?: any
}): JSX.Element {
    const { excludeChildren, onLocationChange, style } = props
    const { spaceData } = useContext(SpaceContext)
    const [parents, setParents] = useState<any[]>([])
    const [children, setChildren] = useState<any[]>([])
    const [totalChildren, setTotalChildren] = useState(0)
    const [childrenOffset, setChildrenOffset] = useState(0)
    const [renderKey, setRenderKey] = useState(0)
    const [loading, setLoading] = useState(true)
    const [nextSpacesLoading, setNextSpacesLoading] = useState(false)
    const cookies = new Cookies()
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const spaceHandleRef = useRef('')

    async function getSpaces(spaceId, offset, includeParents, includeChildren) {
        if (!offset) spaceHandleRef.current = spaceHandle
        const data = { spaceId, offset, includeParents, includeChildren }
        return axios.post(`${config.apiURL}/nav-list-spaces`, data)
    }

    function findSpace(spaces: any[], id: number) {
        // recursively traverses the tree to find a matching space
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
        if (type === 'parent') setParents(spaces)
        else setChildren(spaces)
    }

    async function expandSpace(space: any, type: 'parent' | 'child') {
        const { id, expanded } = space
        const spaces = type === 'parent' ? parents : children
        const newSpaces = [...spaces]
        const newSpace = findSpace(newSpaces, id)
        if (expanded) {
            newSpace.expanded = false
            setSpaces(type, newSpaces)
        } else {
            newSpace.loading = true
            newSpace.offset = 0
            setSpaces(type, newSpaces)
            getSpaces(id, 0, false, true)
                .then((res) => {
                    newSpace.children = res.data.children
                    newSpace.totalChildren = res.data.totalChildren
                    newSpace.expanded = true
                    newSpace.loading = false
                    setSpaces(type, newSpaces)
                    setRenderKey(renderKey + 1)
                })
                .catch((error) => console.log(error))
        }
    }

    async function getNextChildren(id: any, type: 'parent' | 'child') {
        const spaces = type === 'parent' ? parents : children
        const newSpaces = [...spaces]
        const newSpace = findSpace(newSpaces, id)
        newSpace.nextChildrenLoading = true
        setSpaces(type, newSpaces)
        getSpaces(id, newSpace.offset || 10, false, true)
            .then((res) => {
                newSpace.children = [...newSpace.children, ...res.data.children]
                newSpace.nextChildrenLoading = false
                newSpace.offset = (newSpace.offset || 10) + 10
                setSpaces(type, newSpaces)
                setRenderKey(renderKey + 1)
            })
            .catch((error) => console.log(error))
    }

    function expandRootChildren() {
        setNextSpacesLoading(true)
        getSpaces(spaceData.id, childrenOffset, false, true)
            .then((res) => {
                setChildren([...children, ...res.data.children])
                setChildrenOffset(childrenOffset + 10)
                setNextSpacesLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setLoading(true)
        else {
            getSpaces(spaceData.id, 0, true, !excludeChildren)
                .then((res) => {
                    if (spaceHandleRef.current === spaceHandle) {
                        setParents(res.data.parents)
                        setChildren(res.data.children)
                        setTotalChildren(res.data.totalChildren)
                        setChildrenOffset(10)
                        setLoading(false)
                    }
                })
                .catch((error) => console.log(error))
        }
    }, [spaceData.id, location.pathname])

    return (
        <Scrollbars className={styles.wrapper} style={style}>
            {!loading && (
                <Column>
                    {parents.length > 0 && (
                        <Column className={styles.spaces} style={{ marginBottom: 20 }}>
                            <Row>
                                <ArrowUpIcon />
                                <p>Parent spaces</p>
                            </Row>
                            <Column key={renderKey}>
                                {parents.map((space) => (
                                    <Space
                                        key={space.id}
                                        space={space}
                                        type='parent'
                                        expand={expandSpace}
                                        getNextChildren={getNextChildren}
                                        onLocationChange={onLocationChange}
                                    />
                                ))}
                            </Column>
                        </Column>
                    )}
                    {children.length > 0 && (
                        <Column className={styles.spaces}>
                            <Row>
                                <ArrowDownIcon />
                                <p>Child spaces</p>
                            </Row>
                            <Column key={renderKey}>
                                {children.map((space) => (
                                    <Space
                                        key={space.id}
                                        space={space}
                                        type='child'
                                        expand={expandSpace}
                                        getNextChildren={getNextChildren}
                                        onLocationChange={onLocationChange}
                                    />
                                ))}
                                {children.length < totalChildren && (
                                    <Row centerX>
                                        {nextSpacesLoading ? (
                                            <LoadingWheel size={20} />
                                        ) : (
                                            <button
                                                type='button'
                                                onClick={expandRootChildren}
                                                className={styles.loadMore}
                                            >
                                                Load more ({totalChildren - children.length})
                                            </button>
                                        )}
                                    </Row>
                                )}
                            </Column>
                        </Column>
                    )}
                </Column>
            )}
        </Scrollbars>
    )
}

NavigationList.defaultProps = {
    excludeChildren: false,
    onLocationChange: null,
    style: null,
}

export default NavigationList
