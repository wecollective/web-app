import Row from '@components/Row'
import styles from '@styles/components/PageTabs.module.scss'
import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Tab(props: { baseRoute: string; tab: any }): JSX.Element {
    const { baseRoute, tab } = props
    const location = useLocation()
    const subpage = location.pathname.split('/')[3]
    return (
        <Link
            className={`${styles.tab} ${subpage === tab.text.toLowerCase() && styles.selected}`}
            to={`${baseRoute}/${tab.text.toLowerCase()}`}
        >
            <Row style={{ margin: '0 5px' }}>
                {tab.icon}
                <p>{tab.text}</p>
            </Row>
            <div className={styles.underline} />
        </Link>
    )
}

function PageTabs(props: { tabs: any }): JSX.Element {
    const { tabs } = props
    return (
        <Row className={styles.wrapper}>
            {tabs.left.length > 0 && (
                <Row>
                    {tabs.left
                        .filter((t) => t.visible)
                        .map((tab) => (
                            <Tab key={tab.text} baseRoute={tabs.baseRoute} tab={tab} />
                        ))}
                </Row>
            )}
            {tabs.right.length > 0 && (
                <Row>
                    {tabs.right
                        .filter((t) => t.visible)
                        .map((tab) => (
                            <Tab key={tab.text} baseRoute={tabs.baseRoute} tab={tab} />
                        ))}
                </Row>
            )}
        </Row>
    )
}

export default PageTabs
