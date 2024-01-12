import AlertModal from '@components/modals/AlertModal'
import ClaimAccountModal from '@components/modals/ClaimAccountModal'
import CreatePostModal from '@components/modals/CreatePostModal'
import CreateSpaceModal from '@components/modals/CreateSpaceModal'
import DonateModal from '@components/modals/DonateModal'
import DropModal from '@components/modals/DropModal'
import ForgotPasswordModal from '@components/modals/ForgotPasswordModal'
import GlobalImageUploadModal from '@components/modals/GlobalImageUploadModal'
import LogInModal from '@components/modals/LogInModal'
import RegisterModal from '@components/modals/RegisterModal'
import ResetPasswordModal from '@components/modals/ResetPasswordModal'
import { AccountContext } from '@contexts/AccountContext'
import React, { useContext } from 'react'

// todo: remove close props and use account context in modals
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
        claimAccountModalOpen,
        setClaimAccountModalOpen,
        resetPasswordModalOpen,
        imageUploadModalOpen,
        createPostModalSettings,
        setCreatePostModalSettings,
        createSpaceModalOpen,
        dropModalOpen,
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
            {claimAccountModalOpen && (
                <ClaimAccountModal close={() => setClaimAccountModalOpen(false)} />
            )}
            {resetPasswordModalOpen && <ResetPasswordModal />}
            {imageUploadModalOpen && <GlobalImageUploadModal />}
            {createPostModalSettings && (
                <CreatePostModal
                    settings={createPostModalSettings}
                    onClose={() => setCreatePostModalSettings()}
                />
            )}
            {createSpaceModalOpen && <CreateSpaceModal />}
            {dropModalOpen && <DropModal />}
        </>
    )
}

export default Modals
