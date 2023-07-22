import AlertModal from '@components/modals/AlertModal'
import DonateModal from '@components/modals/DonateModal'
import ForgotPasswordModal from '@components/modals/ForgotPasswordModal'
import GlobalImageUploadModal from '@components/modals/GlobalImageUploadModal'
import LogInModal from '@components/modals/LogInModal'
import RegisterModal from '@components/modals/RegisterModal'
import ResetPasswordModal from '@components/modals/ResetPasswordModal'
import { AccountContext } from '@contexts/AccountContext'
import CreatePostModal from '@src/components/modals/CreatePostModal'
import CreateSpaceModal from '@src/components/modals/CreateSpaceModal'
import React, { useContext } from 'react'

function Modals(): JSX.Element {
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
        createPostModalOpen,
        createSpaceModalOpen,
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
            {createPostModalOpen && <CreatePostModal />}
            {createSpaceModalOpen && <CreateSpaceModal />}
        </>
    )
}

export default Modals
