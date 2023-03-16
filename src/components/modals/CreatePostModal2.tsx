/* eslint-disable no-nested-ternary */
// import InquiryAnswer from '@components/cards/InquiryAnswer'
// import PostCard from '@components/cards/PostCard/PostCard'
// import StringBeadCard from '@components/cards/PostCard/StringBeadCard'
// import CheckBox from '@components/CheckBox'
import Button from '@components/Button'
import Column from '@components/Column'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import ImageTitle from '@components/ImageTitle'
import Images from '@src/components/cards/PostCard/PostTypes/Images'
// import Input from '@components/Input'
// import Markdown from '@components/Markdown'
import Audio from '@components/cards/PostCard/PostTypes/Audio'
import Modal from '@components/modals/Modal'
import PostSpaces from '@src/components/cards/PostCard/PostSpaces'
// import ProgressBarSteps from '@components/ProgressBarSteps'
import Row from '@components/Row'
// import Scrollbars from '@components/Scrollbars'
import SuccessMessage from '@components/SuccessMessage'
// import Toggle from '@components/Toggle'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import UrlPreview from '@src/components/cards/PostCard/UrlPreview'
// import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import { defaultErrorState, findDraftLength } from '@src/Helpers'
import colors from '@styles/Colors.module.scss'
import styles from '@styles/components/modals/CreatePostModal2.module.scss'
// import * as d3 from 'd3'
// import flatpickr from 'flatpickr'
import AddPostAudioModal from '@components/modals/AddPostAudioModal'
import AddPostImagesModal from '@components/modals/AddPostImagesModal'
import AddPostSpacesModal from '@components/modals/AddPostSpacesModal'
import config from '@src/Config'
import axios from 'axios'
import 'flatpickr/dist/themes/material_green.css'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'
// import { v4 as uuidv4 } from 'uuid'
import { AudioIcon, CalendarIcon, CastaliaIcon, ImageIcon, InquiryIcon } from '@svgs/all'

const { white, red, orange, yellow, green, blue, purple } = colors
const beadColors = [white, red, orange, yellow, green, blue, purple]
const defaultSelectedSpace = {
    id: 1,
    handle: 'all',
    name: 'All',
    flagImagePath: 'https://weco-prod-space-flag-images.s3.eu-west-1.amazonaws.com/1614556880362',
}

