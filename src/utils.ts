import { Files, Authenticator } from '@tapis/tapis-typescript';
import Cookies from 'js-cookie';

export async function listFiles(
  params: Files.ListFilesRequest
): Promise<Files.FileListingResponse> {
  const config = new Files.Configuration({
    basePath: 'https://tacc.tapis.io',
    headers: {
      'x-tapis-token': Cookies.get('swr-token') || ''
    }
  });
  const api = new Files.FileOperationsApi(config);
  const response = await api.listFiles(params);
  return response;
}

export interface TapisPasswordCredentials {
  username: string;
  password: string;
}
export async function tapisLogin({
  username,
  password
}: TapisPasswordCredentials): Promise<Authenticator.NewAccessTokenResponse> {

  const request: Authenticator.CreateTokenRequest = {
    reqCreateToken: {
      grant_type: 'password',
      username,
      password
    }
  };

  const config = new Authenticator.Configuration({
    basePath: 'https://tacc.tapis.io'
  });
  const api = new Authenticator.TokensApi(config);

  const response = await api.createToken(request);
  if (!response.result?.access_token)
    throw new Error('Could not parse access token from response.');
  return response.result.access_token;
}
