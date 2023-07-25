/* eslint-disable no-nested-ternary */
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import DropDownMenu from '@components/DropDownMenu'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { getParamString } from '@src/Helpers'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import { SearchIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'

// todo: simply and clarify logic where possible, put some of it into functions
// todo: include search query if in params
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
        if (!query || !['Spaces', 'People'].includes(searchType)) {
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
        if (searchType === 'Spaces')
            params.depth = searchQuery ? 'All Contained Spaces' : 'Only Direct Descendents'
        history({
            pathname: `/${showConstraint ? page : 's'}/${
                showConstraint ? handle : 'all'
            }/${searchType.toLowerCase()}`,
            search: getParamString(params, 'searchQuery', searchQuery),
        })
        if (onLocationChange) onLocationChange()
    }

    function updateConstraint() {
        const spaceConstraint = page === 's' && handle !== 'all'
        const userConstraint = page === 'u' && subpage === 'posts' && searchType === 'Posts'
        setShowConstraint(spaceConstraint || userConstraint)
    }

    useEffect(() => {
        const urlParams = Object.fromEntries(new URLSearchParams(location.search))
        setParams(urlParams)
    }, [location])

    useEffect(() => {
        searchQueryRef.current = ''
        setSearchQuery('')
        setSuggestions([])
    }, [subpage, handle])

    // // update suggestions if search type or constraint changed
    // useEffect(() => {
    //     getSuggestions(searchQuery)
    // }, [searchType, showConstraint])

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
            />
        </form>
    )
}

GlobalSearchBar.defaultProps = {
    onLocationChange: null,
    style: null,
}

export default GlobalSearchBar

// old code used to match search type with page type:
// const [searchType, setSearchType] = useState(
//     page === 's'
//         ? ['posts', 'spaces', 'people'].includes(subpage)
//             ? capitalise(subpage)
//             : 'Spaces'
//         : 'Posts'
// )

// update search type in location useEffect
// const updateSpaceSearchType =
//     page === 's' && ['posts', 'spaces', 'people'].includes(subpage)
// const updateUserSearchType = page === 'u' && subpage === 'posts'
// if (updateSpaceSearchType || updateUserSearchType) setSearchType(capitalise(subpage))
