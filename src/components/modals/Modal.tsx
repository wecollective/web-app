import CloseButton from '@components/CloseButton'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import styles from '@styles/components/modals/Modal.module.scss'
import React from 'react'

function Modal(props: {
    close: () => void
    centered?: boolean
    confirmClose?: boolean
    className?: any
    style?: any
    children: any
}): JSX.Element {
    const { close, centered, confirmClose, className, style, children } = props

    const classes = [styles.modal]
    if (className) classes.unshift(className)
    if (centered) classes.push(styles.centered)

    return (
        <div className={`${styles.background} hide-scrollbars`}>
            <CloseOnClickOutside onClick={close} confirmClose={confirmClose}>
                <div className={`${classes.join(' ')} hide-scrollbars`} style={style}>
                    <div className={styles.closeButtonWrapper}>
                        <CloseButton size={20} onClick={close} />
                    </div>
                    {children}
                </div>
            </CloseOnClickOutside>
        </div>
    )
}

Modal.defaultProps = {
    centered: false,
    confirmClose: false,
    className: false,
    style: null,
}

export default Modal
