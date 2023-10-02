import Button from '@components/Button'
import Column from '@components/Column'
import Row from '@components/Row'
import DraftText from '@components/draft-js/DraftText'
import { AccountContext } from '@contexts/AccountContext'
import { UserContext } from '@contexts/UserContext'
import UserNotFound from '@pages/UserPage/UserNotFound'
import { dateCreated, timeSinceCreated } from '@src/Helpers'
import LoadingWheel from '@src/components/LoadingWheel'
import styles from '@styles/pages/UserPage/About.module.scss'
import { CheckIcon, ShieldIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

function About(): JSX.Element {
    const { accountData } = useContext(AccountContext)
    const { userData, userNotFound } = useContext(UserContext)
    const { handle, createdAt, bio, gcId } = userData
    const [greenCheckData, setGreenCheckData] = useState<any>(null)
    const [greenCheckDataLoading, setGreenCheckDataLoading] = useState(false)
    const [greenCheckLinkLoading, setGreenCheckLinkLoading] = useState(false)
    const location = useLocation()
    const userHandle = location.pathname.split('/')[2]
    // const data = {
    //     score: 4.6,
    //     linkedAccounts: [
    //         {
    //             site: 'GITHUB',
    //             name: 'jhweir',
    //             handle: '@jhweir',
    //             image: '',
    //             url: 'https://github.com/jhweir',
    //         },
    //         {
    //             site: 'TWITTER',
    //             name: 'James Weir',
    //             handle: '@jamestheweir',
    //             image: 'https://pbs.twimg.com/profile_images/1184526228700762112/KToVrqOz_bigger.jpg',
    //             url: 'https://twitter.com/jamestheweir',
    //         },
    //         {
    //             site: 'YOUTUBE',
    //             name: 'we { collective }',
    //             handle: '@we-collective',
    //             image: 'https://yt3.ggpht.com/N6crxjhR2HItoeT0L_JqnMBpAVvnGU_nTJorLKKkb2K-Cvh_WYzjE-indzsPsSYkmio0uUJG5g=s108-c-k-c0x00ffffff-no-rj',
    //             url: 'https://youtube.com/we-collective',
    //         },
    //         {
    //             site: 'LINKEDIN',
    //             name: 'James Weir',
    //             handle: '@jhweir',
    //             image: 'https://media.licdn.com/dms/image/C4D03AQFQ1cBhLi7rjw/profile-displayphoto-shrink_400_400/0/1551370357610?e=1697673600&v=beta&t=RJQ-OQmaBhggv2T7nW-_d-rLGC6eXvwju1glnkrtsO0',
    //             url: 'https://linkedin.com/in/jhweir',
    //         },
    //     ],
    // }
    // const { score, linkedAccounts } = data

    function linkGreenCheckAccount() {
        setGreenCheckLinkLoading(true)
        axios
            .get(`https://greencheck.world/api/greencheck/weco.username/${accountData.handle}`)
            .then((res) => {
                console.log(res.data)
                setGreenCheckLinkLoading(false)
            })
            .catch((error) => console.log(error))
    }

    function getGreenCheckData() {
        setGreenCheckDataLoading(true)
        axios
            .get(`https://greencheck.world/api/greencheck/_id/${gcId}`)
            .then((res) => {
                console.log(res.data)
                setGreenCheckDataLoading(false)
            })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        if (userData.id && gcId) getGreenCheckData()
    }, [userData.id])

    if (userNotFound) return <UserNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {handle !== userHandle ? (
                <p>User data loading...</p>
            ) : (
                <Column centerX className={styles.content}>
                    <Row centerY centerX className={styles.creation}>
                        <p>Joined</p>
                        <p title={dateCreated(createdAt)}>{timeSinceCreated(createdAt)}</p>
                    </Row>
                    {!gcId && userHandle === accountData.handle && (
                        <Button
                            text='Link GreenCheck account'
                            color='aqua'
                            disabled={greenCheckLinkLoading}
                            loading={greenCheckLinkLoading}
                            onClick={linkGreenCheckAccount}
                            style={{ marginTop: 30 }}
                        />
                    )}
                    {gcId && (
                        <Column centerX className={styles.greenCheck}>
                            <Row centerY style={{ marginBottom: 20 }}>
                                <a
                                    href='https://greencheck.world/'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    GreenCheck
                                </a>
                                <p style={{ margin: '0 10px 0 5px' }}>proof of humanity score:</p>
                                <Column centerX centerY className={styles.scoreIcon}>
                                    <ShieldIcon className={styles.shield} />
                                    <CheckIcon className={styles.check} />
                                    {greenCheckDataLoading ? (
                                        <LoadingWheel size={30} />
                                    ) : (
                                        <p>{4.5}</p>
                                    )}
                                </Column>
                            </Row>
                            {/* <p className='grey' style={{ marginBottom: 10 }}>
                            Claimed accounts:
                        </p>
                        {linkedAccounts.map((account) => (
                            <Row key={account.site} centerY className={styles.linkedAccount}>
                                <p>{account.site}</p>
                                {account.image && <img src={account.image} alt='' />}
                                <p>{account.name}</p>
                                <a href={account.url} target='_blank' rel='noopener noreferrer'>
                                    {account.handle}
                                </a>
                            </Row> */}
                            {/* ))} */}
                        </Column>
                    )}
                    {bio && (
                        <Column centerX style={{ marginTop: 30 }}>
                            <p className='grey' style={{ marginBottom: 10 }}>
                                Bio:
                            </p>
                            <DraftText stringifiedDraft={bio || ''} />
                        </Column>
                    )}
                </Column>
            )}
        </Column>
    )
}

export default About
