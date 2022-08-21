import Column from '@components/Column'
import { SpaceContext } from '@contexts/SpaceContext'
import SpaceNotFound from '@pages/SpaceNotFound'
import TextLink from '@src/components/TextLink'
import styles from '@styles/pages/SpacePage/SpacePageGovernance.module.scss'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'

const SpacePageGovernance = (): JSX.Element => {
    const { spaceData, spaceNotFound } = useContext(SpaceContext)
    const location = useLocation()
    const spaceHandle = location.pathname.split('/')[2]

    if (spaceNotFound) return <SpaceNotFound />
    return (
        <Column centerX className={styles.wrapper}>
            {spaceData.handle !== spaceHandle ? (
                <p>Space data loading... </p>
            ) : (
                <Column className={styles.content}>
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
                    <a href='http://wiki.weco.io/#/governance'>
                        <img
                            width='100%'
                            src='http://wiki.weco.io/images/decision-pipeline.jpg'
                            alt='Stages: Suggestions, Proposals, Pending Tasks, Active Tasks, Completed Tasks'
                        />
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
                </Column>
            )}
        </Column>
    )
}

export default SpacePageGovernance
