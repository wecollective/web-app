import React, { useContext } from 'react'
import { AccountContext } from '@contexts/AccountContext'
import AlertModal from '@src/components/modals/AlertModal'
import NavbarDropDownModal from '@src/components/modals/NavbarDropDownModal'
import ImageUploadModal from '@src/components/modals/ImageUploadModal'
import CreatePostModal from '@src/components/modals/CreatePostModal'
// import CreateSpaceModal from './Modals/CreateSpaceModal'
// import CreateCommentModal from './Modals/CreateCommentModal'
// import SettingModal from '@components/Modals/SettingModal'
import ResetPasswordModal from '@src/components/modals/ResetPasswordModal'
import LogInModal from '@src/components/modals/LogInModal'
import RegisterModal from '@src/components/modals/RegisterModal'
import ForgotPasswordModal from '@src/components/modals/ForgotPasswordModal'

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
        // createSpaceModalOpen,
        // createCommentModalOpen,
        // settingModalOpen,
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
            {navBarDropDownModalOpen && <NavbarDropDownModal />}
            {imageUploadModalOpen && <ImageUploadModal />}
            {createPostModalOpen && <CreatePostModal />}
            {/* {createSpaceModalOpen && <CreateSpaceModal />} */}
            {/* {createCommentModalOpen && <CreateCommentModal />} */}
            {/* {settingModalOpen && <SettingModal />} */}
            {resetPasswordModalOpen && <ResetPasswordModal />}
        </>
    )
}

export default Modals
