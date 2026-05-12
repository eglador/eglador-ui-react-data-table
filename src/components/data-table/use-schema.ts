"use client";

import * as React from "react";
import type { ResourceSchema } from "./types";

const inflight = new Map<string, Promise<ResourceSchema>>();

export interface UseSchemaResult {
  schema: ResourceSchema | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useSchema(
  endpoint: string | null | undefined,
  headers?: Record<string, string> | (() => Record<string, string>),
): UseSchemaResult {
  const [schema, setSchema] = React.useState<ResourceSchema | null>(null);
  const [isLoading, setIsLoading] = React.useState(!!endpoint);
  const [error, setError] = React.useState<unknown>(null);
  const [tick, setTick] = React.useState(0);

  const headersRef = React.useRef(headers);
  headersRef.current = headers;

  React.useEffect(() => {
    if (!endpoint) {
      setSchema(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading((prev) => (schema ? prev : true));
    setError(null);
    let cancelled = false;

    const sep = endpoint.includes("?") ? "&" : "?";
    const bustUrl = `${endpoint}${sep}_t=${Date.now()}`;
    const inflightKey = endpoint;

    let promise = inflight.get(inflightKey);
    if (!promise) {
      const h = headersRef.current;
      const resolvedHeaders = typeof h === "function" ? h() : h;
      promise = fetch(bustUrl, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          ...(resolvedHeaders ?? {}),
        },
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(
            `Schema fetch failed (${res.status} ${res.statusText})`,
          );
        }
        const body = (await res.json()) as {
          data?: Partial<ResourceSchema>;
          meta?: ResourceSchema["meta"];
        };
        const dataObj = body.data ?? (body as Partial<ResourceSchema>);
        return {
          ...(dataObj as ResourceSchema),
          meta: dataObj?.meta ?? body.meta,
        } satisfies ResourceSchema;
      });
      inflight.set(inflightKey, promise);
    }

    promise
      .then((data) => {
        if (cancelled) return;
        inflight.delete(inflightKey);
        setSchema(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        inflight.delete(inflightKey);
        setError(err);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  return { schema, isLoading, error, refresh };
}

export function inferSchemaEndpoint(endpoint: string): string {
  const queryIndex = endpoint.indexOf("?");
  const path = queryIndex === -1 ? endpoint : endpoint.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : endpoint.slice(queryIndex);
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return `schema/${path}${query}`;
  return path.slice(0, lastSlash) + "/schema" + path.slice(lastSlash) + query;
}
