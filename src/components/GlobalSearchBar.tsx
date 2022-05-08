import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import DropDownMenu from '@components/DropDownMenu'
import { ReactComponent as SearchIcon } from '@svgs/search.svg'
// import { ReactComponent as PostsIcon } from '@svgs/edit-solid.svg'
// import { ReactComponent as SpacesIcon } from '@svgs/overlapping-circles-thick.svg'
// import { ReactComponent as PeopleIcon } from '@svgs/users-solid.svg'

const GlobalSearchBar = (): JSX.Element => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('Posts')
    const history = useHistory()

    function search(e) {
        e.preventDefault()
        history.push(`/s/all/${searchType.toLowerCase()}?searchQuery=${searchQuery}`)
    }

    return (
        <form className={styles.searchBar} onSubmit={search}>
            <input
                type='text'
                placeholder='search all...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type='submit' aria-label='search button'>
                <SearchIcon />
            </button>
            <DropDownMenu
                title=''
                orientation='horizontal'
                options={['Posts', 'Spaces', 'People']}
                selectedOption={searchType}
                setSelectedOption={(payload) => setSearchType(payload)}
            />
        </form>
    )
}

GlobalSearchBar.defaultProps = {
    style: null,
}

export default GlobalSearchBar
