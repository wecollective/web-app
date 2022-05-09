import React from 'react'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import SearchBar from '@components/SearchBar'
import Button from '@components/Button'
import Row from '@components/Row'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'

const SpacePagePeopleHeader = (props: {
    applyParam: (param: string, value: string) => void
    filtersOpen: boolean
    setFiltersOpen: (payload: boolean) => void
}): JSX.Element => {
    const { applyParam, filtersOpen, setFiltersOpen } = props

    return (
        <Row centerY className={styles.wrapper}>
            <SearchBar
                setSearchFilter={(value) => applyParam('searchQuery', value)}
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
