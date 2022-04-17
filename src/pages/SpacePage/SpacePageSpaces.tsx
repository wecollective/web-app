import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageSpaces.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import SpacePageSpacesHeader from '@pages/SpacePage/SpacePageSpacesHeader'
import SpacePageSpacesFilters from '@pages/SpacePage/SpacePageSpacesFilters'
import SpaceList from '@components/SpaceList'
import SpacePageSpaceMap from '@pages/SpacePage/SpacePageSpaceMap'
import SpaceNotFound from '@pages/SpaceNotFound'

const SpacePageSpaces = (): JSX.Element => {
    const {
        spaceData,
        spaceNotFound,
        spaceSpaces,
        getSpaceSpaces,
        resetSpaceSpaces,
        spaceSpacesLoading,
        setSpaceSpacesLoading,
        nextSpaceSpacesLoading,
        spaceSpacesFilters,
        spaceSpacesPaginationOffset,
        spaceSpacesPaginationHasMore,
        spaceSpacesPaginationLimit,
    } = useContext(SpaceContext)
    const { innerWidth } = window
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [showSpaceList, setShowSpaceList] = useState(true)
    const [showSpaceMap, setShowSpaceMap] = useState(innerWidth > 1500)

    function onScrollBottom() {
        if (!spaceSpacesLoading && !nextSpaceSpacesLoading && spaceSpacesPaginationHasMore)
            getSpaceSpaces(spaceData.id, spaceSpacesPaginationOffset, spaceSpacesPaginationLimit)
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpaceSpacesLoading(true)
        else getSpaceSpaces(spaceData.id, 0, spaceSpacesPaginationLimit)
    }, [spaceData.handle, spaceSpacesFilters])

    useEffect(() => () => resetSpaceSpaces(), [])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column className={styles.wrapper}>
            <SpacePageSpacesHeader
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                showSpaceList={showSpaceList}
                setShowSpaceList={setShowSpaceList}
                showSpaceMap={showSpaceMap}
                setShowSpaceMap={setShowSpaceMap}
            />
            {filtersOpen && <SpacePageSpacesFilters />}
            <Row className={styles.content}>
                {showSpaceList && (
                    <Column className={styles.spaceList}>
                        <SpaceList
                            location='space-spaces'
                            spaces={spaceSpaces}
                            firstSpacesloading={spaceSpacesLoading}
                            nextSpacesLoading={nextSpaceSpacesLoading}
                            onScrollBottom={onScrollBottom}
                        />
                    </Column>
                )}
                {showSpaceMap && (
                    <Column className={styles.spaceMap}>
                        <SpacePageSpaceMap />
                    </Column>
                )}
            </Row>
        </Column>
    )
}

export default SpacePageSpaces
