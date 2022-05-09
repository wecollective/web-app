import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import DropDownMenu from '@components/DropDownMenu'
import { ReactComponent as SearchIcon } from '@svgs/search.svg'

const GlobalSearchBar = (): JSX.Element => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('Spaces')
    const history = useHistory()

    function search(e) {
        e.preventDefault()
        history.push({
            pathname: `/s/all/${searchType.toLowerCase()}`,
            search: searchQuery ? `?searchQuery=${searchQuery}` : '',
        })
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
                options={['Spaces', 'Posts', 'People']}
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
