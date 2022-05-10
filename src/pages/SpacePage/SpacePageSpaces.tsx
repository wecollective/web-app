import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { getNewParams } from '@src/Helpers'
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
        spaceMapData,
        getSpaceMapData,
        setSpaceMapData,
        spaceSpacesFilters,
        spaceSpacesPaginationOffset,
        spaceSpacesPaginationHasMore,
        spaceSpacesPaginationLimit,
    } = useContext(SpaceContext)
    // const { innerWidth } = window
    const location = useLocation()
    const history = useHistory()
    const spaceHandle = location.pathname.split('/')[2]
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [showSpaceList, setShowSpaceList] = useState(false)
    const [showSpaceMap, setShowSpaceMap] = useState(true) // innerWidth > 1500)

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spaceSpacesFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function applyParam(type, value) {
        if (type === 'searchQuery') params.depth = 'All Contained Spaces'
        history.push({
            pathname: location.pathname,
            search: getNewParams(params, type, value),
        })
    }

    function onScrollBottom() {
        if (!spaceSpacesLoading && !nextSpaceSpacesLoading && spaceSpacesPaginationHasMore)
            getSpaceSpaces(
                spaceData.id,
                spaceSpacesPaginationOffset,
                spaceSpacesPaginationLimit,
                params
            )
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpaceSpacesLoading(true)
        else {
            if (showSpaceList) getSpaceSpaces(spaceData.id, 0, spaceSpacesPaginationLimit, params)
            if (showSpaceMap) getSpaceMapData(spaceData.id, params)
        }
    }, [spaceData.handle, location])

    useEffect(
        () => () => {
            resetSpaceSpaces()
            setSpaceMapData({})
        },
        []
    )

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
                applyParam={applyParam}
            />
            {filtersOpen && <SpacePageSpacesFilters params={params} applyParam={applyParam} />}
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
                        <SpacePageSpaceMap spaceMapData={spaceMapData} params={params} />
                    </Column>
                )}
            </Row>
        </Column>
    )
}

export default SpacePageSpaces
