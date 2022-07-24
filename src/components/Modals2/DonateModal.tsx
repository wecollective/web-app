import Modal from '@components/Modal'
import styles from '@styles/components/modals/DonateModal.module.scss'
import { ReactComponent as DonateIconSVG } from '@svgs/donate-solid.svg'
import React from 'react'

const DonateModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props

    return (
        <Modal close={close} style={{ minWidth: 350 }} centered>
            <DonateIconSVG className={styles.donateIcon} />
            <p>Help support the development of weco.io</p>
            <p>
                <b>ETH:</b> 0x1019665603CcF936932E38cab3370bcDb89f82eE
            </p>
            <p>
                <b>BTC:</b> bc1q906p8ycplrv9varmk4cn4kjh2p0xhr85ve8en9
            </p>
            <p>
                <b>PayPal:</b>
            </p>
            <form action='https://www.paypal.com/donate' method='post' target='_top'>
                <input type='hidden' name='hosted_button_id' value='N8ZUPLXZPGMTY' />
                <input
                    type='image'
                    src='https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif'
                    name='submit'
                    title='PayPal - The safer, easier way to pay online!'
                    alt='Donate with PayPal button'
                />
                <img
                    alt=''
                    src='https://www.paypal.com/en_GB/i/scr/pixel.gif'
                    width='1'
                    height='1'
                />
            </form>
        </Modal>
    )
}

export default DonateModal
