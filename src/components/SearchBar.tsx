import styles from '@styles/components/SearchBar.module.scss'
import { ReactComponent as SearchIcon } from '@svgs/search.svg'
import React, { useState } from 'react'

const SearchBar = (props: {
    setSearchFilter: (payload: string) => void
    placeholder: string
    style?: any
}): JSX.Element => {
    const { setSearchFilter, placeholder, style } = props
    const [newSearch, setNewSearch] = useState('')

    function applySearch(e) {
        e.preventDefault()
        setSearchFilter(newSearch)
    }

    return (
        <form className={styles.searchBar} onSubmit={applySearch} style={style}>
            <input
                type='text'
                placeholder={placeholder}
                value={newSearch}
                onChange={(e) => setNewSearch(e.target.value)}
            />
            <button type='submit' aria-label='search button'>
                <SearchIcon />
            </button>
        </form>
    )
}

SearchBar.defaultProps = {
    style: null,
}

export default SearchBar
