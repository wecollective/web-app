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
import { capitalise, getParamString } from '@src/Helpers'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import { ReactComponent as SearchIcon } from '@svgs/search.svg'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

const GlobalSearchBar = (props: { onLocationChange?: () => void; style?: any }): JSX.Element => {
    const { onLocationChange, style } = props
    const { spaceData } = useContext(SpaceContext)
    const { userData } = useContext(UserContext)
    const history = useHistory()
    const location = useLocation()
    const pageType = location.pathname.split('/')[1]
    const handle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const [firstRun, setFirstRun] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState(
        pageType === 's'
            ? ['posts', 'spaces', 'people'].includes(subpage)
                ? capitalise(subpage)
                : 'Spaces'
            : 'Posts'
    )
    const [searchConstraint, setSearchConstraint] = useState(
        pageType === 'u' || (pageType === 's' && handle !== 'all')
    )
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)
    const pageDataLoading =
        (pageType === 's' && !spaceData.id) || (pageType === 'u' && !userData.id)
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = {} as any
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function getSuggestions(query) {
        setSearchQuery(query)
        if (query && ['Spaces', 'People'].includes(searchType)) {
            setSuggestionsLoading(true)
            const route = `find-${searchType.toLowerCase()}`
            const data = {
                query,
                blacklist: [],
                spaceId: searchConstraint ? spaceData.id : null,
            }
            axios
                .post(`${config.apiURL}/${route}`, data)
                .then((res) => {
                    setSuggestionsLoading(false)
                    // if search query changed since request sent don't set options
                    setSearchQuery((s) => {
                        if (s === query) setSuggestions(res.data)
                        return s
                    })
                })
                .catch((error) => console.log(error))
        } else setSuggestions([])
    }

    function search(e) {
        e.preventDefault()
        setSuggestions([])
        params.depth = `All Contained ${searchType}`
        history.push({
            pathname: `/${searchConstraint ? pageType : 's'}/${
                searchConstraint ? handle : 'all'
            }/${searchType.toLowerCase()}`,
            search: getParamString(params, 'searchQuery', searchQuery),
        })
        if (onLocationChange) onLocationChange()
    }

    useEffect(() => {
        if (firstRun) setFirstRun(false)
        else {
            // update search constraint
            const showSpaceConstraint =
                pageType === 's' &&
                handle !== 'all' &&
                (['posts', 'spaces', 'people'].includes(subpage) || searchConstraint)
            const showUserConstraint = pageType === 'u' && (subpage === 'posts' || searchConstraint)
            setSearchConstraint(showSpaceConstraint || showUserConstraint)
            // update search type
            const updateSpaceSearchType =
                pageType === 's' && ['posts', 'spaces', 'people'].includes(subpage)
            const updateUserSearchType = pageType === 'u' && subpage === 'posts'
            if (updateSpaceSearchType || updateUserSearchType) setSearchType(capitalise(subpage))
        }
    }, [location])

    useEffect(() => {
        setSearchQuery('')
        setSuggestions([])
    }, [subpage])

    // update suggestions if search type or constraint changed
    useEffect(() => {
        getSuggestions(searchQuery)
    }, [searchType, searchConstraint])

    return (
        <form className={styles.searchBar} onSubmit={search} style={style}>
            {searchConstraint &&
                !pageDataLoading &&
                (pageType !== 's' || spaceData.handle !== 'all') && (
                    <Row centerY className={styles.searchConstraint}>
                        <ImageTitle
                            type={pageType === 's' ? 'space' : 'user'}
                            imagePath={
                                pageType === 's' ? spaceData.flagImagePath : userData.flagImagePath
                            }
                            imageSize={20}
                            title={`${pageType}/${
                                pageType === 's' ? spaceData.handle : userData.handle
                            }`}
                        />
                        <CloseButton size={14} onClick={() => setSearchConstraint(false)} />
                    </Row>
                )}
            <input
                type='text'
                placeholder={`Search ${
                    searchConstraint ? '' : 'all '
                }${searchType.toLowerCase()}...`}
                value={searchQuery}
                data-lpignore='true'
                onChange={(e) => getSuggestions(e.target.value)}
            />
            {suggestions.length > 0 && (
                <Column className={styles.searchOptions}>
                    {suggestions.map((option) => (
                        <button
                            type='button'
                            key={option.id}
                            onClick={() => {
                                history.push(
                                    `/${searchType === 'Spaces' ? 's' : 'u'}/${option.handle}/${
                                        searchType === 'People' ? 'posts' : subpage
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
                    if (pageType === 'u' && value !== 'Posts') setSearchConstraint(false)
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
