/* eslint-disable no-nested-ternary */
import React, { useEffect, useContext } from 'react'
import styles from '@styles/components/PostList.module.scss'
import HorizontalSpaceCard from '@components/Cards/HorizontalSpaceCard'
import SpaceListPlaceholder from '@components/SpaceListPlaceholder'
import Row from '@components/Row'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Scrollbars from '@src/components/Scrollbars'
import { SpaceContext } from '@contexts/SpaceContext'

const SpaceList = (props: {
    location: 'space-spaces'
    spaces: any[]
    firstSpacesloading: boolean
    nextSpacesLoading: boolean
    onScrollBottom: () => void
}): JSX.Element => {
    const { location, spaces, firstSpacesloading, nextSpacesLoading, onScrollBottom } = props
    const { resetSpaceSpaces } = useContext(SpaceContext)

    useEffect(() => () => resetSpaceSpaces(), [])

    return (
        <Scrollbars
            id={`${location}-scrollbars`}
            className={styles.wrapper}
            onScrollBottom={onScrollBottom}
        >
            {firstSpacesloading ? (
                <SpaceListPlaceholder />
            ) : spaces.length ? (
                <Column>
                    {spaces.map((space) => (
                        <HorizontalSpaceCard
                            key={space.id}
                            space={space}
                            style={{ marginBottom: 15 }}
                        />
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
        </Scrollbars>
    )
}

export default SpaceList
