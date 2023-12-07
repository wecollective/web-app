/* eslint-disable no-nested-ternary */
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import DropDownMenu from '@components/DropDownMenu'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { capitalise, getParamString } from '@src/Helpers'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import { SearchIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

function GlobalSearchBar(props: { onLocationChange?: () => void; style?: any }): JSX.Element {
    const { onLocationChange, style } = props
    const { spaceData } = useContext(SpaceContext)
    const { userData } = useContext(UserContext)
    const [params, setParams] = useState<any>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('Spaces')
    const [showConstraint, setShowConstraint] = useState(false)
    const searchQueryRef = useRef('')
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)
    const history = useNavigate()
    const cookies = new Cookies()
    const location = useLocation()
    const path = location.pathname.split('/')
    const page = path[1]
    const handle = path[2]
    const subpage = path[3]
    const pageLoading =
        (page === 's' && spaceData.handle !== handle) ||
        (page === 'u' && userData.handle !== handle)

    function getSuggestions(query) {
        setSearchQuery(query)
        searchQueryRef.current = query
        if (!query || searchType === 'Posts') {
            setSuggestions([])
            setSuggestionsLoading(false)
        } else {
            setSuggestionsLoading(true)
            const route = `find-${searchType.toLowerCase()}`
            const data = {
                query,
                spaceId: showConstraint ? spaceData.id : null,
                spaceAccessRequired: false,
            }
            const accessToken = cookies.get('accessToken')
            const options = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/${route}`, data, options)
                .then((res) => {
                    // if the search query has changed since the request was sent don't set options
                    if (searchQueryRef.current === query) {
                        setSuggestions(res.data)
                        setSuggestionsLoading(false)
                    }
                })
                .catch((error) => console.log(error))
        }
    }

    function search(e) {
        e.preventDefault()
        setSuggestions([])
        // update depth is searchQuery used
        if (searchType === 'Spaces') params.depth = searchQuery ? 'Deep' : 'Shallow'
        // reset to global path values if constraint removed
        const pathPage = showConstraint ? page : 's'
        const pathHandle = showConstraint ? handle : 'all'
        history({
            pathname: `/${pathPage}/${pathHandle}/${searchType.toLowerCase()}`,
            search: getParamString(params, 'searchQuery', searchQuery),
            // todo: figure out how to remove empty serach query from search (below not working because doesn't reset query)
            // search: searchQuery ? getParamString(params, 'searchQuery', searchQuery) : '',
        })
        if (onLocationChange) onLocationChange()
    }

    function updateConstraint() {
        const spaceConstraint = page === 's' && handle !== 'all'
        const userConstraint = page === 'u' && subpage === 'posts' && searchType === 'Posts'
        setShowConstraint(spaceConstraint || userConstraint)
    }

    useEffect(() => {
        // update params
        const urlParams = Object.fromEntries(new URLSearchParams(location.search))
        setParams(urlParams)
        // update query and suggestions
        searchQueryRef.current = urlParams.searchQuery || ''
        setSearchQuery(urlParams.searchQuery || '')
        setSuggestions([])
        // update search type if query present
        if (urlParams.searchQuery) setSearchType(capitalise(subpage))
    }, [location])

    useEffect(() => {
        updateConstraint()
    }, [location, searchType])

    return (
        <form className={styles.searchBar} onSubmit={search} style={style}>
            {showConstraint && !pageLoading && (
                <Row centerY className={styles.searchConstraint}>
                    <ImageTitle
                        type={page === 's' ? 'space' : 'user'}
                        imagePath={page === 's' ? spaceData.flagImagePath : userData.flagImagePath}
                        imageSize={20}
                        title={`${page}/${page === 's' ? spaceData.handle : userData.handle}`}
                    />
                    <CloseButton size={14} onClick={() => setShowConstraint(false)} />
                </Row>
            )}
            <input
                type='text'
                placeholder={`Search ${showConstraint ? '' : 'all '}${searchType.toLowerCase()}...`}
                value={searchQuery}
                data-lpignore='true'
                onChange={(e) => getSuggestions(e.target.value)}
                onBlur={() => setTimeout(() => setSuggestions([]), 200)}
            />
            {suggestions.length > 0 && (
                <Column className={styles.searchOptions}>
                    {suggestions.map((option) => (
                        <button
                            type='button'
                            key={option.id}
                            onClick={() => {
                                history(
                                    `/${searchType === 'Spaces' ? 's' : 'u'}/${option.handle}/${
                                        searchType === 'People' ? 'posts' : subpage || ''
                                    }`
                                )
                                setSuggestions([])
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
            {suggestionsLoading && <LoadingWheel size={25} style={{ marginRight: 10 }} />}
            <button type='submit' aria-label='search button'>
                <SearchIcon />
            </button>
            <DropDownMenu
                title=''
                orientation='horizontal'
                options={['Spaces', 'Posts', 'People']}
                selectedOption={searchType}
                setSelectedOption={(value) => {
                    if (page === 'u' && value !== 'Posts') setShowConstraint(false)
                    setSearchType(value)
                }}
                color='dark'
            />
        </form>
    )
}

GlobalSearchBar.defaultProps = {
    onLocationChange: null,
    style: null,
}

export default GlobalSearchBar
