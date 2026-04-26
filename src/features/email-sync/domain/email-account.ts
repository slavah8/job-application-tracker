export type EmailAccountConnection = {
  provider: "YAHOO" | "GMAIL" | "OUTLOOK" | "IMAP";
  emailAddress: string;
  displayName?: string;
};
