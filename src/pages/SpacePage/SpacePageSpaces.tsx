import Column from '@components/Column'
import Row from '@components/Row'
import SpaceList from '@components/SpaceList'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import SpacePageSpaceMap from '@pages/SpacePage/SpacePageSpaceMap'
import SpacePageSpacesHeader from '@pages/SpacePage/SpacePageSpacesHeader'
import styles from '@styles/pages/SpacePage/SpacePageSpaces.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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
    const spaceHandle = location.pathname.split('/')[2]

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spaceSpacesFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

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
            <SpacePageSpacesHeader params={params} />
            <Row centerX className={styles.content}>
                {params.view === 'List' && (
                    <Column centerX className={styles.spaceListView}>
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
