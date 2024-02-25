/* eslint-disable react/function-component-definition */
import { GameData } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import React, { FC, useContext } from 'react'
import { Socket } from 'socket.io-client'
import ImageUploadModal from './ImageUploadModal'

const GameTopicImageModal: FC<{
    roomId: number
    gameData: GameData
    onClose: () => void
    socket: Socket
}> = ({ roomId, gameData, onClose, socket }) => {
    const { accountData } = useContext(AccountContext)

    function signalNewTopicImage(url) {
        socket.emit('outgoing-new-topic-image', {
            roomId,
            userSignaling: {
                id: accountData.id,
                handle: accountData.handle,
                name: accountData.name || 'Anonymous',
                flagImagePath: accountData.flagImagePath,
            },
            gameData,
            url,
        })
    }
    return (
        <ImageUploadModal
            type='gbg-topic'
            shape='circle'
            id={gameData.id}
            title='Add a new topic image'
            onSave={(imageURL) => signalNewTopicImage(imageURL)}
            onClose={onClose}
        />
    )
}

export default GameTopicImageModal
