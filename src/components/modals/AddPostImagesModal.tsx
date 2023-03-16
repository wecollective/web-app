import Button from '@components/Button'
import CloseButton from '@components/CloseButton'
import Column from '@components/Column'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import { imageMBLimit, totalMBUploadLimit } from '@src/Helpers'
import styles from '@styles/components/modals/AddPostImagesModal.module.scss'
import { ChevronLeftIcon, ChevronRightIcon } from '@svgs/all'
import React, { useState } from 'react'
import Cookies from 'universal-cookie'
import { v4 as uuidv4 } from 'uuid'

const AddPostImagesModal = (props: {
    images: any[]
    setImages: (images: any[]) => void
    close: () => void
}): JSX.Element => {
    const { images, setImages, close } = props
    const [newImages, setNewImages] = useState<any[]>(images)
    const [imageURL, setImageURL] = useState('')
    const [imageSizeError, setImageSizeError] = useState(false)
    const [toalImageSizeError, setTotalImageSizeError] = useState(false)
    const [imagePostError, setImagePostError] = useState(false)
    const cookies = new Cookies()

    function addImageFiles() {
        setImageSizeError(false)
        setImagePostError(false)
        const input = document.getElementById('post-images-file-input') as HTMLInputElement
        if (input && input.files && input.files.length) {
            for (let i = 0; i < input.files.length; i += 1) {
                if (input.files[i].size > imageMBLimit * 1024 * 1024) setImageSizeError(true)
                else
                    setNewImages((img) => [
                        ...img,
                        { id: uuidv4(), file: input && input.files && input.files[i] },
                    ])
            }
        }
    }

    function addImageURL() {
        setNewImages([...newImages, { id: uuidv4(), url: imageURL }])
        setImageURL('')
        setImageSizeError(false)
        setImagePostError(false)
    }

    function removeImage(index) {
        setNewImages([...newImages.filter((image, i) => i !== index)])
    }

    function moveImage(index, increment) {
        const newImageArray = [...newImages]
        const image = newImageArray[index]
        newImageArray.splice(index, 1)
        newImageArray.splice(index + increment, 0, image)
        setNewImages(newImageArray)
    }

    function updateCaption(index, value) {
        const newImageArray = [...newImages]
        newImageArray[index].caption = value
        setNewImages(newImageArray)
    }

    function findTotalImageMBs() {
        const megaByte = 1048576
        const totalBytes = newImages
            .filter((i) => i.file)
            .map((i) => i.file.size)
            .reduce((a, b) => a + b, 0)
        return +(totalBytes / megaByte).toFixed(2)
    }

    function saveImages() {
        if (findTotalImageMBs() >= totalMBUploadLimit) setTotalImageSizeError(true)
        else {
            setImages(
                newImages.map((image, index) => {
                    return { ...image, index }
                })
            )
            close()
        }
    }

    return (
        <Modal centered close={close} style={{ overflow: 'unset' }}>
            <h1>Add images</h1>
            <Column centerX style={{ width: '100%', marginBottom: 30 }}>
                {imagePostError && (
                    <p className='danger' style={{ marginBottom: 10 }}>
                        No images added yet
                    </p>
                )}
                <Row centerX style={{ width: '100%' }}>
                    {newImages.length > 0 && (
                        <Scrollbars className={styles.images}>
                            <Row>
                                {newImages.map((image, index) => (
                                    <Column centerX className={styles.image} key={image.id}>
                                        <CloseButton size={20} onClick={() => removeImage(index)} />
                                        <img
                                            src={image.url || URL.createObjectURL(image.file)}
                                            alt=''
                                        />
                                        <Row centerY style={{ width: 220 }}>
                                            <Input
                                                type='text'
                                                placeholder='add caption...'
                                                value={image.caption}
                                                onChange={(v) => updateCaption(index, v)}
                                            />
                                        </Row>
                                        <Row centerX className={styles.itemFooter}>
                                            {index !== 0 && (
                                                <button
                                                    type='button'
                                                    onClick={() => moveImage(index, -1)}
                                                >
                                                    <ChevronLeftIcon />
                                                </button>
                                            )}
                                            {index < newImages.length - 1 && (
                                                <button
                                                    type='button'
                                                    onClick={() => moveImage(index, 1)}
                                                >
                                                    <ChevronRightIcon />
                                                </button>
                                            )}
                                        </Row>
                                    </Column>
                                ))}
                            </Row>
                        </Scrollbars>
                    )}
                </Row>
                {imageSizeError && (
                    <p className='danger' style={{ marginBottom: 10 }}>
                        Max file size: {imageMBLimit}MB
                    </p>
                )}
                {toalImageSizeError && (
                    <p className='danger' style={{ marginBottom: 10 }}>
                        Total image upload size must be less than {totalMBUploadLimit}
                        MB. (Current size: {findTotalImageMBs()}MB)
                    </p>
                )}
                <Row className={styles.fileUploadInput}>
                    <label htmlFor='post-images-file-input'>
                        Upload images
                        <input
                            type='file'
                            id='post-images-file-input'
                            accept='.png, .jpg, .jpeg, .gif'
                            onChange={addImageFiles}
                            multiple
                            hidden
                        />
                    </label>
                </Row>
                <p>or paste an image URL:</p>
                <Row style={{ marginTop: 5 }}>
                    <Input
                        type='text'
                        placeholder='image url...'
                        value={imageURL}
                        onChange={(v) => setImageURL(v)}
                        style={{ margin: '0 10px 10px 0' }}
                    />
                    <Button
                        text='Add'
                        color='aqua'
                        disabled={imageURL === ''}
                        onClick={addImageURL}
                    />
                </Row>
            </Column>
            <Button text='Save images' color='blue' onClick={saveImages} />
        </Modal>
    )
}

export default AddPostImagesModal
