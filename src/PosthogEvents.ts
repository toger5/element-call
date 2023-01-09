/*
Copyright 2022 The New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  IPosthogEvent,
  PosthogAnalytics,
  RegistrationType,
} from "./PosthogAnalytics";

type IpType = "IpV6" | "IpV4";

interface CallEnded extends IPosthogEvent {
  eventName: "CallEnded";
  callId: string;
  callParticipantsOnLeave: number;
  callParticipantsMax: number;
  callDuration: number;
  iceDelaySum: number;
  iceDelayAverage: number;
  iceDelayMax: number;
  ipType: IpType;
  usesTurn: boolean;
}

export class CallEndedTracker {
  DEFAULT_CACHE = {
    startTime: new Date(0),
    maxParticipantsCount: 0,
    iceDelays: [],
    ipType: undefined,
    usesTurn: undefined,
  };

  private cache: {
    startTime: Date;
    maxParticipantsCount: number;
    iceDelays: number[];
    ipType?: IpType;
    usesTurn?: boolean;
  } = this.DEFAULT_CACHE;

  cacheStartCall(time: Date) {
    this.cache.startTime = time;
  }

  cacheParticipantCountChanged(count: number) {
    this.cache.maxParticipantsCount = Math.max(
      count,
      this.cache.maxParticipantsCount
    );
  }

  // NOTE usage:
  // PosthogAnalytics.instance.eventCallEnded.setIpType()
  // PosthogAnalytics.instance.eventCallEnded.setUsesTurn()
  // PosthogAnalytics.instance.eventCallEnded.addIceDelay()
  // these need to called anywhere during or before each call.

  setIpType(ipType: IpType) {
    this.cache.ipType = ipType;
  }
  setUsesTurn(usesTurn: boolean) {
    this.cache.usesTurn = usesTurn;
  }
  // this has to be called once per other user in every call. After each call the list will be resetted.
  addIceDelay(iceDelay: number) {
    this.cache.iceDelays.push(iceDelay);
  }

  track(callId: string, callParticipantsNow: number, sendInstantly: boolean) {
    const iceDelaySum = this.cache.iceDelays.reduce(
      (sum, delay) => sum + delay,
      0
    );
    PosthogAnalytics.instance.trackEvent<CallEnded>(
      {
        eventName: "CallEnded",
        callId: callId,
        callParticipantsMax: this.cache.maxParticipantsCount,
        callParticipantsOnLeave: callParticipantsNow,
        callDuration: (Date.now() - this.cache.startTime.getTime()) / 1000,
        iceDelaySum: iceDelaySum,
        iceDelayAverage: iceDelaySum / this.cache.iceDelays.length,
        iceDelayMax: Math.max(...this.cache.iceDelays),
        ipType: this.cache.ipType,
        usesTurn: this.cache.usesTurn,
      },
      { send_instantly: sendInstantly }
    );
    // reset cache:
    this.cache = this.DEFAULT_CACHE;
  }
}

interface CallStarted extends IPosthogEvent {
  eventName: "CallStarted";
  callId: string;
}

export class CallStartedTracker {
  track(callId: string) {
    PosthogAnalytics.instance.trackEvent<CallStarted>({
      eventName: "CallStarted",
      callId: callId,
    });
  }
}

interface Signup extends IPosthogEvent {
  eventName: "Signup";
  signupDuration: number;
}

export class SignupTracker {
  private cache: { signupStart: Date; signupEnd: Date } = {
    signupStart: new Date(0),
    signupEnd: new Date(0),
  };

  cacheSignupStart(time: Date) {
    this.cache.signupStart = time;
  }

  getSignupEndTime() {
    return this.cache.signupEnd;
  }

  cacheSignupEnd(time: Date) {
    this.cache.signupEnd = time;
  }

  track() {
    PosthogAnalytics.instance.trackEvent<Signup>({
      eventName: "Signup",
      signupDuration: Date.now() - this.cache.signupStart.getTime(),
    });
    PosthogAnalytics.instance.setRegistrationType(RegistrationType.Registered);
  }
}

interface Login extends IPosthogEvent {
  eventName: "Login";
}

export class LoginTracker {
  track() {
    PosthogAnalytics.instance.trackEvent<Login>({
      eventName: "Login",
    });
    PosthogAnalytics.instance.setRegistrationType(RegistrationType.Registered);
  }
}

interface MuteMicrophone {
  eventName: "MuteMicrophone";
  targetMuteState: "mute" | "unmute";
  callId: string;
}

export class MuteMicrophoneTracker {
  track(targetIsMute: boolean, callId: string) {
    PosthogAnalytics.instance.trackEvent<MuteMicrophone>({
      eventName: "MuteMicrophone",
      targetMuteState: targetIsMute ? "mute" : "unmute",
      callId,
    });
  }
}

interface MuteCamera {
  eventName: "MuteCamera";
  targetMuteState: "mute" | "unmute";
  callId: string;
}

export class MuteCameraTracker {
  track(targetIsMute: boolean, callId: string) {
    PosthogAnalytics.instance.trackEvent<MuteCamera>({
      eventName: "MuteCamera",
      targetMuteState: targetIsMute ? "mute" : "unmute",
      callId,
    });
  }
}
