/* eslint-disable no-nested-ternary */
import Column from '@components/Column'
import PeopleListPlaceholder from '@components/PeopleListPlaceholder'
import Row from '@components/Row'
import LoadingWheel from '@components/animations/LoadingWheel'
import VerticalUserCard from '@components/cards/VerticalUserCard'
import styles from '@styles/components/PeopleList.module.scss'
import React from 'react'

function PeopleList(props: {
    people: any[]
    firstPeopleloading: boolean
    nextPeopleLoading: boolean
}): JSX.Element {
    const { people, firstPeopleloading, nextPeopleLoading } = props

    return (
        <Row centerX className={styles.wrapper}>
            {firstPeopleloading ? (
                <PeopleListPlaceholder />
            ) : people.length ? (
                <Column>
                    <Row wrap centerX>
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
        </Row>
    )
}

export default PeopleList
