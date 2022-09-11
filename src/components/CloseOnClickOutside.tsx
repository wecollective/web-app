import Button from '@components/Button'
import Modal from '@components/modals/Modal'
import Row from '@components/Row'
import React, { useEffect, useRef, useState } from 'react'

const CloseOnClickOutside = (props: {
    onClick: () => void
    confirmClose?: boolean
    children: JSX.Element
}): JSX.Element => {
    const { onClick, confirmClose, children } = props
    const ref = useRef<HTMLDivElement>(null)
    const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)

    function handleClickOutside(e) {
        const { current } = ref
        if (current && !current.contains(e.target)) {
            if (confirmClose) setConfirmationModalOpen(true)
            else onClick()
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    })

    return (
        <div ref={ref}>
            {children}
            {confirmationModalOpen && (
                <Modal close={() => setConfirmationModalOpen(false)} centered>
                    <h1>Are you sure you want to exit the modal?</h1>
                    <p>All entered data will be lost.</p>
                    <Row centerX style={{ marginTop: 10 }}>
                        <Button
                            text='Yes'
                            color='red'
                            onClick={onClick}
                            style={{ marginRight: 10 }}
                        />
                        <Button
                            text='No'
                            color='blue'
                            onClick={() => setConfirmationModalOpen(false)}
                        />
                    </Row>
                </Modal>
            )}
        </div>
    )
}

CloseOnClickOutside.defaultProps = {
    confirmClose: false,
}

export default CloseOnClickOutside
