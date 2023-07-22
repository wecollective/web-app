/* eslint-disable camelcase */
export interface ISpace {
    id: number
    handle: string
    name: string
    description: string
    flagImagePath: string
    coverImagePath: string
    createdAt: string
    totalSpaces: number
    totalPosts: number
    totalUsers: number
    totalFollowers: number
    totalComments: number
    totalReactions: number
    totalLikes: number
    totalRatings: number
    // includes
    Creator: Partial<IUser>
    DirectChildSpaces: Partial<ISpace[]>
    DirectParentSpaces: Partial<ISpace[]>
    SpaceAncestors: { handle: string }[]
}

export interface IPost {
    id: number
    type: string
    subType: string
    text: string
    url: string | null
    urlDescription: string | null
    urlDomain: string | null
    urlImage: string | null
    urlTitle: string | null
    createdAt: string
    accountLike: number
    accountLinks: number
    accountRating: number
    accountRepost: number
    totalComments: number
    totalLikes: number
    totalLinks: number
    totalRatingPoints: number
    totalRatings: number
    totalReactions: number
    totalReposts: number
    // includes (todo: capitalise)
    creator: Partial<IUser>
    spaces: Partial<ISpace[]>
    PollAnswers: IPollAnswer[]
    DirectSpaces: any[]
    IndirectSpaces: any[]
    Links: any[]
}

export interface IUser {
    id: number
    handle: string
    name: string
    bio: string
    unseenNotifications?: number
    coverImagePath: string
    flagImagePath: string
    createdAt: string
    totalPosts: number
    totalComments: number
    // includes
    FollowedSpaces: Partial<ISpace[]>
    ModeratedSpaces: Partial<ISpace[]>
}

export interface IComment {
    id: number
    text: string
}

export interface IPrism {
    id: number
    postId: number
    numberOfPlayers: number
    duration: string
    privacy: string
    createdAt: string
    // includes
    User: Partial<IUser>
}

export interface IPollAnswer {
    id: number
    value: number
    totalVotes: number
    totalScore: number
}

export interface ISpaceHighlights {
    TopPosts: IPost[]
    TopSpaces: ISpace[]
    TopUsers: IUser[]
}

export interface ISpaceMapData {
    id: number
    children: any
}

export interface IAccountContext {
    loggedIn: boolean
    accountData: any
    setAccountData: (payload: any) => void
    accountDataLoading: boolean
    setAccountDataLoading: (payload: boolean) => void
    // modals (todo: most to be removed...)
    alertModalOpen: boolean
    setAlertModalOpen: (payload: boolean) => void
    alertMessage: string
    setAlertMessage: (payload: string) => void
    authModalOpen: boolean
    setAuthModalOpen: (payload: boolean) => void
    logInModalOpen: boolean
    setLogInModalOpen: (payload: boolean) => void
    registerModalOpen: boolean
    setRegisterModalOpen: (payload: boolean) => void
    forgotPasswordModalOpen: boolean
    setForgotPasswordModalOpen: (payload: boolean) => void
    createPostModalSettings: any
    setCreatePostModalSettings: (payload: any) => void
    createPostModalOpen: boolean
    setCreatePostModalOpen: (payload: boolean) => void
    createSpaceModalOpen: boolean
    setCreateSpaceModalOpen: (payload: boolean) => void
    createCommentModalOpen: boolean
    setCreateCommentModalOpen: (payload: boolean) => void
    settingModalOpen: boolean
    setSettingModalOpen: (payload: boolean) => void
    settingModalType: string
    setSettingModalType: (payload: string) => void
    imageUploadModalOpen: boolean
    setImageUploadModalOpen: (payload: boolean) => void
    imageUploadType: string
    setImageUploadType: (payload: string) => void
    resetPasswordModalOpen: boolean
    setResetPasswordModalOpen: (payload: boolean) => void
    resetPasswordToken: string | null
    setResetPasswordToken: (payload: string | null) => void
    donateModalOpen: boolean
    setDonateModalOpen: (payload: boolean) => void
    pageBottomReached: boolean
    setPageBottomReached: (payload: boolean) => void
    // functions
    getAccountData: () => void
    updateAccountData: (key: string, payload: any) => void
    logOut: () => void
}

