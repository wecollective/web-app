import Button from '@components/Button'
import Modal from '@components/modals/Modal'
import React from 'react'

function AlertModal({
    message,
    onClose,
    onLogin,
}: {
    message: string
    onClose: () => void
    onLogin: () => void
}): JSX.Element {
    return (
        <Modal close={onClose} centerX centerY>
            <h1 style={{ textAlign: 'center', maxWidth: 600 }}>{message}</h1>
            {message.includes('Log in') ? (
                <Button
                    text='Log in'
                    color='blue'
                    onClick={() => {
                        onLogin()
                        onClose()
                    }}
                />
            ) : (
                <Button text='Ok' color='blue' onClick={onClose} />
            )}
        </Modal>
    )
}

export default AlertModal
