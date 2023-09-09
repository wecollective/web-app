import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { dateCreated, findDraftLength, timeSinceCreated, timeSinceCreatedShort } from '@src/Helpers'
import PostSpaces from '@src/components/cards/PostCard/PostSpaces'
import UrlPreview from '@src/components/cards/PostCard/UrlCard'
import styles from '@styles/components/modals/EditPostModal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

function EditPostModal(props: {
    postData: any
    setPostData: (data: any) => void
    close: () => void
}): JSX.Element {
    const { postData, setPostData, close } = props
    const { accountData } = useContext(AccountContext)
    const [title, setTitle] = useState(postData.title)
    const [showTitle, setShowTitle] = useState(true)
    const [text, setText] = useState(postData.text)
    const [mentions, setMentions] = useState<any[]>([])
    const [urls, setUrls] = useState<any[]>([])
    const [urlsWithMetaData, setUrlsWithMetaData] = useState<any[]>(postData.Urls)
    const [textError, setTextError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const urlRequestIndex = useRef(0)
    const cookies = new Cookies()
    const mobileView = document.documentElement.clientWidth < 900
    const maxUrls = 5

    function scrapeUrlMetaData(url) {
        setUrlsWithMetaData((us) => [...us, { url, loading: true }])
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        axios
            .get(`${config.apiURL}/scrape-url?url=${url}`, options)
            .then((res) => {
                setUrlsWithMetaData((us) => {
                    const newUrlsMetaData = [...us.filter((u) => u.url !== url)]
                    newUrlsMetaData.push({ url, loading: false, ...res.data })
                    return newUrlsMetaData
                })
            })
            .catch((error) => console.log(error))
    }

    function removeUrlMetaData(url) {
        setUrlsWithMetaData((us) => [...us.filter((u) => u.url !== url)])
    }

    function textValid() {
        const totalChars = findDraftLength(text)
        if (totalChars > 5000) {
            setTextError('Text must be less than 5K characters')
            return false
        }
        const noText = !totalChars && !title
        const textPostWithUrls = postData.type === 'text' && urlsWithMetaData.length
        const textRequired = ['text', 'event', 'poll'].includes(postData.type) && !textPostWithUrls
        if (textRequired && noText) {
            setTextError(`Title or text required for ${postData.type} posts`)
            return false
        }
        return true
    }

    function saveChanges() {
        if (textValid()) {
            console.log('urlsWithMetaData: ', urlsWithMetaData)
            console.log('mentions: ', mentions)
            if (false) {
                setLoading(true)
                const options = {
                    headers: { Authorization: `Bearer ${cookies.get('accessToken')}` },
                }
                const data = {
                    postId: postData.id,
                    title,
                    text,
                    mentions: mentions.map((m) => m.link),
                    urls: urlsWithMetaData,
                    // todo: get these details server side
                    creatorName: accountData.name,
                    creatorHandle: accountData.handle,
                }
                axios
                    .post(`${config.apiURL}/update-post`, data, options)
                    .then(() => {
                        setPostData({
                            ...postData,
                            title,
                            text,
                            // Urls: urlsWithMetaData,
                            updatedAt: new Date().toISOString(),
                        })
                        setSuccess(true)
                        setLoading(false)
                        setTimeout(() => close(), 1000)
                    })
                    .catch((error) => console.log(error))
            }
        }
    }

    // grab metadata for new urls when added to text
    useEffect(() => {
        if (urlsWithMetaData.length <= maxUrls) {
            // requestIndex used to pause requests until user has finished updating the url
            urlRequestIndex.current += 1
            const requestIndex = urlRequestIndex.current
            setTimeout(() => {
                if (urlRequestIndex.current === requestIndex) {
                    urls.forEach(
                        (url) =>
                            !urlsWithMetaData.find((u) => u.url === url) && scrapeUrlMetaData(url)
                    )
                }
            }, 500)
        }
    }, [urls])

    return (
        <Modal className={styles.wrapper} close={close} centerX>
            {success ? (
                <SuccessMessage text='Changes saved' />
            ) : (
                <Column centerX style={{ width: '100%', maxWidth: 800 }}>
                    <h1>Edit post text</h1>
                    <Column className={styles.postCard}>
                        <Row spaceBetween centerY className={styles.header}>
                            <Row centerY>
                                <ImageTitle
                                    type='user'
                                    imagePath={accountData.flagImagePath}
                                    imageSize={32}
                                    title={accountData.name}
                                    style={{ marginRight: 5 }}
                                    shadow
                                />
                                <PostSpaces spaces={postData.DirectSpaces} preview />
                                <Row style={{ marginLeft: 2 }}>
                                    <p
                                        className='grey'
                                        title={`Posted at ${dateCreated(postData.createdAt)}`}
                                    >
                                        {mobileView
                                            ? timeSinceCreatedShort(postData.createdAt)
                                            : timeSinceCreated(postData.createdAt)}
                                    </p>
                                    {postData.createdAt !== postData.updatedAt && (
                                        <p
                                            className='grey'
                                            title={`Edited at ${dateCreated(postData.updatedAt)}`}
                                            style={{ paddingLeft: 5 }}
                                        >
                                            *
                                        </p>
                                    )}
                                </Row>
                            </Row>
                            <Row>
                                <p className='grey'>ID:</p>
                                <p style={{ marginLeft: 5 }}>{postData.id}</p>
                            </Row>
                        </Row>
                        {showTitle && (
                            <Row centerY spaceBetween className={styles.title}>
                                <input
                                    placeholder='Title...'
                                    type='text'
                                    value={title}
                                    maxLength={100}
                                    onChange={(e) => {
                                        setTitle(e.target.value)
                                        setTextError('')
                                    }}
                                />
                                <CloseButton
                                    size={20}
                                    onClick={() => {
                                        setTitle('')
                                        setShowTitle(false)
                                        setTextError('')
                                    }}
                                />
                            </Row>
                        )}
                        <DraftTextEditor
                            type='post'
                            stringifiedDraft={text}
                            maxChars={5000}
                            onChange={(value, textMentions, textUrls) => {
                                setTextError('')
                                setText(value)
                                setMentions(textMentions)
                                setUrls(textUrls.slice(0, maxUrls))
                            }}
                        />
                        {urlsWithMetaData.map((u) => (
                            <UrlPreview
                                key={u.url}
                                type='post'
                                urlData={u}
                                loading={u.loading}
                                remove={removeUrlMetaData}
                                style={{ marginTop: 10 }}
                            />
                        ))}
                    </Column>
                    {textError && (
                        <p className='danger' style={{ marginBottom: 20 }}>
                            {textError}
                        </p>
                    )}
                    <Button
                        color='blue'
                        text='Save changes'
                        disabled={loading || urlsWithMetaData.find((u) => u.loading)}
                        loading={loading}
                        onClick={saveChanges}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default EditPostModal
