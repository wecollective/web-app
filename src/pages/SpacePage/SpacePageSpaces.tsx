import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { getNewParams } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
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
    const { pageBottomReached } = useContext(AccountContext)
    const {
        spaceData,
        spaceNotFound,
        spaceSpaces,
        getSpaceSpaces,
        spaceSpacesLoading,
        setSpaceSpacesLoading,
        nextSpaceSpacesLoading,
        spaceMapData,
        getSpaceMapData,
        spaceSpacesFilters,
        spaceSpacesPaginationOffset,
        spaceSpacesPaginationHasMore,
        spaceSpacesPaginationLimit,
    } = useContext(SpaceContext)
    const location = useLocation()
    const history = useHistory()
    const spaceHandle = location.pathname.split('/')[2]
    const [filtersOpen, setFiltersOpen] = useState(false)

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

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpaceSpacesLoading(true)
        else {
            if (params.view === 'List')
                getSpaceSpaces(spaceData.id, 0, spaceSpacesPaginationLimit, params)
            if (params.view === 'Map') getSpaceMapData(spaceData.id, params)
        }
    }, [spaceData.handle, location])

    useEffect(() => {
        if (!spaceSpacesLoading && !nextSpaceSpacesLoading && spaceSpacesPaginationHasMore)
            getSpaceSpaces(
                spaceData.id,
                spaceSpacesPaginationOffset,
                spaceSpacesPaginationLimit,
                params
            )
    }, [pageBottomReached])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column className={styles.wrapper}>
            <SpacePageSpacesHeader
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                params={params}
                applyParam={applyParam}
            />
            {filtersOpen && <SpacePageSpacesFilters params={params} applyParam={applyParam} />}
            <Row centerX className={styles.content}>
                {params.view === 'List' && (
                    <Column className={styles.spaceListView}>
                        <SpaceList
                            location='space-spaces'
                            spaces={spaceSpaces}
                            firstSpacesloading={spaceSpacesLoading}
                            nextSpacesLoading={nextSpaceSpacesLoading}
                        />
                    </Column>
                )}
                {params.view === 'Map' && (
                    <Column className={styles.spaceMapView}>
                        <SpacePageSpaceMap spaceMapData={spaceMapData} params={params} />
                    </Column>
                )}
            </Row>
        </Column>
    )
}

export default SpacePageSpaces
