import React, { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styles from '@styles/pages/SpacePage/SpacePagePeople.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SearchBar from '@components/SearchBar'
import VerticalUserCard from '@components/Cards/VerticalUserCard'
import SpacePagePeopleFilters from '@pages/SpacePage/SpacePagePeopleFilters'
import SpacePageSpacesPlaceholder from '@pages/SpacePage/SpacePageSpacesPlaceholder'
import Row from '@components/Row'
import Scrollbars from '@src/components/Scrollbars'

const SpacePagePeople = ({
    match,
}: {
    match: { params: { spaceHandle: string } }
}): JSX.Element => {
    const { params } = match
    const { spaceHandle } = params
    const { accountDataLoading } = useContext(AccountContext)
    const {
        spaceData,
        getSpaceData,
        spacePeople,
        getSpacePeople,
        spacePeopleFilters,
        setSelectedSpaceSubPage,
        spacePeoplePaginationOffset,
        spacePeoplePaginationLimit,
        spaceDataLoading,
        spacePeopleLoading,
        nextSpacePeopleLoading,
        resetSpacePeople,
        spacePeoplePaginationHasMore,
        updateSpacePeopleFilter,
    } = useContext(SpaceContext)

    function onScrollBottom() {
        if (!spacePeopleLoading && !nextSpacePeopleLoading && spacePeoplePaginationHasMore)
            getSpacePeople(spaceData.id, spacePeoplePaginationOffset, spacePeoplePaginationLimit)
    }

    useEffect(() => {
        // todo: use url instead of variable in store?
        setSelectedSpaceSubPage('people')
        return () => resetSpacePeople()
    }, [])

    const location = useLocation()
    const getFirstUsers = (spaceId) => getSpacePeople(spaceId, 0, spacePeoplePaginationLimit)
    useEffect(() => {
        if (!accountDataLoading) {
            if (spaceHandle !== spaceData.handle) getSpaceData(spaceHandle, getFirstUsers)
            else getFirstUsers(spaceData.id)
        }
    }, [accountDataLoading, location, spacePeopleFilters])

    return (
        <div className={styles.wrapper}>
            <Row centerY className={styles.header}>
                <SearchBar
                    setSearchFilter={(payload) => updateSpacePeopleFilter('searchQuery', payload)}
                    placeholder='Search people...'
                    style={{ marginRight: 10 }}
                />
                <SpacePagePeopleFilters />
            </Row>
            <Row className={styles.content}>
                <Scrollbars className={`${styles.people} row wrap`} onScrollBottom={onScrollBottom}>
                    {accountDataLoading || spaceDataLoading || spacePeopleLoading ? (
                        <SpacePageSpacesPlaceholder />
                    ) : (
                        <>
                            {spacePeople.length ? (
                                spacePeople.map((user) => (
                                    <VerticalUserCard
                                        key={user.id}
                                        user={user}
                                        style={{ margin: '0 20px 20px 0' }}
                                    />
                                ))
                            ) : (
                                <div className='wecoNoContentPlaceholder'>
                                    No users yet that match those settings...
                                </div>
                            )}
                        </>
                    )}
                </Scrollbars>
            </Row>
        </div>
    )
}

export default SpacePagePeople
