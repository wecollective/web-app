import React, { useContext, useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { OverlayScrollbarsComponent as OverlayScrollbars } from 'overlayscrollbars-react'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageSpaces.module.scss'
import HorizontalSpaceCard from '@components/Cards/HorizontalSpaceCard'
import SearchBar from '@components/SearchBar'
import Button from '@components/Button'
import Column from '@components/Column'
import Row from '@components/Row'
import SpacePageSpacesFilters from '@pages/SpacePage/SpacePageSpacesFilters'
import SpacePageSpacesPlaceholder from '@pages/SpacePage/SpacePageSpacesPlaceholder'
import SpacePageSpaceMap from '@pages/SpacePage/SpacePageSpaceMap'
import Modal from '@components/Modal'
import Toggle from '@components/Toggle'
import CreateSpaceModal from '@src/components/modals/CreateSpaceModal'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const SpacePageSpaces = ({
    match,
}: {
    match: { params: { spaceHandle: string } }
}): JSX.Element => {
    const { params } = match
    const { spaceHandle } = params

    const { accountDataLoading, loggedIn, setAlertModalOpen, setAlertMessage } = useContext(
        AccountContext
    )
    const {
        spaceData,
        getSpaceData,
        spaceDataLoading,
        spaceSpaces,
        getSpaceSpaces,
        resetSpaceSpaces,
        spaceSpacesLoading,
        spaceSpacesFilters,
        updateSpaceSpacesFilter,
        setSelectedSpaceSubPage,
        spaceSpacesPaginationOffset,
        spaceSpacesPaginationHasMore,
        spaceSpacesPaginationLimit,
    } = useContext(SpaceContext)
    const { innerWidth } = window
    const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [viewsModalOpen, setViewsModalOpen] = useState(false)
    const [showSpaceList, setShowSpaceList] = useState(true)
    const [showSpaceMap, setShowSpaceMap] = useState(innerWidth > 1500)

    const OSRef = useRef<OverlayScrollbars>(null)
    const OSOptions = {
        className: 'os-theme-none',
        callbacks: {
            onScroll: () => {
                // load next spaces when scroll bottom reached
                const instance = OSRef!.current!.osInstance()
                const scrollInfo = instance!.scroll()
                if (scrollInfo.ratio.y > 0.999 && spaceSpacesPaginationHasMore) {
                    getSpaceSpaces(
                        spaceData.id,
                        spaceSpacesPaginationOffset,
                        spaceSpacesPaginationLimit
                    )
                }
            },
        },
    }

    function openCreateSpaceModal() {
        if (loggedIn) setCreateSpaceModalOpen(true)
        else {
            setAlertModalOpen(true)
            setAlertMessage('Log in to create a space')
        }
    }

    // todo: use url instead of variable in store?
    useEffect(() => setSelectedSpaceSubPage('spaces'), [])

    useEffect(() => () => resetSpaceSpaces(), [])

    const location = useLocation()
    const getFirstSpaces = (spaceId) => getSpaceSpaces(spaceId, 0, spaceSpacesPaginationLimit)
    useEffect(() => {
        if (!accountDataLoading) {
            if (spaceData.handle !== spaceHandle) {
                getSpaceData(spaceHandle, showSpaceList ? getFirstSpaces : null)
            } else if (showSpaceList) {
                getFirstSpaces(spaceData.id)
            }
        }
    }, [accountDataLoading, location, spaceSpacesFilters])

    return (
        <Column className={styles.wrapper}>
            <Row centerY className={styles.header}>
                <Button
                    text='New space'
                    color='blue'
                    onClick={openCreateSpaceModal}
                    style={{ marginRight: 10 }}
                />
                {createSpaceModalOpen && (
                    <CreateSpaceModal close={() => setCreateSpaceModalOpen(false)} />
                )}
                <SearchBar
                    setSearchFilter={(payload) => updateSpaceSpacesFilter('searchQuery', payload)}
                    placeholder='Search spaces...'
                    style={{ marginRight: 10 }}
                />
                <Button
                    icon={<SlidersIconSVG />}
                    color='grey'
                    style={{ marginRight: 10 }}
                    onClick={() => setFiltersOpen(!filtersOpen)}
                />
                <Button
                    icon={<EyeIconSVG />}
                    color='grey'
                    onClick={() => setViewsModalOpen(true)}
                />
                {viewsModalOpen && (
                    <Modal centered close={() => setViewsModalOpen(false)}>
                        <h1>Views</h1>
                        <p>Choose how to display the spaces</p>
                        {innerWidth > 1600 ? (
                            <Column centerX>
                                <Row style={{ marginBottom: 20 }}>
                                    <Toggle
                                        leftText='List'
                                        rightColor='blue'
                                        positionLeft={!showSpaceList}
                                        onClick={() => setShowSpaceList(!showSpaceList)}
                                    />
                                </Row>
                                <Row>
                                    <Toggle
                                        leftText='Map'
                                        rightColor='blue'
                                        positionLeft={!showSpaceMap}
                                        onClick={() => setShowSpaceMap(!showSpaceMap)}
                                    />
                                </Row>
                            </Column>
                        ) : (
                            <Row>
                                <Toggle
                                    leftText='List'
                                    rightText='Map'
                                    positionLeft={showSpaceList}
                                    onClick={() => {
                                        setShowSpaceList(!showSpaceList)
                                        setShowSpaceMap(!showSpaceMap)
                                    }}
                                />
                            </Row>
                        )}
                    </Modal>
                )}
            </Row>
            {filtersOpen && (
                <Row className={styles.filters}>
                    <SpacePageSpacesFilters />
                </Row>
            )}
            <Row className={styles.content}>
                {showSpaceList && (
                    <OverlayScrollbars
                        className={`${styles.spaces} os-host-flexbox scrollbar-theme`}
                        options={OSOptions}
                        ref={OSRef}
                    >
                        {accountDataLoading || spaceDataLoading || spaceSpacesLoading ? (
                            <SpacePageSpacesPlaceholder />
                        ) : (
                            <>
                                {spaceSpaces.length ? (
                                    spaceSpaces.map((space) => (
                                        <HorizontalSpaceCard
                                            key={space.id}
                                            space={space}
                                            style={{ marginBottom: 15 }}
                                        />
                                    ))
                                ) : (
                                    <div className='wecoNoContentPlaceholder'>
                                        No spaces yet that match those settings...
                                    </div>
                                )}
                            </>
                        )}
                    </OverlayScrollbars>
                )}
                {showSpaceMap && (
                    <Column className={styles.spaceMap}>
                        <SpacePageSpaceMap />
                    </Column>
                )}
            </Row>
        </Column>
    )
}

export default SpacePageSpaces
