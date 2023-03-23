import StringBeadCard from '@components/cards/PostCard/StringBeadCard'
import Column from '@components/Column'
import DraftText from '@components/draft-js/DraftText'
import Row from '@components/Row'
import Scrollbars from '@components/Scrollbars'
import ShowMoreLess from '@components/ShowMoreLess'
import Comments from '@src/components/cards/Comments/Comments'
import styles from '@styles/components/cards/PostCard/PostTypes/GlassBeadGame.module.scss'
import { DNAIcon } from '@svgs/all'
import React, { useState } from 'react'

function String(props: {
    postData: any
    setPostData: (data: any) => void
    location: string
}): JSX.Element {
    const { postData, setPostData, location } = props
    const { id, text, StringPosts } = postData
    const [selectedBead, setSelectedBead] = useState<any>(null)
    const [beadCommentsOpen, setBeadCommentsOpen] = useState(false)
    const stringPosts = StringPosts && StringPosts.sort((a, b) => a.Link.index - b.Link.index)

    return (
        <Column>
            {text && (
                <Column style={{ marginBottom: 10 }}>
                    <ShowMoreLess height={150}>
                        <DraftText stringifiedDraft={text} />
                    </ShowMoreLess>
                </Column>
            )}
            <Row centerX>
                <Scrollbars className={styles.beadDraw}>
                    <Row>
                        {stringPosts.map((bead, i) => (
                            <Row key={bead.id}>
                                <StringBeadCard
                                    bead={bead}
                                    postId={id}
                                    postType={postData.type}
                                    beadIndex={i}
                                    location={location}
                                    selected={selectedBead && selectedBead.id === bead.id}
                                    toggleBeadComments={() => {
                                        if (beadCommentsOpen) {
                                            if (bead.id !== selectedBead.id) setSelectedBead(bead)
                                            else setBeadCommentsOpen(false)
                                        } else {
                                            setSelectedBead(bead)
                                            setBeadCommentsOpen(true)
                                        }
                                    }}
                                    style={{
                                        marginRight:
                                            stringPosts.length > 2 && i === stringPosts.length - 1
                                                ? 15
                                                : 0,
                                    }}
                                />
                                {i < stringPosts.length - 1 && (
                                    <Row centerY className={styles.beadDivider}>
                                        <DNAIcon />
                                    </Row>
                                )}
                            </Row>
                        ))}
                    </Row>
                </Scrollbars>
            </Row>
            {beadCommentsOpen && (
                <Comments
                    postId={selectedBead.id}
                    type='bead'
                    location={location}
                    totalComments={selectedBead.totalComments}
                    incrementTotalComments={(value) => {
                        const newPostData = { ...postData }
                        const bead = newPostData.StringPosts.find((b) => b.id === selectedBead.id)
                        bead.totalComments += value
                        bead.accountComment = value > 0
                        setPostData(newPostData)
                    }}
                    style={{ margin: '10px 0' }}
                />
            )}
        </Column>
    )
}

export default String
