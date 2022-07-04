import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import axios from 'axios'
import config from '@src/Config'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import DropDownMenu from '@components/DropDownMenu'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import LoadingWheel from '@components/LoadingWheel'
import { ReactComponent as SearchIcon } from '@svgs/search.svg'

const GlobalSearchBar = (props: { onLocationChange?: () => void; style?: any }): JSX.Element => {
    const { onLocationChange, style } = props
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('Spaces')
    const [options, setOptions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const history = useHistory()

    function updateSearchQuery(query) {
        setSearchQuery(query)
        if (searchType === 'Posts') setOptions([])
        if (['Spaces', 'People'].includes(searchType)) {
            if (!query) setOptions([])
            else {
                setLoading(true)
                const route = searchType === 'Spaces' ? 'find-spaces' : 'find-users'
                const data = { query, blacklist: [] }
                axios
                    .post(`${config.apiURL}/${route}`, data)
                    .then((res) => {
                        setLoading(false)
                        setOptions(res.data)
                    })
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
        if (onLocationChange) onLocationChange()
    }

    useEffect(() => {
        updateSearchQuery(searchQuery)
    }, [searchType])

    return (
        <form className={styles.searchBar} onSubmit={search} style={style}>
            <input
                type='text'
                placeholder='Search all...'
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
                                if (onLocationChange) onLocationChange()
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
            {loading && <LoadingWheel size={25} style={{ marginRight: 10 }} />}
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
    onLocationChange: null,
    style: null,
}

export default GlobalSearchBar
