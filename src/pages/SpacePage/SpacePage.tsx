import React, { useContext, useEffect } from 'react'
import { Route, Switch, Redirect, useLocation } from 'react-router-dom'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePage.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import SpacePageSidebar from '@pages/SpacePage/SpacePageSidebar'
import CoverImage from '@components/CoverImage'
import PageTabs from '@components/PageTabs'
import SpacePageSettings from '@pages/SpacePage/SpacePageSettings'
import SpacePageAbout from '@pages/SpacePage/SpacePageAbout'
import SpacePagePosts from '@pages/SpacePage/SpacePagePosts'
import SpacePageSpaces from '@pages/SpacePage/SpacePageSpaces'
import SpacePagePeople from '@pages/SpacePage/SpacePagePeople'
import SpacePageCalendar from '@pages/SpacePage/SpacePageCalendar'
import SpacePageRooms from '@pages/SpacePage/SpacePageRooms'
import SpacePageGovernance from '@pages/SpacePage/SpacePageGovernance'
import { ReactComponent as SettingsIconSVG } from '@svgs/cog-solid.svg'
import PageNotFound from '@pages/PageNotFound'

const SpacePage = (): JSX.Element => {
    const { accountDataLoading } = useContext(AccountContext)
    const {
        spaceData,
        isModerator,
        getSpaceData,
        resetSpaceData,
        setSelectedSpaceSubPage,
    } = useContext(SpaceContext)

    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const tabs = {
        baseRoute: `/s/${spaceData.handle}`,
        left: ['About', 'Posts', 'Spaces', 'People', 'Calendar', 'Rooms', 'Governance'].map(
            (value) => {
                return { text: value, visible: true, selected: subpage === value.toLowerCase() }
            }
        ),
        right: [
            {
                text: 'Settings',
                visible: isModerator,
                selected: subpage === 'settings',
                icon: <SettingsIconSVG />,
            },
        ],
    }

    useEffect(() => {
        if (!accountDataLoading && spaceHandle !== spaceData.handle) getSpaceData(spaceHandle)
    }, [accountDataLoading, spaceHandle])

    useEffect(() => setSelectedSpaceSubPage(subpage), [location])

    useEffect(() => () => resetSpaceData(), [])

    return (
        <Row className={styles.wrapper}>
            <SpacePageSidebar />
            <Column className={styles.content}>
                <CoverImage type='space' image={spaceData.coverImagePath} canEdit={isModerator} />
                <PageTabs tabs={tabs} />
                <Column className={styles.centerPanel}>
                    <Switch>
                        <Redirect from='/s/:spaceHandle/' to='/s/:spaceHandle/posts' exact />
                        <Route path='/s/:spaceHandle/about' component={SpacePageAbout} exact />
                        <Route path='/s/:spaceHandle/posts' component={SpacePagePosts} exact />
                        <Route path='/s/:spaceHandle/spaces' component={SpacePageSpaces} exact />
                        <Route path='/s/:spaceHandle/people' component={SpacePagePeople} exact />
                        <Route
                            path='/s/:spaceHandle/calendar'
                            component={SpacePageCalendar}
                            exact
                        />
                        <Route path='/s/:spaceHandle/rooms' component={SpacePageRooms} exact />
                        <Route
                            path='/s/:spaceHandle/governance'
                            component={SpacePageGovernance}
                            exact
                        />
                        <Route
                            path='/s/:spaceHandle/settings'
                            component={SpacePageSettings}
                            exact
                        />
                        <Route component={PageNotFound} />
                    </Switch>
                </Column>
            </Column>
        </Row>
    )
}

export default SpacePage
