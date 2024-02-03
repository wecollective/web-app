import Column from '@components/Column'
import Row from '@components/Row'
import SpaceFilters from '@components/SpaceFilters'
import SpaceList from '@components/SpaceList'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import NavigationList from '@pages/SpacePage/NavigationList'
import SpaceCircles from '@pages/SpacePage/SpaceCircles'
import SpaceTree from '@pages/SpacePage/SpaceTree'
import styles from '@styles/pages/SpacePage/Spaces.module.scss'
import React, { useContext, useEffect, useState } from 'react'
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
        setSpaceTreeData,
        setSpaceCircleData,
        spaceSpacesFilters,
        spaceSpacesPaginationOffset,
        spaceSpacesPaginationHasMore,
        spaceSpacesPaginationLimit,
    } = useContext(SpaceContext)
    const [largeScreen, setLargeScreen] = useState(false)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const mobileView = document.documentElement.clientWidth < 900

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spaceSpacesFilters, lens: mobileView ? 'List' : 'Tree' }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpaceSpacesLoading(true)
        else if (params.lens === 'List') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            getSpaceListData(spaceData.id, 0, spaceSpacesPaginationLimit, params)
        } else {
            window.scrollTo({ top: 320, behavior: 'smooth' })
            getSpaceMapData('full-tree', spaceData.id, params, 0)
                .then((res) => {
                    if (params.lens === 'Tree') setSpaceTreeData(res.data)
                    if (params.lens === 'Circles') setSpaceCircleData(res.data)
                })
                .catch((error) => console.log(error))
        }
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

    useEffect(() => {
        setLargeScreen(document.documentElement.clientWidth >= 1200)
        window.addEventListener('resize', () =>
            setLargeScreen(document.documentElement.clientWidth >= 1200)
        )
    }, [])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {params.lens === 'List' && (
                <Row centerX style={{ width: '100%' }}>
                    {largeScreen && (
                        <Column className={styles.spaceNavWrapper}>
                            <NavigationList excludeChildren />
                        </Column>
                    )}
                    <Column style={{ width: '100%' }}>
                        <SpaceFilters pageType='space' urlParams={params} />
                        <SpaceList
                            location='space-spaces'
                            spaces={spaceListData}
                            totalSpaces={spaceData.totalSpaces}
                            loading={spaceSpacesLoading}
                            nextSpacesLoading={nextSpaceSpacesLoading}
                            className={styles.spaceList}
                        />
                    </Column>
                    {largeScreen && <Column className={styles.spaceNavWrapper} />}
                </Row>
            )}
            {params.lens === 'Tree' && (
                <Column className={styles.spaceMapView}>
                    <Row centerX style={{ width: '100%' }}>
                        <SpaceFilters
                            pageType='space'
                            urlParams={params}
                            style={{ maxWidth: 770 }}
                        />
                    </Row>
                    <SpaceTree spaceTreeData={spaceTreeData} params={params} />
                </Column>
            )}
            {params.lens === 'Circles' && (
                <Column className={styles.spaceMapView}>
                    <Row centerX style={{ width: '100%' }}>
                        <SpaceFilters
                            pageType='space'
                            urlParams={params}
                            style={{ maxWidth: 770 }}
                        />
                    </Row>
                    <SpaceCircles spaceCircleData={spaceCircleData} params={params} />
                </Column>
            )}
        </Column>
    )
}

export default Spaces
