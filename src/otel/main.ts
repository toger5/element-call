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

import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { trace } from "@opentelemetry/api";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

// This is how we can make Jaeger show a reasonable service in the dropdown on the left.
const provider = new WebTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "matrix-js-sdk",
  }),
});

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new ZipkinExporter({
      url: `http://localhost:9411/api/v2/spans`,
      // serviceName: SERVICE_NAME,
      headers: {
        "Content-Type": "application/json",
      },
    })
  )
);

provider.register({
  // Changing default contextManager to use ZoneContextManager - supports asynchronous operations - optional
  contextManager: new ZoneContextManager(),
});

// Registering instrumentations
registerInstrumentations({
  instrumentations: [
    // new DocumentLoadInstrumentation(),
    // new UserInteractionInstrumentation(),
  ],
});

trace.setGlobalTracerProvider(provider);
export const tracer = trace.getTracer("matrix-js-sdk-otl-tracer");
