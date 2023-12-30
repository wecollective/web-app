import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import SuccessMessage from '@components/SuccessMessage'
import PostSpaces from '@components/cards/PostCard/PostSpaces'
import UrlPreview from '@components/cards/PostCard/UrlCard'
import DraftTextEditor from '@components/draft-js/DraftTextEditor'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import {
    dateCreated,
    findDraftLength,
    findSearchableText,
    findUrlSearchableText,
    maxPostChars,
    maxUrls,
    scrapeUrl,
    timeSinceCreated,
    timeSinceCreatedShort,
} from '@src/Helpers'
import styles from '@styles/components/modals/EditPostModal.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

function EditPostModal(props: {
    post: any
    setPost: (data: any) => void
    close: () => void
}): JSX.Element {
    const { post, setPost, close } = props
    const { accountData } = useContext(AccountContext)
    const [urlsLoading, setUrlsLoading] = useState(true)
    const [title, setTitle] = useState(post.title)
    const [showTitle, setShowTitle] = useState(post.type === 'post')
    const [text, setText] = useState(post.text)
    const [mentions, setMentions] = useState<any[]>([])
    const [rawUrls, setRawUrls] = useState<any[]>([])
    const [urls, setUrls] = useState<any[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const cookies = new Cookies()
    const mobileView = document.documentElement.clientWidth < 900

    function getUrls() {
        axios
            .get(`${config.apiURL}/post-urls?postId=${post.id}`)
            .then((res) => {
                setRawUrls(res.data.map((urlBlock) => urlBlock.Url.url))
                setUrls(
                    res.data.map((urlBlock) => {
                        return {
                            ...urlBlock.Url,
                            searchableText: findUrlSearchableText(urlBlock.Url),
                        }
                    })
                )
                setUrlsLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function removeUrl(url) {
        setUrls((us) => [...us.filter((u) => u.url !== url)])
    }

    function saveDisabled() {
        const totalChars = text ? findDraftLength(text) : 0
        const overMaxChars = totalChars > maxPostChars
        const unchanged =
            (post.text === text || (!post.text && !totalChars)) &&
            (post.title === title || (!post.title && !title))
        return loading || overMaxChars || unchanged || urls.find((u) => u.loading)
    }

    function findNewMediaTypes() {
        const { mediaTypes } = post
        let newTypes = mediaTypes.split(',')
        // remove url
        if (mediaTypes.includes('url') && !urls.length)
            newTypes = newTypes.filter((t) => t !== 'url')
        // add url
        if (!mediaTypes.includes('url') && urls.length) newTypes.push('url')
        // remove text
        const noText = !findDraftLength(text) && !title
        if (mediaTypes.includes('text') && noText) newTypes = newTypes.filter((t) => t !== 'text')
        // add text
        if (!mediaTypes.includes('text') && !noText) newTypes.push('text')
        return newTypes
    }

    function save() {
        setLoading(true)
        const newTypes = findNewMediaTypes()
        if (!newTypes.length) {
            setErrors(['text required'])
            setLoading(false)
        } else {
            // structure data
            const newPost = {
                id: post.id,
                mediaTypes: newTypes.join(','),
                text: findDraftLength(text) ? text : null,
                title: title || null,
                mentions: mentions.map((m) => m.id),
                urls,
            } as any
            newPost.searchableText = findSearchableText(newPost)
            // upload post
            const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
            axios
                .post(`${config.apiURL}/update-post`, newPost, options)
                .then(() => {
                    setPost({
                        ...post,
                        title: newPost.title,
                        text: newPost.text,
                        mediaTypes: newPost.mediaTypes,
                        updatedAt: new Date().toISOString(),
                    })
                    setSaved(true)
                    setLoading(false)
                    setTimeout(() => close(), 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => {
        if (post.mediaTypes.includes('url')) getUrls()
        else setUrlsLoading(false)
    }, [])

    // grab metadata for new urls added to text field
    const requestIndex = useRef(0)
    useEffect(() => {
        const urlLimit = post.type === 'bead' ? 1 : maxUrls
        const blockUrlsOnTextBead = post.type === 'bead' && post.mediaTypes !== 'url'
        if (!blockUrlsOnTextBead && !urlsLoading && urls.length <= urlLimit) {
            // requestIndex & setTimeout used to block requests until user has finished typing
            requestIndex.current += 1
            const index = requestIndex.current
            setTimeout(() => {
                if (requestIndex.current === index) {
                    rawUrls.forEach(async (url) => {
                        // if no match in urls array
                        if (!urls.find((u) => u.url === url)) {
                            // add url loading state
                            setUrls((us) => [...us, { url, loading: true }])
                            // scrape url data
                            const { data } = await scrapeUrl(url)
                            // todo: handle error
                            if (data) {
                                data.url = url
                                data.searchableText = findUrlSearchableText(data)
                                data.new = true
                                // update urls array
                                setUrls((us) => {
                                    const newUrls = [...us.filter((u) => u.url !== url)]
                                    newUrls.push(data)
                                    return newUrls
                                })
                            }
                        }
                    })
                }
            }, 500)
        }
    }, [rawUrls])

    return (
        <Modal className={styles.wrapper} close={close} centerX>
            {saved ? (
                <SuccessMessage text='Changes saved' />
            ) : (
                <Column centerX style={{ width: '100%', maxWidth: 800 }}>
                    <h1>Edit text</h1>
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
                                {post.type === 'post' && (
                                    <PostSpaces spaces={post.DirectSpaces} preview />
                                )}
                                <Row style={{ marginLeft: 2 }}>
                                    <p
                                        className='grey'
                                        title={`Posted at ${dateCreated(post.createdAt)}`}
                                    >
                                        {mobileView
                                            ? timeSinceCreatedShort(post.createdAt)
                                            : timeSinceCreated(post.createdAt)}
                                    </p>
                                    {post.createdAt !== post.updatedAt && (
                                        <p
                                            className='grey'
                                            title={`Edited at ${dateCreated(post.updatedAt)}`}
                                            style={{ paddingLeft: 5 }}
                                        >
                                            *
                                        </p>
                                    )}
                                </Row>
                            </Row>
                            <Row>
                                <p className='grey'>ID:</p>
                                <p style={{ marginLeft: 5 }}>{post.id}</p>
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
                                        setErrors([])
                                    }}
                                />
                                <CloseButton
                                    size={20}
                                    onClick={() => {
                                        setTitle('')
                                        setShowTitle(false)
                                        setErrors([])
                                    }}
                                />
                            </Row>
                        )}
                        <DraftTextEditor
                            type='post'
                            text={text}
                            maxChars={maxPostChars}
                            onChange={(value, textMentions, textUrls) => {
                                setErrors([])
                                setText(value)
                                setMentions(textMentions)
                                setRawUrls(textUrls.slice(0, maxUrls))
                            }}
                        />
                        {urls.map((url) => (
                            <UrlPreview
                                key={url.url}
                                type='post'
                                urlData={url}
                                loading={url.loading}
                                remove={removeUrl}
                                style={{ marginTop: 10 }}
                            />
                        ))}
                    </Column>
                    {errors.length > 0 && (
                        <p className='danger' style={{ marginBottom: 20 }}>
                            {errors[0]}
                        </p>
                    )}
                    <Button
                        color='blue'
                        text='Save changes'
                        disabled={saveDisabled()}
                        loading={loading}
                        onClick={save}
                    />
                </Column>
            )}
        </Modal>
    )
}

export default EditPostModal
