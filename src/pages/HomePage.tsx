import Button from '@components/Button'
import CollapsibleCards from '@components/CollapsibleCards'
import Column from '@components/Column'
import FlagImageHighlights from '@components/FlagImageHighlights'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import { isPlural, pluralise } from '@src/Helpers'
import styles from '@styles/pages/HomePage.module.scss'
import { CastaliaIcon, DoorIcon, HandshakeIcon, OSIcon, PollIcon } from '@svgs/all'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'universal-cookie'
// todo: import logo and background images as SVG components
// import { ReactComponent as BackgroundImageSVG } from '@svgs/earth.svg'

function Homepage(): JSX.Element {
    const {
        loggedIn,
        accountDataLoading,
        setAlertMessage,
        setAlertModalOpen,
        setResetPasswordModalOpen,
        setResetPasswordToken,
        setRegisterModalOpen,
        setClaimAccountModalOpen,
    } = useContext(AccountContext)
    const urlParams = new URLSearchParams(window.location.search)
    const alert = urlParams.get('alert')
    const history = useNavigate()
    const cookies = new Cookies()

    const [highlights, setHighlights] = useState<any>(null)
    const cardData = [
        {
            text: '# New ways of organising information',
            imagePath: `${config.publicAssets}/images/information.jpg`,
            children: [
                {
                    text: '# Organise spaces holonically',
                    imagePath: `${config.publicAssets}/images/holarchy.jpg`,
                    children: [],
                },
                {
                    text: '# Navigate spaces visually',
                    imagePath: `${config.publicAssets}/images/tree.jpg`,
                    children: [],
                },
                {
                    text: '# Link posts together',
                    imagePath: `${config.publicAssets}/images/string.jpg`,
                    children: [],
                },
            ],
        },
        {
            text: '# New ways of creating together',
            svg: <CastaliaIcon />,
            children: [
                {
                    text: '# Play with time',
                    imagePath: `${config.publicAssets}/images/time.jpg`,
                    children: [],
                },
                {
                    text: '# Process ideas collectively (Soon<sup>TM</sup>)',
                    imagePath: `${config.publicAssets}/images/process.jpg`,
                    children: [],
                },
                {
                    text: '# Design beautiful information (Soon<sup>TM</sup>)',
                    imagePath: `${config.publicAssets}/images/design.jpg`,
                    children: [],
                },
            ],
        },
        {
            text: '# New ways of being together',
            imagePath: `${config.publicAssets}/images/being.jpg`,
            children: [
                {
                    text: '# Cooperatively owned (Soon<sup>TM</sup>)',
                    svg: <HandshakeIcon />,
                    smallIcon: true,
                    children: [],
                },
                {
                    text: '# Democratically governed (Soon<sup>TM</sup>)',
                    svg: <PollIcon />,
                    smallIcon: true,
                    children: [],
                },
                {
                    text: '# Open source',
                    link: 'https://github.com/wecollective',
                    svg: <OSIcon />,
                    smallIcon: true,
                    children: [],
                },
            ],
        },
    ]

    function showRedirectAlerts() {
        if (alert === 'verify-email') {
            axios
                .post(`${config.apiURL}/verify-email`, { token: urlParams.get('token') })
                .then(() => {
                    setAlertMessage(
                        'Success! Your email has been verified. Log in to start using your account.'
                    )
                    setAlertModalOpen(true)
                })
                .catch((error) => {
                    if (error.response.status === 404) {
                        setAlertMessage('Sorry, that email verification token has expired')
                        setAlertModalOpen(true)
                    } else console.log(error)
                })
        }
        if (alert === 'reset-password') {
            setResetPasswordModalOpen(true)
            setResetPasswordToken(urlParams.get('token'))
        }
        if (alert === 'claim-account') setClaimAccountModalOpen(true)
    }

    function getHomepageHighlights() {
        axios.get(`${config.apiURL}/homepage-highlights`).then((res) => setHighlights(res.data))
    }

    // function test() {
    //     axios
    //         .get(`${config.apiURL}/test`)
    //         .then((res) => {
    //             console.log('test res: ', res.data)
    //         })
    //         .catch((error) => {
    //             console.log('ERROR: ', error)
    //         })
    // }

    useEffect(() => {
        window.scrollTo(0, 0)
        showRedirectAlerts()
        getHomepageHighlights()
    }, [])

    useEffect(() => {
        if (!accountDataLoading && !loggedIn && alert === 'create-account')
            setRegisterModalOpen(true)
    }, [accountDataLoading])

    return (
        <Column className={styles.wrapper}>
            <Column className={styles.background}>
                <div className={styles.sky} />
                <div className={styles.earthImage}>
                    <img
                        src={`${config.publicAssets}/images/homepage-earth.svg`}
                        alt='background wave svg'
                    />
                </div>
            </Column>
            <Column centerX className={styles.content}>
                <img
                    className={styles.logo}
                    src={`${config.publicAssets}/images/new-logo.svg`}
                    alt='weco logo'
                />
                <h1>
                    we
                    <span className='roboto'>{`{`}</span>
                    <span className={styles.colored}>collective</span>
                    <span className='roboto'>{`}`}</span>
                </h1>
                <h2>play together</h2>
                {/* <Button text='Test' color='blue' onClick={test} style={{ marginBottom: 20 }} /> */}
                <Button
                    text='Enter'
                    icon={<DoorIcon />}
                    color='blue'
                    onClick={() => history('/s/all')}
                />
                {highlights ? (
                    <div className={styles.highlights}>
                        <FlagImageHighlights
                            type='post'
                            images={highlights.posts}
                            imageSize={45}
                            text={`${highlights.totals.totalPosts} Post${pluralise(
                                highlights.posts.length
                            )}`}
                            onClick={() => history('/s/all/posts')}
                            outline={2}
                        />
                        <FlagImageHighlights
                            type='space'
                            images={highlights.spaces}
                            imageSize={45}
                            text={`${highlights.totals.totalSpaces} Space${pluralise(
                                highlights.totals.totalSpaces
                            )}`}
                            onClick={() => history('/s/all/spaces')}
                            outline={2}
                        />
                        <FlagImageHighlights
                            type='user'
                            images={highlights.users}
                            imageSize={45}
                            text={`${highlights.totals.totalUsers} ${
                                isPlural(highlights.totals.totalUsers) ? 'People' : 'Person'
                            }`}
                            onClick={() => history('/s/all/people')}
                            outline={2}
                        />
                    </div>
                ) : (
                    <div className={styles.emptyHighlights} />
                )}
                <CollapsibleCards data={cardData} style={{ marginTop: 40, marginBottom: 160 }} />
            </Column>
        </Column>
    )
}

