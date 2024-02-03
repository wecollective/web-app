import ImageTitle from '@components/ImageTitle'
import Row from '@components/Row'
import SpaceButton from '@components/SpaceButton'
import Modal from '@components/modals/Modal'
import styles from '@styles/components/cards/PostCard/PostSpaces.module.scss'
import React, { useState } from 'react'

function PostSpaces(props: { spaces: any[]; size?: number; preview?: boolean }): JSX.Element {
    const { spaces, size, preview } = props
    const [modalOpen, setModalOpen] = useState(false)
    // filter out root space 'all' and deleted spaces if included
    const filteredSpaces = spaces.filter((s) => s.id > 1 && (preview || s.state === 'active'))
    const mobileView = document.documentElement.clientWidth < 900

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
            {preview ? (
                <>
                    {filteredSpaces[0] && (
                        <ImageTitle
                            type='space'
                            imagePath={filteredSpaces[0].flagImagePath}
                            title={filteredSpaces[0].name}
                            imageSize={size}
                            fontSize={15}
                            style={{ margin: '0 5px' }}
                        />
                    )}
                    {filteredSpaces[1] && (
                        <div className={styles.otherSpaces} style={{ width: size, height: size }}>
                            <p>+{filteredSpaces.length - 1}</p>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {filteredSpaces[0] && (
                        <SpaceButton
                            space={filteredSpaces[0]}
                            imageSize={size}
                            fontSize={15}
                            maxChars={mobileView ? 20 : 36}
                            style={{ margin: '0 5px' }}
                            shadow
                        />
                    )}
                    {filteredSpaces[1] && (
                        <button
                            type='button'
                            className={`${styles.otherSpaces} ${styles.button}`}
                            title={otherSpacesTitle()}
                            onClick={() => setModalOpen(true)}
                            disabled={preview}
                            style={{ width: size, height: size }}
                        >
                            <p>+{filteredSpaces.length - 1}</p>
                        </button>
                    )}
                    {modalOpen && (
                        <Modal centerX close={() => setModalOpen(false)}>
                            <h2>Posted to</h2>
                            {filteredSpaces.map((space) => (
                                <SpaceButton
                                    key={space.id}
                                    space={space}
                                    imageSize={size}
                                    fontSize={15}
                                    style={{ marginTop: 10 }}
                                    shadow
                                />
                            ))}
                        </Modal>
                    )}
                </>
            )}
        </Row>
    )
}

PostSpaces.defaultProps = {
    size: 32,
    preview: false,
}

export default PostSpaces
