import React, { useContext } from 'react'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageFilters.module.scss'
import DropDownMenu from '@components/DropDown'
import Row from '@components/Row'

const SpacePageSpacesFilters = (): JSX.Element => {
    const { spaceSpacesFilters, updateSpaceSpacesFilter } = useContext(SpaceContext)
    const { sortBy, sortOrder, timeRange, depth } = spaceSpacesFilters
    return (
        <Row className={styles.wrapper}>
            <DropDownMenu
                title='Sort By'
                options={[
                    'Followers',
                    'Posts',
                    'Comments',
                    'Date',
                    'Reactions',
                    'Likes',
                    'Ratings',
                ]}
                selectedOption={sortBy}
                setSelectedOption={(payload) => updateSpaceSpacesFilter('sortBy', payload)}
                style={{ marginRight: 10 }}
            />
            <DropDownMenu
                title='Sort Order'
                options={['Descending', 'Ascending']}
                selectedOption={sortOrder}
                setSelectedOption={(payload) => updateSpaceSpacesFilter('sortOrder', payload)}
                style={{ marginRight: 10 }}
            />
            <DropDownMenu
                title='Time Range'
                options={[
                    'All Time',
                    'Last Year',
                    'Last Month',
                    'Last Week',
                    'Last 24 Hours',
                    'Last Hour',
                ]}
                selectedOption={timeRange}
                setSelectedOption={(payload) => updateSpaceSpacesFilter('timeRange', payload)}
                style={{ marginRight: 10 }}
            />
            <DropDownMenu
                title='Depth'
                options={['All Contained Spaces', 'Only Direct Descendants']}
                selectedOption={depth}
                setSelectedOption={(payload) => updateSpaceSpacesFilter('depth', payload)}
                style={{ marginRight: 10 }}
            />
        </Row>
    )
}

export default SpacePageSpacesFilters
