import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styles from '@styles/pages/SpacePage/SpacePagePeople.module.scss'
import { SpaceContext } from '@contexts/SpaceContext'
import SpacePagePeopleFilters from '@pages/SpacePage/SpacePagePeopleFilters'
import Row from '@components/Row'
import Column from '@components/Column'
import SpacePagePeopleHeader from '@pages/SpacePage/SpacePagePeopleHeader'
import PeopleList from '@components/PeopleList'
import SpaceNotFound from '@pages/SpaceNotFound'

const SpacePagePeople = (): JSX.Element => {
    const {
        spaceData,
        spaceNotFound,
        spacePeople,
        getSpacePeople,
        spacePeopleFilters,
        spacePeoplePaginationOffset,
        spacePeoplePaginationLimit,
        spacePeopleLoading,
        setSpacePeopleLoading,
        nextSpacePeopleLoading,
        resetSpacePeople,
        spacePeoplePaginationHasMore,
    } = useContext(SpaceContext)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const [filtersOpen, setFiltersOpen] = useState(false)

    function onScrollBottom() {
        if (!spacePeopleLoading && !nextSpacePeopleLoading && spacePeoplePaginationHasMore)
            getSpacePeople(spaceData.id, spacePeoplePaginationOffset, spacePeoplePaginationLimit)
    }

    useEffect(() => {
        if (spaceData.handle !== spaceHandle) setSpacePeopleLoading(true)
        else getSpacePeople(spaceData.id, 0, spacePeoplePaginationLimit)
    }, [spaceData.handle, spacePeopleFilters])

    useEffect(() => () => resetSpacePeople(), [])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column className={styles.wrapper}>
            <SpacePagePeopleHeader filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
            {filtersOpen && <SpacePagePeopleFilters />}
            <Row className={styles.content}>
                <PeopleList
                    location='space-people' // todo: switch to 'space-page'
                    people={spacePeople}
                    firstPeopleloading={spacePeopleLoading}
                    nextPeopleLoading={nextSpacePeopleLoading}
                    onScrollBottom={onScrollBottom}
                />
            </Row>
        </Column>
    )
}

export default SpacePagePeople
