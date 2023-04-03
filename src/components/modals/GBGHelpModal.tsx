/* eslint-disable no-underscore-dangle */
import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import React from 'react'

function GBGHelpModal(props: { close: () => void }): JSX.Element {
    const { close } = props

    return (
        <Modal centered close={close}>
            <h1>About The Glass Bead Game</h1>
            <Column>
                <p>Info about game...</p>
            </Column>
        </Modal>
    )
}

export default GBGHelpModal