const CreatePostModal = (): JSX.Element => {
    const {
        accountData,
        setCreatePostModalOpen,
        createPostModalSettings,
        setCreatePostModalSettings,
        setAlertModalOpen,
        setAlertMessage,
    } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const [loading, setLoading] = useState(false)
    const [postType, setPostType] = useState('')
    const [spaces, setSpaces] = useState<any[]>([spaceData.id ? spaceData : defaultSelectedSpace])
    const [text, setText] = useState({
        ...defaultErrorState,
        value: '',
        validate: (v) => {
            const errors: string[] = []
            const totalCharacters = findDraftLength(v)
            if (totalCharacters < 1) errors.push('Required')
            if (totalCharacters > 5000) errors.push('Must be less than 5K characters')
            return errors
        },
    })
    const [mentions, setMentions] = useState<any[]>([])
    const [urls, setUrls] = useState<any[]>([])
    const [urlsMetaData, setUrlsMetaData] = useState<any[]>([])
    const [images, setImages] = useState<any[]>([])
    const [audio, setAudio] = useState<File>()
    const [saved, setSaved] = useState(false)
    const [spacesModalOpen, setSpacesModalOpen] = useState(false)
    const [imagesModalOpen, setImagesModalOpen] = useState(false)
    const [audioModalOpen, setAudioModalOpen] = useState(false)
    const cookies = new Cookies()
    const urlRequestIndex = useRef(0)

    function closeModal() {
        setCreatePostModalOpen(false)
        setCreatePostModalSettings({ type: 'text' })
    }

    function scrapeUrlMetaData(url) {
        setUrlsMetaData((us) => [...us, { url, loading: true }])
        axios.get(`${config.apiURL}/scrape-url?url=${url}`).then((res) => {
            setUrlsMetaData((us) => {
                const newUrlsMetaData = [...us.filter((u) => u.url !== url)]
                newUrlsMetaData.push({ url, loading: false, ...res.data })
                return newUrlsMetaData
            })
        })
    }

    function removeUrlMetaData(url) {
        setUrlsMetaData((us) => [...us.filter((u) => u.url !== url)])
    }

    function createPost() {
        console.log('create post!')
        setSaved(true)
        setTimeout(() => closeModal(), 1000)
    }

    useEffect(() => {
        console.log('first useeffect')
    }, [])

    // grab metadata for new urls when added to text
    useEffect(() => {
        if (urlsMetaData.length <= 5) {
            // requestIndex used to pause requests until user has finished updating the url
            urlRequestIndex.current += 1
            const requestIndex = urlRequestIndex.current
            setTimeout(() => {
                if (urlRequestIndex.current === requestIndex) {
                    urls.forEach(
                        (url) => !urlsMetaData.find((u) => u.url === url) && scrapeUrlMetaData(url)
                    )
                }
            }, 500)
        }
    }, [urls])

    return (
        <Modal className={styles.wrapper} close={closeModal} centered confirmClose={!saved}>
            {saved ? (
                <SuccessMessage text='Post created!' />
            ) : (
                <Column centerX style={{ width: '100%' }}>
                    <h1>New post</h1>
                    <Column className={styles.postCard}>
                        <Row centerY className={styles.header}>
                            <ImageTitle
                                type='user'
                                imagePath={accountData.flagImagePath}
                                imageSize={32}
                                title={accountData.name}
                                style={{ marginRight: 5 }}
                                shadow
                            />
                            <PostSpaces spaces={spaces} preview />
                            <p className='grey'>now</p>
                            <button
                                className={styles.addSpacesButton}
                                type='button'
                                title='Click to add spaces'
                                onClick={() => setSpacesModalOpen(true)}
                            >
                                + Spaces
                            </button>
                        </Row>
                        <Column className={styles.content}>
                            {['event', 'glass-bead-game'].includes(postType) && <h2>Title!</h2>}
                            <DraftTextEditor
                                type='post'
                                stringifiedDraft={text.value}
                                maxChars={5000}
                                state={text.state}
                                errors={text.errors}
                                onChange={(value, textMentions, textUrls) => {
                                    setText({ ...text, value, state: 'default' })
                                    setMentions(textMentions)
                                    setUrls(textUrls)
                                }}
                            />
                            {postType === 'image' && <Images images={images} />}
                            {postType === 'audio' && audio && (
                                <Audio
                                    key={audio.lastModified}
                                    id={0}
                                    url={URL.createObjectURL(audio)}
                                    location='create-post-audio'
                                />
                            )}
                            {urlsMetaData.map((u) => (
                                <UrlPreview
                                    key={u.url}
                                    urlData={u}
                                    loading={u.loading}
                                    removeUrl={removeUrlMetaData}
                                    style={{ marginTop: 10 }}
                                />
                            ))}
                        </Column>
                    </Column>
                    <Row className={styles.contentButtons}>
                        <button
                            type='button'
                            title='Add images'
                            onClick={() => setImagesModalOpen(true)}
                        >
                            <ImageIcon />
                        </button>
                        <button
                            type='button'
                            title='Add audio'
                            onClick={() => setAudioModalOpen(true)}
                        >
                            <AudioIcon />
                        </button>
                        <button
                            type='button'
                            title='Add event'
                            onClick={() => setPostType('event')}
                        >
                            <CalendarIcon />
                        </button>
                        <button type='button' title='Add poll' onClick={() => null}>
                            <InquiryIcon />
                        </button>
                        <button type='button' title='Add glass bead game' onClick={() => null}>
                            <CastaliaIcon />
                        </button>
                    </Row>
                    <Button text='Create post' color='blue' onClick={createPost} />
                </Column>
            )}
            {spacesModalOpen && (
                <AddPostSpacesModal
                    spaces={spaces}
                    setSpaces={setSpaces}
                    close={() => setSpacesModalOpen(false)}
                />
            )}
            {imagesModalOpen && (
                <AddPostImagesModal
                    images={images}
                    setImages={setImages}
                    setPostType={setPostType}
                    close={() => setImagesModalOpen(false)}
                />
            )}
            {audioModalOpen && (
                <AddPostAudioModal
                    audio={audio}
                    setAudio={setAudio}
                    setPostType={setPostType}
                    close={() => setAudioModalOpen(false)}
                />
            )}
        </Modal>
    )
}

export default CreatePostModal
