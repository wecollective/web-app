import Column from '@components/Column'
import Row from '@components/Row'
import SpaceList from '@components/SpaceList'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import SpaceMap from '@src/pages/SpacePage/SpaceMap'
import SpacesHeader from '@src/pages/SpacePage/SpacesHeader'
import styles from '@styles/pages/SpacePage/Spaces.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const Spaces = (): JSX.Element => {
    const { loggedIn, pageBottomReached } = useContext(AccountContext)
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
    }, [spaceData.handle, location, loggedIn])

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
            <SpacesHeader params={params} />
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
                        <SpaceMap spaceMapData={spaceMapData} params={params} />
                    </Column>
                )}
            </Row>
        </Column>
    )
}

export default Spaces
