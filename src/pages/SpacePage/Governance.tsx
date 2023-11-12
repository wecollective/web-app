import Button from '@components/Button'
import Column from '@components/Column'
import FlagImage from '@components/FlagImage'
import LoadingWheel from '@components/LoadingWheel'
import Row from '@components/Row'
import PostCard from '@components/cards/PostCard/PostCard'
import { AccountContext } from '@contexts/AccountContext'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import config from '@src/Config'
import styles from '@styles/pages/SpacePage/Governance.module.scss'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

function Governance(): JSX.Element {
    const { setCreatePostModalSettings, setCreatePostModalOpen } = useContext(AccountContext)
    const { spaceData, spaceNotFound, isModerator, governancePolls, setGovernancePolls } =
        useContext(SpaceContext)
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    useEffect(() => {
        if (spaceData.handle === spaceHandle)
            axios
                .get(`${config.apiURL}/space-governance-polls?spaceId=${spaceData.id}`)
                .then((res) => {
                    setGovernancePolls(res.data)
                    setLoading(false)
                })
                .catch((error) => console.log(error))
    }, [spaceData.handle])

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {loading ? (
                <LoadingWheel style={{ marginTop: 20 }} />
            ) : (
                <Column centerX className={styles.content}>
                    <Row centerY className={styles.header}>
                        <h1>Governance polls for</h1>
                        <FlagImage
                            type='space'
                            imagePath={spaceData.flagImagePath}
                            size={40}
                            style={{ margin: '0 5px 0 10px' }}
                        />
                        <h1>{spaceData.name}</h1>
                    </Row>
                    {isModerator && (
                        <Button
                            text='New poll'
                            color='blue'
                            onClick={() => {
                                setCreatePostModalSettings({ governance: true })
                                setCreatePostModalOpen(true)
                            }}
                            style={{ marginBottom: 30 }}
                        />
                    )}
                    {governancePolls.length < 1 ? (
                        <p>No polls created yet...</p>
                    ) : (
                        <Column style={{ width: 780 }}>
                            {governancePolls.map((poll) => (
                                <PostCard key={poll.id} post={poll} location='space-governance' />
                            ))}
                        </Column>
                    )}
                </Column>
            )}
        </Column>
    )
}

export default Governance

/* <Column className={styles.content}>
    <h1>Still to be developed.</h1>
    <p>
        This section will contain polls and customisable governance modules to help
        the community self-govern.
    </p>
    <br />
    <br />
    <h1>In the meantime...</h1>
    <p>
        You can learn more about our plans for governance on the platform on our
        wiki:
    </p>
    <a href='http://wiki.weco.io/#/governance' className='blueText'>
        http://wiki.weco.io/#/governance
    </a>
    <br />
    <p>
        You can also contribute to our development conversations across each of
        these spaces:
    </p>
    <br />
    <TextLink text='Governance' link='/s/weco-governance/posts' />
    <br />
    <TextLink text='Feedback' link='/s/weco-feedback/posts' />
    <br />
    <TextLink text='Questions' link='/s/weco-questions/posts' />
    <br />
    <TextLink text='Ideas' link='/s/weco-ideas/posts' />
    <br />
    <TextLink text='Requests' link='/s/weco-requests/posts' />
    <br />
    <br />
    <br />
    <p>We&apos;ll be sharing platform updates here:</p>
    <br />
    <TextLink text='Updates' link='/s/weco-updates/posts' />
    <div style={{ height: '6vh' }} />
</Column> */
