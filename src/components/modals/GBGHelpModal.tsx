/* eslint-disable no-underscore-dangle */
import Column from '@components/Column'
import Modal from '@components/modals/Modal'
import styles from '@styles/components/modals/GBGHelpModal.module.scss'
import React from 'react'

function GBGHelpModal(props: { close: () => void }): JSX.Element {
    const { close } = props

    return (
        <Modal centered close={close} className={styles.wrapper}>
            <h1>About The Glass Bead Game</h1>
            <Column centerX>
                <p>
                    The Glass Bead Game is a turn-based game of co-creation which, like
                    brainstorming, facilitates the generation of creative ideas. The Glass Bead Game
                    focuses on making space for every player to contribute to the play, and
                    encourages deep listening for collaborative meaning making.
                </p>
                <p>
                    Each player is given the same amount of time to speak, encouraging those who
                    typically have less of a voice to express themselves, and the beauty of a game
                    is judged on how well each players connects with the other, cultivating deep
                    listening. The social pressure of being ‘right’ is reduced by the playful nature
                    of the game, and the ideal of avoiding I and you helps keep our egos at bay.
                </p>
                <p>Take one minute turns to speak on a topic, and aim for these ideals:</p>
                <p>Listen deeply.</p>
                <p>Avoid the use of I and You.</p>
                <p>Connect with the previous move.</p>
                <p>But:</p>
                <p>Use the timer to customise the length and number of the turns.</p>
                <p>And:</p>
                <p>Come up with your own ideals :)</p>
                <p>Enjoy!</p>
            </Column>
        </Modal>
    )
}

export default GBGHelpModal
