import { UserContext } from '@contexts/UserContext'
import styles from '@styles/components/UserPageMessages.module.scss'
import React, { useContext, useEffect } from 'react'
// import PostCard from './PostCard'
// import PostsHeader from './PostsHeader'
// import PostsPlaceholder from './PostsPlaceholder'

const UserPageMessages = (): JSX.Element => {
    const { setSelectedUserSubPage } = useContext(UserContext)

    useEffect(() => {
        setSelectedUserSubPage('messages')
    }, [])

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>Messages</div>
            <div className={styles.body}>[Coming soon...]</div>
        </div>
    )
}

export default UserPageMessages
