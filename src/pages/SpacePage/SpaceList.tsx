/* eslint-disable no-nested-ternary */
import HorizontalSpaceCard from '@components/cards/HorizontalSpaceCard'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import SpaceListPlaceholder from '@components/SpaceListPlaceholder'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/components/PostList.module.scss'
import React, { useContext, useEffect } from 'react'

function SpaceList(props: { location: 'space-spaces' }): JSX.Element {
    const { location } = props
    const {
        spaceData,
        spaceListData: spaces,
        spaceSpacesLoading: loading,
        nextSpaceSpacesLoading: nextSpacesLoading,
        resetSpaceList,
    } = useContext(SpaceContext)
    const { name, totalSpaces } = spaceData

    function renderPlaceholder() {
        return (
            <Column centerY centerX className={styles.noResults}>
                {totalSpaces ? (
                    <p>No spaces found in {name} that match those settings...</p>
                ) : (
                    <p>No spaces created in {name}...</p>
                )}
            </Column>
        )
    }

    useEffect(() => () => resetSpaceList(), [])

    return (
        <Column id={`${location}-scrollbars`} className={styles.wrapper}>
            {loading ? (
                <SpaceListPlaceholder />
            ) : (
                <Column>
                    {!spaces.length ? (
                        renderPlaceholder()
                    ) : (
                        <Column className={styles.spaces}>
                            {spaces.map((space) => (
                                <HorizontalSpaceCard key={space.id} space={space} />
                            ))}
                            {nextSpacesLoading && (
                                <Row centerX>
                                    <LoadingWheel />
                                </Row>
                            )}
                        </Column>
                    )}
                </Column>
            )}
        </Column>
    )
}

export default SpaceList
