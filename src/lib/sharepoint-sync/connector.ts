import * as spauth from "node-sp-auth";
import type { SharePointFile } from "./types";

export interface SharePointCredentials {
  username: string;
  password: string;
}

export interface ConnectorOptions {
  siteUrl: string;
  folderPath?: string;
  credentials?: SharePointCredentials;
}

interface SPAuthHeaders {
  headers: Record<string, string>;
  options: Record<string, unknown>;
}

export class SharePointConnector {
  private siteUrl: string;
  private folderPath: string;
  private credentials: SharePointCredentials;
  private authHeaders: SPAuthHeaders | null = null;

  constructor(options: ConnectorOptions) {
    this.siteUrl = (options.siteUrl || "").replace(/\/+$/, "");
    this.folderPath = options.folderPath || "/";
    this.credentials = options.credentials || {
      username: "",
      password: "",
    };
  }

  private async getAuthHeaders(): Promise<SPAuthHeaders> {
    if (this.authHeaders) return this.authHeaders;

    if (!this.siteUrl || !this.credentials.username || !this.credentials.password) {
      throw new Error("SharePoint URL, username, and password are required");
    }

    const authData = await spauth.getAuth(this.siteUrl, {
      username: this.credentials.username,
      password: this.credentials.password,
    });

    this.authHeaders = {
      headers: authData.headers as Record<string, string>,
      options: authData.options as Record<string, unknown>,
    };
    return this.authHeaders;
  }

  private async spFetch(apiPath: string): Promise<unknown> {
    const auth = await this.getAuthHeaders();
    const url = `${this.siteUrl}/_api/${apiPath}`;

    const res = await fetch(url, {
      headers: {
        ...auth.headers,
        Accept: "application/json;odata=verbose",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`SharePoint API error ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
  }

  private async spFetchBuffer(url: string): Promise<Buffer> {
    const auth = await this.getAuthHeaders();

    const res = await fetch(url, {
      headers: {
        ...auth.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`SharePoint download error ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async testConnection(): Promise<{ success: boolean; message: string; siteTitle?: string }> {
    try {
      const data = await this.spFetch("web?$select=Title,Url") as {
        d: { Title: string; Url: string };
      };
      return {
        success: true,
        message: `Connected to "${data.d.Title}" (${data.d.Url})`,
        siteTitle: data.d.Title,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, message };
    }
  }

  async listFiles(pattern?: string): Promise<SharePointFile[]> {
    const folderPath = this.folderPath.replace(/^\/+/, "").replace(/\/+$/, "");
    let serverRelativeUrl: string;

    if (folderPath) {
      // Get the server-relative URL of the site first
      const siteData = await this.spFetch("web?$select=ServerRelativeUrl") as {
        d: { ServerRelativeUrl: string };
      };
      const siteRelUrl = siteData.d.ServerRelativeUrl.replace(/\/+$/, "");
      serverRelativeUrl = `${siteRelUrl}/${folderPath}`;
    } else {
      const siteData = await this.spFetch("web?$select=ServerRelativeUrl") as {
        d: { ServerRelativeUrl: string };
      };
      serverRelativeUrl = siteData.d.ServerRelativeUrl.replace(/\/+$/, "") + "/Shared Documents";
    }

    const encodedPath = encodeURIComponent(serverRelativeUrl);
    const data = await this.spFetch(
      `web/GetFolderByServerRelativeUrl('${encodedPath}')/Files?$select=Name,ServerRelativeUrl,Length,TimeLastModified,ETag,UniqueId`
    ) as {
      d: {
        results: Array<{
          Name: string;
          ServerRelativeUrl: string;
          Length: string;
          TimeLastModified: string;
          ETag: string;
          UniqueId: string;
        }>;
      };
    };

    const filePattern = pattern || "*.xlsx";
    const regex = new RegExp(
      "^" + filePattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$",
      "i"
    );

    const files: SharePointFile[] = [];
    for (const item of data.d.results || []) {
      if (!regex.test(item.Name)) continue;

      files.push({
        id: item.UniqueId,
        name: item.Name,
        path: item.ServerRelativeUrl,
        size: parseInt(item.Length) || 0,
        lastModified: new Date(item.TimeLastModified),
        eTag: item.ETag || null,
      });
    }

    return files;
  }

  async downloadFile(serverRelativeUrl: string): Promise<Buffer> {
    const encodedPath = encodeURIComponent(serverRelativeUrl);
    const url = `${this.siteUrl}/_api/web/GetFileByServerRelativeUrl('${encodedPath}')/$value`;
    return this.spFetchBuffer(url);
  }
}
