import useSWR, { SWRInfiniteResponse, useSWRInfinite } from 'swr';
import { useQuery, useInfiniteQuery } from 'react-query';
import { Files } from '@tapis/tapis-typescript';
import stringify from 'json-stable-stringify';
import { listFiles } from '../utils';

export function useFiles(params: Files.ListFilesRequest) {
  let result = useSWR<Files.FileListingResponse, Error>(
    stringify(params),
    (stringParams: string) => listFiles(JSON.parse(stringParams))
  );
  return result;
}

interface UseFilesSWRInfiniteResult extends SWRInfiniteResponse {
  fullListing: Files.FileInfo[];
  reachedEnd: boolean;
}
export function useFilesSWRInfinite(
  params: Files.ListFilesRequest
): UseFilesSWRInfiniteResult {
  const limit = params.limit ?? 100;

  const getKey = (
    pageIndex: number,
    previousPageData: Files.FileListingResponse | null
  ): string | null => {
    if (previousPageData && (previousPageData.result?.length ?? 0) < limit)
      return null;
    return stringify({ ...params, offset: pageIndex * limit });
  };

  const result = useSWRInfinite(getKey, (stringParams: string) =>
    listFiles(JSON.parse(stringParams))
  );

  const allPages = result.data?.map(page => page.result ?? []) ?? [];
  const fullListing = ([] as Files.FileInfo[]).concat(...allPages);

  const reachedEnd = result.data
    ? (result.data[result.data.length - 1]?.result ?? []).length < limit
    : false;

  return { ...result, fullListing, reachedEnd };
}

export function useFilesQuery(params: Files.ListFilesRequest) {
  const result = useQuery<Files.FileListingResponse, Error>([params], () =>
    listFiles(params)
  );
  return result;
}

export function useInfiniteFilesQuery(params: Files.ListFilesRequest) {
  const limit = params.limit ?? 100;
  const result = useInfiniteQuery<Files.FileListingResponse, Error>(
    [params],
    ({ pageParam = params }) => listFiles(pageParam),
    {
      getNextPageParam: (lastPage, allPages) => {
        if ((lastPage.result?.length ?? 0) < limit) return undefined;
        return { ...params, offset: allPages.length * limit };
      }
    }
  );

  return result;
}
