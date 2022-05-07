import React, { useContext } from 'react'
import { SpaceContext } from '@contexts/SpaceContext'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import SearchBar from '@components/SearchBar'
import Button from '@components/Button'
import Row from '@components/Row'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'

const SpacePagePeopleHeader = (props: {
    filtersOpen: boolean
    setFiltersOpen: (payload: boolean) => void
}): JSX.Element => {
    const { filtersOpen, setFiltersOpen } = props
    const { updateSpacePeopleFilter } = useContext(SpaceContext)

    return (
        <Row centerY className={styles.wrapper}>
            <SearchBar
                setSearchFilter={(payload) => updateSpacePeopleFilter('searchQuery', payload)}
                placeholder='Search people...'
                style={{ marginRight: 10 }}
            />
            <Button
                icon={<SlidersIconSVG />}
                text='Filters'
                color='aqua'
                style={{ marginRight: 10 }}
                onClick={() => setFiltersOpen(!filtersOpen)}
            />
        </Row>
    )
}

export default SpacePagePeopleHeader
