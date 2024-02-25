import Button from '@components/Button'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import { UserContext } from '@contexts/UserContext'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import styles from '@styles/components/modals/ImageUploadModal.module.scss'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function ImageUploadModal(): JSX.Element {
    const { setImageUploadModalOpen, imageUploadType, accountData, setAccountData } =
        useContext(AccountContext)
    const { spaceData, setSpaceData } = useContext(SpaceContext)
    const { userData, setUserData } = useContext(UserContext)
    const [imageFile, setImageFile] = useState<File>()
    const [imageURL, setImageURL] = useState('')
    const [imagePreviewURL, setImagePreviewURL] = useState('')
    const [imageSizeError, setImageSizeError] = useState(false)
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()

    const shape = imageUploadType.includes('cover') ? 'rectangle' : 'circle'
    const title = `Upload a new ${imageUploadType.includes('cover') ? 'cover' : 'flag'} image`

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

    function updateUI(imagePath) {
        if (imageUploadType.includes('user')) {
            if (imageUploadType.includes('cover')) {
                setAccountData({ ...accountData, coverImagePath: imagePath })
                setUserData({ ...userData, coverImagePath: imagePath })
            } else {
                setAccountData({ ...accountData, flagImagePath: imagePath })
                setUserData({ ...userData, flagImagePath: imagePath })
            }
        } else if (imageUploadType.includes('cover'))
            setSpaceData({ ...spaceData, coverImagePath: imagePath })
        else setSpaceData({ ...spaceData, flagImagePath: imagePath })
    }

    function saveImage() {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        let data
        if (imageURL) data = { imageURL }
        else {
            data = new FormData()
            data.append('image', imageFile)
            options.headers['Content-Type'] = 'multipart/form-data'
        }
        const id = imageUploadType.includes('space') ? spaceData.id : userData.id
        axios
            .post(`${config.apiURL}/image-upload?type=${imageUploadType}&id=${id}`, data, options)
            .then((res) => {
                updateUI(imageURL || res.data.imageURL)
                setLoading(false)
                setImageUploadModalOpen(false)
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal close={() => setImageUploadModalOpen(false)} centerX>
            <h1>{title}</h1>
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
