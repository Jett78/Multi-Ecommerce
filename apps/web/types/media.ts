export interface MediaFile {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
}

export interface MediaFolder {
  name: string;
  count: number;
}

export interface MediaListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: MediaFile[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount: number;
}

export interface MediaFoldersResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: MediaFolder[];
}
