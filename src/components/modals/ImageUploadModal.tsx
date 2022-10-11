import Button from '@components/Button'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import styles from '@styles/components/modals/ImageUploadModal.module.scss'
import axios from 'axios'
import React, { useState } from 'react'
import Cookies from 'universal-cookie'

const ImageUploadModal = (props: {
    type: 'user-flag' | 'user-cover' | 'space-flag' | 'space-cover' | 'gbg-topic' | 'gbg-background'
    shape: 'circle' | 'square' | 'rectangle'
    id: number
    title: string
    subTitle?: string
    onSaved?: (imageURL: string) => void
    close: () => void
}): JSX.Element => {
    const { type, shape, id, title, subTitle, onSaved, close } = props
    const [imageFile, setImageFile] = useState<File>()
    const [imageURL, setImageURL] = useState('')
    const [imagePreviewURL, setImagePreviewURL] = useState('')
    const [imageSizeError, setImageSizeError] = useState(false)
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()

    function selectImageFile() {
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            setImageURL('')
            if (input.files[0].size > imageMBLimit * 1024 * 1024) {
                setImageSizeError(true)
                setImagePreviewURL('')
                setImageFile(undefined)
                input.value = ''
            } else {
                setImageSizeError(false)
                setImageFile(input.files[0])
                setImagePreviewURL(URL.createObjectURL(input.files[0]))
            }
        }
    }

    function selectImageURL(url) {
        setImageSizeError(false)
        setImageURL(url)
        setImagePreviewURL(url)
        setImageFile(undefined)
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input) input.value = ''
    }

    function saveImage() {
        setLoading(true)
        const accessToken = cookies.get('accessToken')
        const options = { headers: { Authorization: `Bearer ${accessToken}` } }
        let data
        if (imageURL) data = { imageURL }
        else {
            data = new FormData()
            data.append('image', imageFile)
            options.headers['Content-Type'] = 'multipart/form-data'
        }
        axios
            .post(`${config.apiURL}/image-upload?type=${type}&id=${id}`, data, options)
            .then((res) => {
                if (onSaved) onSaved(imageURL || res.data.imageURL)
                setLoading(false)
                close()
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal close={close} centered>
            <h1>{title}</h1>
            {subTitle && <p>{subTitle}</p>}
            {imagePreviewURL && (
                <img
                    id='image-preview'
                    className={`${styles.imagePreview} ${styles[shape]}`}
                    src={imagePreviewURL}
                    alt=''
                />
            )}
            {imageSizeError && <p>Image too large. Max size: {imageMBLimit}MB</p>}
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
            <Button
                text='Save image'
                color='blue'
                disabled={!imageURL && !imageFile}
                loading={loading}
                onClick={saveImage}
            />
        </Modal>
    )
}

ImageUploadModal.defaultProps = {
    subTitle: null,
    onSaved: null,
}

export default ImageUploadModal
