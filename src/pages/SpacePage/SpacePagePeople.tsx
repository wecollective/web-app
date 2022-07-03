import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import styles from '@styles/pages/SpacePage/SpacePagePeople.module.scss'
import { getParamString } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpacePagePeopleFilters from '@pages/SpacePage/SpacePagePeopleFilters'
import Row from '@components/Row'
import Column from '@components/Column'
import SpacePagePeopleHeader from '@pages/SpacePage/SpacePagePeopleHeader'
import PeopleList from '@components/PeopleList'
import SpaceNotFound from '@pages/SpaceNotFound'

const SpacePagePeople = (): JSX.Element => {
    const { pageBottomReached } = useContext(AccountContext)
    const {
        spaceData,
        spaceNotFound,
        spacePeople,
        getSpacePeople,
        defaultPeopleFilters,
        spacePeoplePaginationOffset,
        spacePeoplePaginationLimit,
        spacePeopleLoading,
        setSpacePeopleLoading,
        nextSpacePeopleLoading,
        resetSpacePeople,
        spacePeoplePaginationHasMore,
    } = useContext(SpaceContext)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const location = useLocation()
    const history = useHistory()
    const spaceHandle = location.pathname.split('/')[2]

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...defaultPeopleFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function applyParam(type, value) {
        history.push({
            pathname: location.pathname,
            search: getParamString(params, type, value),
        })
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpacePeopleLoading(true)
        else getSpacePeople(spaceData.id, 0, spacePeoplePaginationLimit, params)
    }, [spaceData.handle, location])

    useEffect(() => {
        if (
            !spacePeopleLoading &&
            !nextSpacePeopleLoading &&
            spacePeoplePaginationHasMore &&
            pageBottomReached
        ) {
            getSpacePeople(
                spaceData.id,
                spacePeoplePaginationOffset,
                spacePeoplePaginationLimit,
                params
            )
        }
    }, [pageBottomReached])

    useEffect(() => () => resetSpacePeople(), [])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column className={styles.wrapper}>
            <SpacePagePeopleHeader
                applyParam={applyParam}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
            />
            {filtersOpen && <SpacePagePeopleFilters params={params} applyParam={applyParam} />}
            <Row className={styles.content}>
                <PeopleList
                    people={spacePeople}
                    firstPeopleloading={spacePeopleLoading}
                    nextPeopleLoading={nextSpacePeopleLoading}
                />
            </Row>
        </Column>
    )
}

export default SpacePagePeople
