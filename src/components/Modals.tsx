import React, { useContext } from 'react'
import { AccountContext } from '@contexts/AccountContext'
import AlertModal from '@src/components/modals/AlertModal'
import NavbarDropDownModal from '@src/components/modals/NavbarDropDownModal'
import ImageUploadModal from '@src/components/modals/ImageUploadModal'
import CreatePostModal from '@src/components/modals/CreatePostModal'
import ResetPasswordModal from '@src/components/modals/ResetPasswordModal'
import LogInModal from '@src/components/modals/LogInModal'
import RegisterModal from '@src/components/modals/RegisterModal'
import ForgotPasswordModal from '@src/components/modals/ForgotPasswordModal'
import DonateModal from '@src/components/modals/DonateModal'

const Modals = (): JSX.Element => {
    const {
        alertModalOpen,
        logInModalOpen,
        setLogInModalOpen,
        registerModalOpen,
        setRegisterModalOpen,
        forgotPasswordModalOpen,
        setForgotPasswordModalOpen,
        navBarDropDownModalOpen,
        imageUploadModalOpen,
        createPostModalOpen,
        donateModalOpen,
        setDonateModalOpen,
        resetPasswordModalOpen,
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
            {navBarDropDownModalOpen && <NavbarDropDownModal />}
            {imageUploadModalOpen && <ImageUploadModal />}
            {createPostModalOpen && <CreatePostModal />}
            {resetPasswordModalOpen && <ResetPasswordModal />}
        </>
    )
}

export default Modals
