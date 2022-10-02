import { ServiceAccountCredentials } from "google-spreadsheet";

// const serviceAccountPublic = {
//   type: "service_account",
//   project_id: "filmcast-film-club-scheduler",
//   auth_uri: "https://accounts.google.com/o/oauth2/auth",
//   token_uri: "https://oauth2.googleapis.com/token",
//   auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//   client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/filmclubber%40filmcast-film-club-scheduler.iam.gserviceaccount.com"
// }

export function getServiceAccountCredentials(): ServiceAccountCredentials {
  return {
    // ...serviceAccountPublic,
    // private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // client_id: process.env.GOOGLE_CLIENT_ID
  };
}