export interface ISpaceContext {
    spaceData: any
    setSpaceData: (payload: any) => void
    isFollowing: boolean
    setIsFollowing: (payload: boolean) => void
    isModerator: boolean
    selectedSpaceSubPage: string
    setSelectedSpaceSubPage: (payload: string) => void
    fullScreen: boolean
    setFullScreen: (payload: boolean) => void

    spaceNotFound: boolean
    spacePostsLoading: boolean
    setSpacePostsLoading: (payload: boolean) => void
    nextSpacePostsLoading: boolean
    spaceSpacesLoading: boolean
    setSpaceSpacesLoading: (payload: boolean) => void
    nextSpaceSpacesLoading: boolean
    spacePeopleLoading: boolean
    setSpacePeopleLoading: (payload: boolean) => void
    nextSpacePeopleLoading: boolean

    spacePosts: any[]
    setSpacePosts: (payload: any[]) => void
    totalMatchingPosts: number
    spacePostsFilters: any
    spacePostsPaginationLimit: number
    spacePostsPaginationOffset: number
    spacePostsPaginationHasMore: boolean
    postMapData: any
    setPostMapData: (paylod: any) => void

    spaceCircleData: any
    setSpaceCircleData: (paylod: any) => void
    spaceTreeData: any
    setSpaceTreeData: (paylod: any) => void
    spaceListData: any[]
    setSpaceListData: (payload: any[]) => void
    spaceSpacesFilters: any
    spaceSpacesPaginationLimit: number
    spaceSpacesPaginationOffset: number
    spaceSpacesPaginationHasMore: boolean

    spacePeople: any[]
    spacePeopleFilters: any
    spacePeoplePaginationLimit: number
    spacePeoplePaginationOffset: number
    spacePeoplePaginationHasMore: boolean

    getSpaceData: (handle: string, callback?: any) => void
    getSpacePosts: (spaceId: number, offset: number, limit: number, params: any) => void
    getPostMapData: (spaceId: number, params: any, limit: number) => void
    getSpaceListData: (spaceId: number, offset: number, limit: number, params: any) => void
    getSpaceMapData: (spaceId: number, params: any) => void
    getSpaceMapChildren: (spaceId: number, offset: number, params: any, isParent: boolean) => any
    getSpacePeople: (spaceId: number, offset: number, limit: number, params: any) => void

    resetSpaceData: () => void
    resetSpacePosts: () => void
    resetSpaceListData: () => void
    resetSpacePeople: () => void
}

export interface IPostContext {
    selectedSubPage: string
    setSelectedSubPage: (payload: string) => void
    postData: any
    setPostData: (payload: any) => void
    postDataLoading: boolean
    postState: string
    // functions
    getPostData: (payload: number) => void
    resetPostContext: () => void
}

export interface IUserContext {
    isOwnAccount: boolean
    selectedUserSubPage: string
    setSelectedUserSubPage: (payload: string) => void
    userData: any // Partial<IUser>
    setUserData: (payload: any) => void
    userNotFound: boolean
    userPosts: IPost[]
    setUserPosts: (payload: any) => void
    userPostsLoading: boolean
    setUserPostsLoading: (payload: boolean) => void
    nextUserPostsLoading: boolean
    userPostsFilters: any
    userPostsFiltersOpen: boolean
    setUserPostsFiltersOpen: (payload: boolean) => void
    userPostsPaginationLimit: number
    userPostsPaginationOffset: number
    userPostsPaginationHasMore: boolean
    // functions
    getUserData: (handle: string, returnFunction?: any) => void
    getUserPosts: (userId: number, offset: number, limit: number, params: any) => void
    updateUserPostsFilter: (key: string, payload: string) => void
    resetUserData: () => void
    resetUserPosts: () => void
}
