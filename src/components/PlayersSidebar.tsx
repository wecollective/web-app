/* eslint-disable react/require-default-props */
/* eslint-disable react/function-component-definition */
import { BaseUser } from '@src/Helpers'
import { AccountContext } from '@src/contexts/AccountContext'
import { Streaming } from '@src/hooks/use-streaming'
import { HereIcon, PlusIcon, VideoIcon } from '@src/svgs/all'
import React, { FC, useContext } from 'react'
import Button from './Button'
import Column from './Column'
import { Video } from './GameRoom'
import Row from './Row'
import UserButton from './UserButton'
import { Players, UserList } from './cards/GameCard'
import PlainButton from './modals/PlainButton'

const StreamingUsers: FC<{ streaming: Streaming }> = ({ streaming }) => {
    const { accountData } = useContext(AccountContext)
    const userIsStreaming = false
    const loadingStream = false
    const userData = {
        id: accountData.id,
        handle: accountData.handle,
        name: accountData.name || 'Anonymous',
        flagImagePath: accountData.flagImagePath,
    }

    return (
        <Column style={{ marginBottom: 15, flexShrink: 1 }}>
            <Row style={{ marginBottom: 10 }} centerY>
                <VideoIcon style={{ width: 30, height: 30, marginRight: 10, color: '#c5c5c7' }} />
                <h4 style={{ color: '#c5c5c7' }}>Streaming</h4>
            </Row>
            <Column>
                <Button
                    text={`${userIsStreaming ? 'Stop' : 'Start'} streaming`}
                    color={userIsStreaming ? 'red' : 'aqua'}
                    style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                    loading={loadingStream}
                    disabled={loadingStream}
                    onClick={() => streaming.toggleStream()}
                />
                {streaming.userIsStreaming && (
                    <Video
                        id='your-video'
                        user={userData}
                        audioEnabled={streaming.audioTrackEnabled}
                        videoEnabled={streaming.videoTrackEnabled}
                        toggleAudio={streaming.toggleAudioTrack}
                        toggleVideo={streaming.toggleVideoTrack}
                        audioOnly={streaming.audioOnly}
                    />
                )}
                {streaming.videos.map((video) => (
                    <Row key={video.socketId} centerY style={{ marginBottom: 10 }}>
                        <UserButton user={video.userData} imageSize={35} maxChars={18} />
                        <Video
                            key={video.socketId}
                            id={video.socketId}
                            user={video.userData}
                            audioOnly={video.audioOnly}
                            refreshStream={streaming.refreshStream}
                        />
                    </Row>
                ))}
            </Column>
        </Column>
    )
}

const PlayersSidebar: FC<{
    players: BaseUser[]
    setPlayers?: (players: BaseUser[]) => void
    present: BaseUser[]
    streaming: Streaming
}> = ({ players, setPlayers, present, streaming }) => {
    return (
        <Column
            style={{ height: '100%', width: 300, padding: 10, borderLeft: '1px solid #ededef' }}
        >
            <Players players={players} setPlayers={setPlayers} />
            <UserList
                title='Present'
                Icon={HereIcon}
                users={present}
                userChildren={(user) =>
                    setPlayers &&
                    user.id &&
                    !players.some((player) => player.id === user.id) && (
                        <PlainButton
                            size={17}
                            style={{ marginLeft: 5 }}
                            onClick={() => setPlayers([...players, user])}
                        >
                            <PlusIcon />
                        </PlainButton>
                    )
                }
            />
            <StreamingUsers streaming={streaming} />
        </Column>
    )
}

export default PlayersSidebar
