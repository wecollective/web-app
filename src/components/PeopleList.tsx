/* eslint-disable no-nested-ternary */
import React from 'react'
import styles from '@styles/components/PeopleList.module.scss'
import VerticalUserCard from '@components/Cards/VerticalUserCard'
import PeopleListPlaceholder from '@components/PostListPlaceholder'
import Row from '@components/Row'
import Column from '@components/Column'
import LoadingWheel from '@components/LoadingWheel'
import Scrollbars from '@src/components/Scrollbars'

const PeopleList = (props: {
    location: 'space-people'
    people: any[]
    firstPeopleloading: boolean
    nextPeopleLoading: boolean
    onScrollBottom: () => void
}): JSX.Element => {
    const { location, people, firstPeopleloading, nextPeopleLoading, onScrollBottom } = props

    return (
        <Scrollbars
            id={`${location}-scrollbars`}
            className={styles.wrapper}
            onScrollBottom={onScrollBottom}
        >
            {firstPeopleloading ? (
                <PeopleListPlaceholder />
            ) : people.length ? (
                <Column>
                    <Row wrap>
                        {people.map((person) => (
                            <VerticalUserCard
                                key={person.id}
                                user={person}
                                style={{ margin: '0 20px 20px 0' }}
                            />
                        ))}
                    </Row>
                    {nextPeopleLoading && (
                        <Row centerX>
                            <LoadingWheel />
                        </Row>
                    )}
                </Column>
            ) : (
                <Row className={styles.noResults}>
                    <p>No people found that match those settings...</p>
                </Row>
            )}
        </Scrollbars>
    )
}

export default PeopleList
