/* eslint-disable react/function-component-definition */
import config from '@src/Config'
import { GameData, Post } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import axios from 'axios'
import React, { FC, useContext, useState } from 'react'
import { Socket } from 'socket.io-client'
import Button from '../Button'
import Input from '../Input'
import Modal from './Modal'

const GameTopicModal: FC<{
    onClose: () => void
    roomId: number
    post: Post
    gameData: GameData
    socket: Socket
}> = ({ onClose, roomId, post, gameData, socket }) => {
    const [newTopic, setNewTopic] = useState('')
    const { accountData } = useContext(AccountContext)

    async function saveNewTopic(e) {
        e.preventDefault()
        await axios.post(`${config.apiURL}/save-gbg-topic`, {
            postId: post.id,
            gameId: gameData.id,
            newTopic,
        })
        socket.emit('outgoing-new-topic-text', {
            roomId,
            userSignaling: {
                id: accountData.id,
                handle: accountData.handle,
                name: accountData.name || 'Anonymous',
                flagImagePath: accountData.flagImagePath,
            },
            gameData,
            newTopicText: newTopic,
        })
        onClose()
    }

    return (
        <Modal centerX close={onClose}>
            <h1>Change the topic</h1>
            <p>Current topic: {post.title}</p>
            <form onSubmit={saveNewTopic}>
                <Input
                    type='text'
                    placeholder='new topic...'
                    value={newTopic}
                    onChange={(v) => setNewTopic(v)}
                    style={{ marginBottom: 30 }}
                />
                <Button text='Save' color='blue' disabled={!newTopic} submit />
            </form>
        </Modal>
    )
}

export default GameTopicModal
