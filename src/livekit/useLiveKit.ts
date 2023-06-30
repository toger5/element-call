import { Room, RoomOptions } from "livekit-client";
import { useLiveKitRoom, useToken } from "@livekit/components-react";
import { useMemo } from "react";

import { defaultLiveKitOptions } from "./options";

export type UserChoices = {
  audio?: DeviceChoices;
  video?: DeviceChoices;
};

export type DeviceChoices = {
  selectedId: string;
  enabled: boolean;
};

export type LiveKitConfig = {
  sfuUrl: string;
  jwtUrl: string;
  roomName: string;
  userDisplayName: string;
  userIdentity: string;
};

export function useLiveKit(
  userChoices: UserChoices,
  config: LiveKitConfig
): Room | undefined {
  const tokenOptions = useMemo(
    () => ({
      userInfo: {
        name: config.userDisplayName,
        identity: config.userIdentity,
      },
    }),
    [config.userDisplayName, config.userIdentity]
  );
  const token = useToken(config.jwtUrl, config.roomName, tokenOptions);

  const roomOptions = useMemo((): RoomOptions => {
    const options = defaultLiveKitOptions;
    options.videoCaptureDefaults = {
      ...options.videoCaptureDefaults,
      deviceId: userChoices.video?.selectedId,
    };
    options.audioCaptureDefaults = {
      ...options.audioCaptureDefaults,
      deviceId: userChoices.audio?.selectedId,
    };
    return options;
  }, [userChoices.video, userChoices.audio]);

  const { room } = useLiveKitRoom({
    token,
    serverUrl: config.sfuUrl,
    audio: userChoices.audio?.enabled ?? false,
    video: userChoices.video?.enabled ?? false,
    options: roomOptions,
  });

  return room;
}
