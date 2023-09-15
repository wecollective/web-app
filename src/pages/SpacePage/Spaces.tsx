import Column from '@components/Column'
import Row from '@components/Row'
import SpaceList from '@components/SpaceList'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import SpaceCircles from '@src/pages/SpacePage/SpaceCircles'
import SpaceTree from '@src/pages/SpacePage/SpaceTree'
import styles from '@styles/pages/SpacePage/Spaces.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function Spaces(): JSX.Element {
    const { loggedIn, pageBottomReached } = useContext(AccountContext)
    const {
        spaceData,
        spaceNotFound,
        getSpaceListData,
        spaceListData,
        spaceSpacesLoading,
        setSpaceSpacesLoading,
        nextSpaceSpacesLoading,
        spaceCircleData,
        spaceTreeData,
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
        else if (params.lens === 'List')
            getSpaceListData(spaceData.id, 0, spaceSpacesPaginationLimit, params)
        else getSpaceMapData(spaceData.id, params)
    }, [spaceData.handle, location, loggedIn])

    useEffect(() => {
        if (!spaceSpacesLoading && !nextSpaceSpacesLoading && spaceSpacesPaginationHasMore)
            getSpaceListData(
                spaceData.id,
                spaceSpacesPaginationOffset,
                spaceSpacesPaginationLimit,
                params
            )
    }, [pageBottomReached])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            <Row centerX className={styles.content}>
                {params.lens === 'Tree' && (
                    <Column className={styles.spaceMapView}>
                        <SpaceTree spaceTreeData={spaceTreeData} params={params} />
                    </Column>
                )}
                {params.lens === 'Circles' && (
                    <Column className={styles.spaceMapView}>
                        <SpaceCircles spaceCircleData={spaceCircleData} params={params} />
                    </Column>
                )}
                {params.lens === 'List' && (
                    <Column centerX className={styles.spaceListView}>
                        <SpaceList
                            location='space-spaces'
                            spaces={spaceListData}
                            totalSpaces={spaceData.totalSpaces}
                            loading={spaceSpacesLoading}
                            nextSpacesLoading={nextSpaceSpacesLoading}
                        />
                    </Column>
                )}
            </Row>
        </Column>
    )
}

export default Spaces