export default Homepage

/* <div className={styles.list}>
    <span className={`${styles.largeText} mb-10`}>Working features</span>
    <span>User accounts</span>
    <ul className={styles.ul}>
        <li>Log in / out with JWT authentication and encrypted password</li>
        <li>Access to followed and moderated spaces</li>
        <li>Search and filter created posts</li>
        <li>
            Recieve account notifications when other users interact with your
            content
        </li>
    </ul>
    <span className='mt-20'>Spaces</span>
    <ul className={styles.ul}>
        <li>Create spaces within spaces within spaces to any depth</li>
        <li>Edit space name, url handle, and bio</li>
        <li>Upload space flag and cover images</li>
        <li>Add new moderators</li>
        <li>Search and filter child spaces</li>
        <li>Navigate up and down spaces</li>
        <li>Connect to new parent spaces</li>
        <li>Toggle view of spaces between scrollable list or tree diagram</li>
    </ul>
    <span className='mt-20'>Posts</span>
    <ul className={styles.ul}>
        <li>
            Create posts and tag them with the spaces you want them to appear within
        </li>
        <li>Choose from different post types</li>
        <ul>
            <li>Text</li>
            <li>Url: includes image and metadata from url</li>
            <li>Poll: single choice, multiple choice, or weighted choice</li>
            <li>Glass bead: allows turn based linking of posts</li>
        </ul>
        <li>Comment on posts</li>
        <li>Reply to comments</li>
        <li>React to posts</li>
        <ul>
            <li>Like posts</li>
            <li>Repost posts</li>
            <li>Rate posts</li>
            <li>Link posts to other posts</li>
        </ul>
        <li>Vote and view results on poll posts</li>
        <li>Toggle view of posts between scrollable list and post map</li>
        <li>Posts and links visualised on post map</li>
    </ul>
    <span className={`${styles.largeText} mt-50`}>Coming features</span>
    <ul className={styles.ul}>
        <li>New post types</li>
        <ul>
            <li>Plot graphs</li>
            <li>Decision trees</li>
            <li>Knowledge maps</li>
        </ul>
        <li>User to user messaging</li>
        <li>
            Personalised stream on user profile (pulling in content from followed
            spaces)
        </li>
        <li>Comment permalinks</li>
        <li>Up/down vote links between posts</li>
        <li>Flag posts for moderation</li>
        <li>Custom filtering of content based on flags</li>
        <li>Log in through Facebook, Twitter, Google</li>
        <li>Zoomable circle packing view for spaces</li>
        <li>Responsive UI for small screens</li>
    </ul> 
</div> */

/* <div className={styles.bottom}>
    <div className={styles.introText}>
        comes from a beleif that collective intelligence technologies hold the key to solving the worlds problems.
        cooperative ownership, democratic governance, transparency etc putting power into the peoples hands
        <h1>
            <b>we</b>
            {'{'}collective{'} '}
            is an evolving open source experiment in collective intelligence, social
            media design, and cooperative ownership.
        </h1>
        <p>
            The platform is based around a nested{' '}
            <a href='https://en.wikipedia.org/wiki/Holon_(philosophy)'>holonic</a>{' '}
            community framework designed to help users organise, filter, and explore
            social media content more intuitively. Learn more about how it works [here].
        </p>
        <img
            src='https://miro.medium.com/max/1400/1*dJltVFtaVwh4CIPBXNOV1A.jpeg'
            alt=''
        />
        <p>
            Within this framework a range of post types and community modules are being
            developed to meet different collaborative needs for communities.
        </p>
        <p>
            The common theme running through these features is the goal of
            exploring and facilitating new forms of collective intelligence amongst the user
            base.
        </p>
        <p>
            Once enough of the platform has been developed and enough active users are
            involved we’ll be transitioning into a platform cooperative, owned and
            governed by its members. Members of the coop will then be able to propose
            and vote on new features they’d like built into the platform, as well as how
            surplus profits generated by the site are spent. Learn more about our plans
            for the coop and its governance [here].
        </p>
        <p>
            The website is currently being developed primarily as a passion project by
            James Weir. If enough funding can be raised, a dedicated development team
            will be established to work full time on the project in conjunction with
            open source collaborators. If you'd like to get involved or have any other
            queries, please contact us [here].
        </p>
    </div>
</div> */
