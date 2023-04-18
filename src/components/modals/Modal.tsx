import CloseButton from '@components/CloseButton'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Column from '@components/Column'
import styles from '@styles/components/modals/Modal.module.scss'
import React from 'react'

function Modal(props: {
    close: () => void
    centerY?: boolean
    centerX?: boolean
    confirmClose?: boolean
    className?: any
    style?: any
    children: any
}): JSX.Element {
    const { close, centerY, centerX, confirmClose, className, style, children } = props
    const mobileView = document.documentElement.clientWidth < 900
    const classes = [styles.modal]
    if (className) classes.unshift(className)

    return (
        <div className={`${styles.background} hide-scrollbars`}>
            <CloseOnClickOutside onClick={close} confirmClose={confirmClose}>
                <Column
                    className={`${classes.join(' ')} hide-scrollbars`}
                    style={style}
                    centerX={centerX}
                    centerY={centerY}
                >
                    <div className={styles.closeButtonWrapper}>
                        <CloseButton size={mobileView ? 24 : 20} onClick={close} />
                    </div>
                    {children}
                </Column>
            </CloseOnClickOutside>
        </div>
    )
}

Modal.defaultProps = {
    centerY: false,
    centerX: false,
    confirmClose: false,
    className: false,
    style: null,
}

export default Modal
