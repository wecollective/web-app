import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import DropDownMenu from '@components/DropDownMenu'
import FlagImage from '@components/FlagImage'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import { SpaceContext } from '@contexts/SpaceContext'
import config from '@src/Config'
import { getParamString } from '@src/Helpers'
import styles from '@styles/components/GlobalSearchBar.module.scss'
import { ReactComponent as SearchIcon } from '@svgs/search.svg'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

const GlobalSearchBar = (props: { onLocationChange?: () => void; style?: any }): JSX.Element => {
    const { onLocationChange, style } = props
    const { spaceData } = useContext(SpaceContext)
    const history = useHistory()
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]
    const subpage = location.pathname.split('/')[3]
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('Spaces')
    const [spaceConstraint, setSpaceConstraint] = useState(spaceHandle !== 'all')
    const [options, setOptions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const urlParams = Object.fromEntries(new URLSearchParams(location.search))
    const params = {}
    Object.keys(urlParams).forEach((param) => {
        params[param] = urlParams[param]
    })

    function updateSearchQuery(query) {
        setSearchQuery(query)
        if (searchType === 'Posts') setOptions([])
        if (['Spaces', 'People'].includes(searchType)) {
            if (!query) setOptions([])
            else {
                setLoading(true)
                const route = `find-${searchType.toLowerCase()}`
                const data = {
                    query,
                    blacklist: [],
                    spaceId: spaceConstraint ? spaceData.id : null,
                }
                axios
                    .post(`${config.apiURL}/${route}`, data)
                    .then((res) => {
                        setLoading(false)
                        // if search query removed since request sent don't set options
                        setSearchQuery((s) => {
                            if (s) setOptions(res.data)
                            return s
                        })
                    })
                    .catch((error) => console.log(error))
            }
        }
    }

    function search(e) {
        e.preventDefault()
        setOptions([])
        history.push({
            pathname: `/s/${spaceConstraint ? spaceHandle : 'all'}/${searchType.toLowerCase()}`,
            search: getParamString(params, 'searchQuery', searchQuery),
        })
        if (onLocationChange) onLocationChange()
    }

    useEffect(() => {
        updateSearchQuery(searchQuery)
    }, [searchType, spaceConstraint])

    useEffect(() => {
        if (['posts', 'spaces', 'people'].includes(subpage)) {
            const newSearchType = subpage.charAt(0).toUpperCase() + subpage.slice(1)
            if (newSearchType !== searchType && spaceData.handle !== 'all') setSpaceConstraint(true)
            setSearchType(newSearchType)
        }
    }, [location])

    useEffect(() => {
        setSpaceConstraint(spaceData.handle !== 'all')
    }, [spaceData.handle])

    return (
        <form className={styles.searchBar} onSubmit={search} style={style}>
            {spaceConstraint && spaceData.id && spaceData.handle !== 'all' && (
                <Row centerY className={styles.spaceConstraint}>
                    <ImageTitle
                        type='space'
                        imagePath={spaceData.flagImagePath}
                        imageSize={20}
                        title={`s/${spaceData.handle}`}
                    />
                    <CloseButton size={14} onClick={() => setSpaceConstraint(false)} />
                </Row>
            )}
            <input
                type='text'
                placeholder={`Search ${
                    spaceConstraint ? '' : 'all '
                }${searchType.toLowerCase()}...`}
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
                                    `/${searchType === 'Spaces' ? 's' : 'u'}/${
                                        option.handle
                                    }/${subpage}`
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
