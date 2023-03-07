/* eslint-disable no-nested-ternary */
import HorizontalSpaceCard from '@components/cards/HorizontalSpaceCard'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import SpaceListPlaceholder from '@components/SpaceListPlaceholder'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/components/PostList.module.scss'
import React, { useContext, useEffect } from 'react'

const SpaceList = (props: {
    location: 'space-spaces'
    spaces: any[]
    firstSpacesloading: boolean
    nextSpacesLoading: boolean
}): JSX.Element => {
    const { location, spaces, firstSpacesloading, nextSpacesLoading } = props
    const { resetSpaceListData } = useContext(SpaceContext)

    useEffect(() => () => resetSpaceListData(), [])

    return (
        <Column id={`${location}-scrollbars`} className={styles.wrapper}>
            {firstSpacesloading ? (
                <SpaceListPlaceholder />
            ) : spaces.length ? (
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
            ) : (
                <Row className={styles.noResults}>
                    <p>No spaces found that match those settings...</p>
                </Row>
            )}
        </Column>
    )
}

export default SpaceList
