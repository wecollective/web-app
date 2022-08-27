import CloseButton from '@components/CloseButton'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import styles from '@styles/components/Modal.module.scss'
import React from 'react'

const Modal = (props: {
    close: () => void
    centered?: boolean
    className?: any
    style?: any
    children: any
}): JSX.Element => {
    const { close, centered, className, style, children } = props

    const classes = [styles.modal]
    if (className) classes.unshift(className)
    if (centered) classes.push(styles.centered)

    return (
        <div className={`${styles.background} hide-scrollbars`}>
            <CloseOnClickOutside onClick={close}>
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
    className: false,
    style: null,
}

export default Modal
