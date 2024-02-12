/* eslint-disable react/function-component-definition */
/* eslint-disable no-nested-ternary */
import Button from '@components/Button'
import Input from '@components/Input'
import Row from '@components/Row'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import styles from '@styles/components/modals/GBGBackgroundModal.module.scss'
import axios from 'axios'
import getYouTubeID from 'get-youtube-id'
import React, { FC, useContext, useState } from 'react'
import { Socket } from 'socket.io-client'
import Cookies from 'universal-cookie'
import Modal from './Modal'

const getVideoId = (url: string) => (url.match(/^\w+$/) ? url : getYouTubeID(url))

const GameBackgroundModal: FC<{
    gameData: any
    roomId: number
    socket: Socket
    onClose: () => void
}> = ({ gameData, roomId, socket, onClose }) => {
    const [imageFile, setImageFile] = useState<File>()
    const [imageURL, setImageURL] = useState('')
    const [videoURL, setVideoURL] = useState('')
    const videoId = getVideoId(videoURL)
    const [videoStartTime, setVideoStartTime] = useState(0)
    const [imagePreviewURL, setImagePreviewURL] = useState('')
    const [preview, setPreview] = useState<'image' | 'video'>()
    const [fileSizeError, setFileSizeError] = useState(false)
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()
    const { accountData } = useContext(AccountContext)

    function resetState() {
        setImageFile(undefined)
        setImageURL('')
        setVideoURL('')
        setImagePreviewURL('')
        setFileSizeError(false)
    }

    function removeInputFiles() {
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input) input.value = ''
    }

    function selectImageFile() {
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            setPreview(undefined)
            resetState()
            if (input.files[0].size > imageMBLimit * 1024 * 1024) {
                setFileSizeError(true)
                removeInputFiles()
            } else {
                setImageFile(input.files[0])
                setImagePreviewURL(URL.createObjectURL(input.files[0]))
                setPreview('image')
            }
        }
    }

    function selectImageURL(url) {
        setPreview(undefined)
        resetState()
        removeInputFiles()
        setImageURL(url)
        setImagePreviewURL(url)
        if (url.length > 0) {
            setPreview('image')
        }
    }

    function selectVideoURL(url) {
        setPreview(undefined)
        resetState()
        removeInputFiles()
        setVideoURL(url)
        setPreview('video')
    }

    async function saveBackground() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        let data
        let signalData
        if (imageFile) {
            data = new FormData()
            data.append('image', imageFile)
            options.headers['Content-Type'] = 'multipart/form-data'
            signalData = {
                type: 'image',
            }
        } else if (imageURL) {
            data = { imageURL }
            signalData = {
                type: 'image',
                url: imageURL,
            }
        } else {
            data = {
                id: gameData.id,
                videoURL: videoId,
                videoStartTime,
            }
            signalData = {
                type: 'video',
                url: videoId,
                startTime: videoStartTime,
            }
        }

        const res = await axios.post(
            `${config.apiURL}/gbg-background?gameId=${gameData.id}`,
            data,
            options
        )

        socket.emit('outgoing-new-background', {
            roomId,
            userSignaling: {
                id: accountData.id,
                handle: accountData.handle,
                name: accountData.name || 'Anonymous',
                flagImagePath: accountData.flagImagePath,
            },
            gameData,
            ...signalData,
            url: signalData.url || res.data.imageURL,
        })
        setLoading(false)
        onClose()
    }

    return (
        <Modal centerX close={onClose} style={{ textAlign: 'center' }}>
            <h1>Add a new background</h1>
            {preview === 'image' ? (
                <img
                    id='image-preview'
                    className={`${styles.imagePreview} ${styles.square}`}
                    src={imagePreviewURL}
                    alt=''
                />
            ) : preview === 'video' && videoId ? (
                <iframe
                    className={styles.videoPreview}
                    id='videoBackground'
                    title='video background'
                    src={`https://www.youtube.com/embed/${videoId}?t=9&autoplay=1&mute=1&enablejsapi=1`}
                />
            ) : null}
            <p>Upload an image from your device</p>
            {fileSizeError && <p>Image too large. Max size: {imageMBLimit}MB</p>}
            <Row className={styles.fileUploadInput}>
                <label htmlFor='file-input'>
                    {imageFile ? 'Change' : 'Upload'} image
                    <input
                        type='file'
                        id='file-input'
                        accept='.png, .jpg, .jpeg, .gif'
                        onChange={selectImageFile}
                        hidden
                    />
                </label>
            </Row>
            <p>or paste an image URL:</p>
            <Input
                type='text'
                placeholder='image url...'
                value={imageURL}
                onChange={(url) => selectImageURL(url)}
                style={{ marginBottom: 30 }}
            />
            <p>or choose a YouTube video background</p>
            <Row centerY style={{ width: '100%', marginBottom: 30 }}>
                <Input
                    type='text'
                    placeholder='youtube video url or id...'
                    value={videoURL}
                    onChange={(url) => selectVideoURL(url)}
                    style={{ marginRight: 20 }}
                />
                <p style={{ flexShrink: 0 }}>Video start time:</p>
                <Input
                    type='text'
                    value={videoStartTime}
                    onChange={(v) => setVideoStartTime(+v.replace(/\D/g, ''))}
                    style={{ width: 120, marginLeft: 10 }}
                />
            </Row>
            <Button
                text='Save background'
                color='game-white'
                disabled={!imageURL && !imageFile && !videoURL}
                loading={loading}
                onClick={saveBackground}
            />
        </Modal>
    )
}

export default GameBackgroundModal
