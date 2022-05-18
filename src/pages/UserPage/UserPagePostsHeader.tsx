import React, { useState } from 'react'
import styles from '@styles/pages/SpacePage/SpacePageHeader.module.scss'
import SearchBar from '@components/SearchBar'
import Toggle from '@components/Toggle'
import Button from '@components/Button'
import Row from '@components/Row'
import Modal from '@components/Modal'
import { ReactComponent as SlidersIconSVG } from '@svgs/sliders-h-solid.svg'
import { ReactComponent as EyeIconSVG } from '@svgs/eye-solid.svg'

const UserPagePostsHeader = (props: {
    filtersOpen: boolean
    setFiltersOpen: (payload: boolean) => void
    params: any
    applyParam: (param: string, value: string) => void
}): JSX.Element => {
    const { filtersOpen, setFiltersOpen, params, applyParam } = props
    const [viewModalOpen, setViewModalOpen] = useState(false)

    return (
        <Row centerY centerX className={styles.wrapper}>
            <SearchBar
                setSearchFilter={(value) => applyParam('searchQuery', value)}
                placeholder='Search posts...'
                style={{ width: 250, marginRight: 10 }}
            />
            <Button
                icon={<SlidersIconSVG />}
                text='Filters'
                color='aqua'
                style={{ marginRight: 10 }}
                onClick={() => setFiltersOpen(!filtersOpen)}
            />
            {/* <Button
                icon={<EyeIconSVG />}
                text='View'
                color='purple'
                onClick={() => setViewModalOpen(true)}
            />
            {viewModalOpen && (
                <Modal centered close={() => setViewModalOpen(false)}>
                    <h1>Views</h1>
                    <p>Choose how to display the posts</p>
                    <Toggle
                        leftText='List'
                        rightText='Map'
                        positionLeft={params.view === 'List'}
                        onClick={() => applyParam('view', params.view === 'Map' ? 'List' : 'Map')}
                    />
                </Modal>
            )} */}
        </Row>
    )
}

export default UserPagePostsHeader
