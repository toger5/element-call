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

import { describe, expect, test, vi } from "vitest";
import { render, configure } from "@testing-library/react";

import { Toast } from "../src/Toast";
import { withFakeTimers } from "./utils/test";

configure({
  defaultHidden: true,
});

describe("Toast", () => {
  test("renders", () => {
    const { queryByRole } = render(
      <Toast open={false} onDismiss={() => {}}>
        Hello world!
      </Toast>,
    );
    expect(queryByRole("dialog")).toBe(null);
    const { getByRole } = render(
      <Toast open={true} onDismiss={() => {}}>
        Hello world!
      </Toast>,
    );
    expect(getByRole("dialog")).toMatchSnapshot();
  });

  test("dismisses itself after the specified timeout", () => {
    withFakeTimers(() => {
      const onDismiss = vi.fn();
      render(
        <Toast open={true} onDismiss={onDismiss} autoDismiss={2000}>
          Hello world!
        </Toast>,
      );
      vi.advanceTimersByTime(2000);
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
