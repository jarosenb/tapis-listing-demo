import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import useSWR from 'swr';
import Cookies from 'js-cookie';
import { useHistory, useLocation } from 'react-router-dom';

import { tapisLogin, TapisPasswordCredentials } from '../utils';

interface StateType {
  from: {
    pathname: string;
  };
}
// React-Query auth hook
export const useAuth = () => {
  const history = useHistory();
  let location = useLocation<StateType>();
  let { from } = location.state || { from: { pathname: '/' } };

  let { data, error, refetch } = useQuery<string | undefined>(
    'authcookie',
    () => Cookies.get('swr-token'),
    { initialData: Cookies.get('swr-token') }
  );

  let {
    mutate,
    status: loginStatus,
    error: loginError
  } = useMutation(tapisLogin, {
    onSuccess: async data => {
      const expires = new Date(data.expires_at ?? 0);
      Cookies.set('swr-token', data.access_token ?? '', { expires });
      await refetch();
      history.replace(from);
    }
  });

  const logout = async (): Promise<void> => {
    Cookies.remove('swr-token');
    await refetch();
    history.push('/');
  };

  return { data, error, loginStatus, loginError, login: mutate, logout };
};

// SWR auth hook
export const useAuth_ = () => {
  const history = useHistory();
  let location = useLocation<StateType>();
  let { from } = location.state || { from: { pathname: '/' } };
  let { data, error, mutate } = useSWR<string | undefined>(
    'authcookie',
    () => Cookies.get('swr-token'),
    { initialData: Cookies.get('swr-token') }
  );

  const [loginStatus, setLoginStatus] = useState<string>('idle');

  const login = async (creds: TapisPasswordCredentials): Promise<void> => {
    try {
      setLoginStatus('loading');
      const _data = await tapisLogin(creds);
      const expires = new Date(_data.expires_at ?? 0);
      Cookies.set('swr-token', _data.access_token ?? '', { expires });
      await mutate();
      history.replace(from);
    } catch (e) {
      setLoginStatus('error');
    } finally {
      setLoginStatus('success');
    }
  };

  const logout = async (): Promise<void> => {
    Cookies.remove('swr-token');
    await mutate();
    history.push('/');
  };

  return {
    data,
    error,
    loginStatus,
    loginError: loginStatus === 'error',
    login,
    logout
  };
};
