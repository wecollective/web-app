import LoadingWheel from '@components/LoadingWheel'
import styles from '@styles/components/StatButton.module.scss'
import React from 'react'

const StatButton = (props: {
    icon: any
    text?: string
    title?: string
    color?: 'blue'
    iconSize?: number
    style?: any
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
    onClickIcon?: () => void
    onClickStat?: () => void
}): JSX.Element => {
    const {
        icon,
        text,
        title,
        color,
        iconSize,
        style,
        disabled,
        loading,
        onClick,
        onClickIcon,
        onClickStat,
    } = props

    return (
        <div className={styles.wrapper}>
            <button
                type='button'
                title={title}
                style={style}
                disabled={disabled}
                onClick={onClick !== null ? onClick : onClickIcon}
            >
                {loading ? (
                    <LoadingWheel size={20} />
                ) : (
                    <div
                        className={`${styles.icon} ${color && styles[color]}`}
                        style={{ width: iconSize, height: iconSize }}
                    >
                        {icon}
                    </div>
                )}
            </button>
            <button
                type='button'
                title={title}
                style={style}
                disabled={disabled}
                onClick={onClick !== null ? onClick : onClickStat}
            >
                <p>{text}</p>
            </button>
        </div>
    )
}

StatButton.defaultProps = {
    text: null,
    title: null,
    color: false,
    iconSize: 20,
    style: null,
    disabled: false,
    onClick: null,
    loading: false,
    onClickIcon: null,
    onClickStat: null,
}

export default StatButton
