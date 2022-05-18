import React from 'react'
import DropDownMenu from '@components/DropDown'
import Row from '@components/Row'

const SpacePagePeopleFilters = (props: {
    params: any
    applyParam: (param: string, value: string) => void
}): JSX.Element => {
    const { params, applyParam } = props

    return (
        <Row centerX style={{ width: '100%', marginBottom: 15 }}>
            <DropDownMenu
                title='Sort By'
                options={['Posts', 'Comments', 'Date']}
                selectedOption={params.sortBy}
                setSelectedOption={(value) => applyParam('sortBy', value)}
                style={{ marginRight: 10 }}
            />
            <DropDownMenu
                title='Sort Order'
                options={['Descending', 'Ascending']}
                selectedOption={params.sortOrder}
                setSelectedOption={(value) => applyParam('sortOrder', value)}
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
                selectedOption={params.timeRange}
                setSelectedOption={(value) => applyParam('timeRange', value)}
            />
        </Row>
    )
}

export default SpacePagePeopleFilters
