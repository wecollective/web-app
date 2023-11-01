import Button from '@components/Button'
import Column from '@components/Column'
import Input from '@components/Input'
import Modal from '@components/modals/Modal'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { imageMBLimit } from '@src/Helpers'
import styles from '@styles/components/modals/CreateStreamModal.module.scss'
import { ImageIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'

function ToyBoxRowModal(props: { close: () => void }): JSX.Element {
    const { close } = props
    const { toyBoxRow, setToyBoxRow, toyBoxRowRef } = useContext(AccountContext)
    const [imageFile, setImageFile] = useState<any>(null)
    const [imageURL, setImageURL] = useState<any>(toyBoxRow.image || '')
    const [name, setName] = useState(toyBoxRow.name || '')
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()

    function addImage() {
        const input = document.getElementById('stream-image-file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            if (input.files[0].size > imageMBLimit * 1024 * 1024) {
                // todo: display error
                input.value = ''
            } else {
                setImageFile(input.files[0])
                setImageURL(URL.createObjectURL(input.files[0]))
            }
        }
    }

    function saveRow() {
        setLoading(true)
        const options = { headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
        const data = { rowId: toyBoxRow.id, indexId: toyBoxRow.index, name }
        const formData = new FormData()
        if (imageFile) formData.append('file', imageFile)
        formData.append('data', JSON.stringify(data))
        axios
            .post(`${config.apiURL}/edit-toybox-row`, formData, options)
            .then((res) => {
                const { newRow } = res.data
                if (newRow) {
                    toyBoxRowRef.current = newRow
                    setToyBoxRow(newRow)
                } else {
                    toyBoxRowRef.current = { ...toyBoxRow, name, image: imageURL }
                    setToyBoxRow({ ...toyBoxRow, name, image: imageURL })
                }
                close()
            })
            .catch((error) => console.log(error))
    }

    return (
        <Modal centerX close={close} className={styles.wrapper}>
            <Column centerX style={{ width: 260 }}>
                <h1>Edit row</h1>
                <Column centerX centerY className={styles.image}>
                    {imageURL && <img src={imageURL} alt='' />}
                    <ImageIcon />
                    <label htmlFor='stream-image-file-input'>
                        <input
                            type='file'
                            id='stream-image-file-input'
                            accept='.png, .jpg, .jpeg, .gif'
                            onChange={addImage}
                            hidden
                        />
                    </label>
                </Column>
                <Input
                    type='text'
                    title='Name'
                    placeholder='name...'
                    value={name}
                    maxLength={30}
                    onChange={(v) => setName(v)}
                    style={{ marginBottom: 30 }}
                />
                <Button
                    text='Save row'
                    color='blue'
                    disabled={loading}
                    loading={loading}
                    onClick={saveRow}
                    style={{ marginTop: 30 }}
                />
            </Column>
        </Modal>
    )
}

export default ToyBoxRowModal
