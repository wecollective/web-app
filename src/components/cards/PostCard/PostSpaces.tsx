import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import Modal from '@components/modals/Modal'
import { trimText } from '@src/Helpers'
import styles from '@styles/components/cards/PostCard/PostSpaces.module.scss'
import React, { useState } from 'react'

function PostSpaces(props: { spaces: any[]; preview?: boolean }): JSX.Element {
    const { spaces, preview } = props
    const [modalOpen, setModalOpen] = useState(false)
    const mobileView = document.documentElement.clientWidth < 900
    // filter out root space 'all' and deleted spaces if included
    const filteredSpaces = spaces.filter((s) => s.id > 1 && (preview || s.state === 'active'))

    function otherSpacesTitle() {
        if (!filteredSpaces.length) return ''
        return filteredSpaces
            .filter((s, i) => i > 0)
            .map((s) => s.handle)
            .join(', ')
    }

    if (!filteredSpaces.length) return <Row />
    return (
        <Row centerY className={styles.wrapper}>
            <p className='grey'>to</p>
            {filteredSpaces[0] && (
                <ImageTitle
                    type='space'
                    imagePath={filteredSpaces[0].flagImagePath}
                    imageSize={32}
                    title={trimText(filteredSpaces[0].name, mobileView ? 20 : 36)}
                    fontSize={15}
                    link={preview ? null : `/s/${filteredSpaces[0].handle}/posts`}
                    style={{ margin: '0 5px' }}
                    shadow
                />
            )}
            {filteredSpaces[1] && (
                <button
                    type='button'
                    className={styles.otherSpacesButton}
                    title={otherSpacesTitle()}
                    onClick={() => setModalOpen(true)}
                >
                    <p>+{filteredSpaces.length - 1}</p>
                </button>
            )}
            {modalOpen && (
                <Modal centerX close={() => setModalOpen(false)}>
                    <h2>Posted to</h2>
                    {filteredSpaces.map((space) => (
                        <ImageTitle
                            key={space.id}
                            type='space'
                            imagePath={space.flagImagePath}
                            imageSize={32}
                            title={space.name}
                            fontSize={15}
                            link={preview ? null : `/s/${space.handle}/posts`}
                            style={{ marginTop: 10 }}
                            shadow
                        />
                    ))}
                </Modal>
            )}
        </Row>
    )
}

PostSpaces.defaultProps = {
    preview: false,
}

export default PostSpaces
