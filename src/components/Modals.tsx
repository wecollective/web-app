import React, { useContext } from 'react'
import { AccountContext } from '@contexts/AccountContext'
import AlertModal from '@components/modals/AlertModal'
import ResetPasswordModal from '@components/modals/ResetPasswordModal'
import LogInModal from '@components/modals/LogInModal'
import RegisterModal from '@components/modals/RegisterModal'
import ForgotPasswordModal from '@components/modals/ForgotPasswordModal'
import DonateModal from '@components/modals/DonateModal'
import GlobalImageUploadModal from '@components/modals/GlobalImageUploadModal'

const Modals = (): JSX.Element => {
    const {
        alertModalOpen,
        logInModalOpen,
        setLogInModalOpen,
        registerModalOpen,
        setRegisterModalOpen,
        forgotPasswordModalOpen,
        setForgotPasswordModalOpen,
        donateModalOpen,
        setDonateModalOpen,
        resetPasswordModalOpen,
        imageUploadModalOpen,
    } = useContext(AccountContext)

    return (
        <>
            {alertModalOpen && <AlertModal />}
            {logInModalOpen && <LogInModal close={() => setLogInModalOpen(false)} />}
            {registerModalOpen && <RegisterModal close={() => setRegisterModalOpen(false)} />}
            {forgotPasswordModalOpen && (
                <ForgotPasswordModal close={() => setForgotPasswordModalOpen(false)} />
            )}
            {donateModalOpen && <DonateModal close={() => setDonateModalOpen(false)} />}
            {resetPasswordModalOpen && <ResetPasswordModal />}
            {imageUploadModalOpen && <GlobalImageUploadModal />}
        </>
    )
}

export default Modals
