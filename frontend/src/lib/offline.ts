export type Prepared = {
  build_id: string;
  application_commit: string;
  science_release: string;
  historical_release: string | null;
  files: number;
  bytes: number;
  prepared_at: string;
};
export type WorkerReply = {
  type: string;
  message?: string;
  done?: number;
  total?: number;
  bytes?: number;
  prepared?: Prepared | null;
  build_id?: string;
};
export async function offlineWorker() {
  if (!("serviceWorker" in navigator))
    throw Error("This browser does not support offline preparation.");
  const response = await fetch("/offline-index.json", { cache: "no-cache" });
  if (!response.ok || !response.headers.get("content-type")?.includes("json"))
    throw Error(
      "Offline preparation is available in the production build. Run npm run build, then npm run preview.",
    );
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.update();
  const worker =
    registration.installing ?? registration.waiting ?? registration.active;
  if (!worker) throw Error("Offline worker unavailable");
  if (worker.state === "installing")
    await new Promise<void>((resolve, reject) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" || worker.state === "activated")
          resolve();
        if (worker.state === "redundant")
          reject(Error("Offline worker installation failed"));
      });
    });
  return {
    registration,
    worker: registration.waiting ?? registration.active ?? worker,
  };
}
export function workerMessage(
  worker: ServiceWorker,
  type: string,
  release?: string,
  onProgress?: (reply: WorkerReply) => void,
) {
  return new Promise<WorkerReply>((resolve, reject) => {
    const channel = new MessageChannel(),
      timer = window.setTimeout(() => {
        channel.port1.close();
        reject(
          Error(
            "Offline preparation timed out. Your previous prepared version is retained.",
          ),
        );
      }, 120000);
    channel.port1.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
      if (data.type === "progress") {
        onProgress?.(data);
        return;
      }
      clearTimeout(timer);
      channel.port1.close();
      data.type === "error" ? reject(Error(data.message)) : resolve(data);
    };
    worker.postMessage({ type, release }, [channel.port2]);
  });
}
