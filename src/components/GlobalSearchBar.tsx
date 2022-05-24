import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import axios from 'axios'
import config from '@src/Config'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import DropDownMenu from '@components/DropDownMenu'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import { ReactComponent as SearchIcon } from '@svgs/search.svg'

const GlobalSearchBar = (): JSX.Element => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('Spaces')
    const [options, setOptions] = useState<any[]>([])
    const history = useHistory()

    function updateSearchQuery(query) {
        setSearchQuery(query)
        if (searchType === 'Posts') setOptions([])
        if (searchType === 'Spaces' || searchType === 'People') {
            if (!query) setOptions([])
            else {
                const route = searchType === 'Spaces' ? 'find-spaces' : 'find-user'
                const data = { query, blacklist: [] }
                axios
                    .post(`${config.apiURL}/${route}`, data)
                    .then((res) => setOptions(res.data))
                    .catch((error) => console.log(error))
            }
        }
    }

    function search(e) {
        e.preventDefault()
        history.push({
            pathname: `/s/all/${searchType.toLowerCase()}`,
            search: searchQuery
                ? `?searchQuery=${searchQuery}${
                      searchType === 'Spaces' ? '&depth=All Contained Spaces' : ''
                  }`
                : '',
        })
    }

    useEffect(() => {
        updateSearchQuery(searchQuery)
    }, [searchType])

    return (
        <form className={styles.searchBar} onSubmit={search}>
            <input
                type='text'
                placeholder='search all...'
                value={searchQuery}
                data-lpignore='true'
                onChange={(e) => updateSearchQuery(e.target.value)}
            />
            {options.length > 0 && (
                <Column className={styles.searchOptions}>
                    {options.map((option) => (
                        <button
                            type='button'
                            key={option.id}
                            onClick={() => {
                                history.push(
                                    `/${searchType === 'Spaces' ? 's' : 'u'}/${option.handle}`
                                )
                                updateSearchQuery('')
                            }}
                        >
                            <FlagImage
                                type={searchType === 'Spaces' ? 'space' : 'user'}
                                size={30}
                                imagePath={option.flagImagePath}
                            />
                            <p>{option.name}</p>
                            <span>
                                ({searchType === 'Spaces' ? 's' : 'u'}/{option.handle})
                            </span>
                        </button>
                    ))}
                </Column>
            )}
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
