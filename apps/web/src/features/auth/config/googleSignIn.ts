export const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const isGoogleSignInConfigured = Boolean(GOOGLE_CLIENT_ID);
