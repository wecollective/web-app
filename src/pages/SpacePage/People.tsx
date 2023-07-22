import Column from '@components/Column'
import PeopleList from '@components/PeopleList'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import styles from '@styles/pages/SpacePage/People.module.scss'
import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function People(): JSX.Element {
    const { pageBottomReached } = useContext(AccountContext)
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

    // calculate params
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = { ...spacePeopleFilters }
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

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
        <Column centerX className={styles.wrapper}>
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

export default People
