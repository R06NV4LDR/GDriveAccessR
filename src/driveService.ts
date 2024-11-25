import {google, drive_v3, Auth} from "googleapis";
import fs from "fs";
import readline from "readline";

export function initializeDrive(auth: Auth.OAuth2Client): drive_v3.Drive {
 return google.drive({version: 'v3', auth});
}