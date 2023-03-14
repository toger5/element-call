/*
Copyright 2023 New Vector Ltd


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

import { context, Span, trace } from "@opentelemetry/api";
import {
  ClientEvent,
  GroupCall,
  MatrixClient,
  MatrixEvent,
  RoomStateEvent,
} from "matrix-js-sdk";
import { CallEvent } from "matrix-js-sdk/src/webrtc/call";
import { useCallback, useEffect, useState } from "react";

import { tracer } from "./main";

export const useCallEventInstrumentation = (
  client: MatrixClient,
  groupCall: GroupCall
): void => {
  const [groupCallSpan, setGroupCallSpan] = useState<Span | undefined>();
  const [groupCallId, setGroupCallId] = useState<string | undefined>();

  const startChildSpan = useCallback(
    (name: string, groupCallId: string): Span => {
      const traceId = "7b78c1f568312cb288e55a9bc3c28cc5";
      const spanId = "7d31f3e430d90882";

      const ctx = trace.setSpanContext(context.active(), {
        traceId,
        spanId,
        traceFlags: 1,
        isRemote: true,
      });

      console.log("LOG context", ctx);
      console.log(
        "LOG context valid",
        trace.isSpanContextValid(trace.getSpan(ctx).spanContext())
      );
      console.log("LOG parent span", trace.getSpan(ctx));

      return tracer.startSpan(name, undefined, ctx);
    },
    []
  );

  const onUpdateRoomState = (event?: MatrixEvent) => {
    const callStateEvent = groupCall.room.currentState.getStateEvents(
      "org.matrix.msc3401.call",
      groupCall.groupCallId
    );

    const memberStateEvents = groupCall.room.currentState.getStateEvents(
      "org.matrix.msc3401.call.member"
    );
  };

  const onReceivedVoipEvent = (event: MatrixEvent) => {};

  const onUndecryptableToDevice = (event: MatrixEvent) => {};

  const onSendVoipEvent = useCallback(
    (event: Record<string, unknown>) => {
      const span = startChildSpan(
        `element-call:send-voip-event:${event.eventType}`,
        groupCall.groupCallId
      );
      span.setAttribute("groupCallId", groupCall.groupCallId);

      console.log("LOG span", span);

      span.end();
    },
    [groupCall.groupCallId]
  );

  useEffect(() => {
    return;
    if (groupCallId === groupCall.groupCallId) return;

    console.log("LOG starting span", groupCall.groupCallId, groupCallId);

    groupCallSpan?.end();

    const newSpan = tracer.startSpan("element-call:group-call");
    newSpan.setAttribute("groupCallId", groupCall.groupCallId);
    setGroupCallSpan(newSpan);
    setGroupCallId(groupCall.groupCallId);
  }, [groupCallSpan, groupCallId, groupCall.groupCallId]);

  useEffect(() => () => {
    console.log("LOG ending span");

    groupCallSpan?.end();
  });

  useEffect(() => {
    client.on(RoomStateEvent.Events, onUpdateRoomState);
    //groupCall.on("calls_changed", onCallsChanged);
    groupCall.on(CallEvent.SendVoipEvent, onSendVoipEvent);
    //client.on("state", onCallsChanged);
    //client.on("hangup", onCallHangup);
    client.on(ClientEvent.ReceivedVoipEvent, onReceivedVoipEvent);
    client.on(ClientEvent.UndecryptableToDeviceEvent, onUndecryptableToDevice);

    onUpdateRoomState();

    return () => {
      client.removeListener(RoomStateEvent.Events, onUpdateRoomState);
      //groupCall.removeListener("calls_changed", onCallsChanged);
      groupCall.removeListener(CallEvent.SendVoipEvent, onSendVoipEvent);
      //client.removeListener("state", onCallsChanged);
      //client.removeListener("hangup", onCallHangup);
      client.removeListener(ClientEvent.ReceivedVoipEvent, onReceivedVoipEvent);
      client.removeListener(
        ClientEvent.UndecryptableToDeviceEvent,
        onUndecryptableToDevice
      );
    };
  }, [client, groupCall]);
};
