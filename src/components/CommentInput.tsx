import React, { useContext } from 'react'
import styles from '@styles/components/CommentInput.module.scss'
import { AccountContext } from '@contexts/AccountContext'
import Button from '@src/components/Button'
import Row from '@src/components/Row'
import FlagImage from '@components/FlagImage'

const CommentInput = (props: {
    id?: string
    value: string
    placeholder: string
    error: boolean
    style?: any
    onChange: (event: any) => void
    submit: () => void
}): JSX.Element => {
    const { id, value, placeholder, error, style, onChange, submit } = props
    const { accountData } = useContext(AccountContext)

    return (
        <Row id={id} className={styles.wrapper} style={style}>
            <FlagImage type='user' size={40} imagePath={accountData.flagImagePath} />
            <Row style={{ width: '100%' }}>
                <textarea
                    className={error ? styles.error : ''}
                    rows={1}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e)}
                />
                <Button color='blue' size='medium' text='Post' onClick={submit} />
            </Row>
        </Row>
    )
}

CommentInput.defaultProps = {
    id: null,
    style: null,
}

export default CommentInput
