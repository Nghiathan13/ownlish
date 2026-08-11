export type GoogleCodeResponse = {
  code?: string;
};

export type GoogleCodeClient = {
  requestCode: () => void;
};

export type GoogleIdentityApi = {
  accounts: {
    oauth2: {
      initCodeClient: (config: {
        callback: (response: GoogleCodeResponse) => void;
        client_id: string;
        error_callback: () => void;
        scope: string;
        ux_mode: "popup";
      }) => GoogleCodeClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

export function isGoogleIdentityReady(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      window.google?.accounts?.oauth2?.initCodeClient,
  );
}
