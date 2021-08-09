import './App.css';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useLocation,
  RouteProps
} from 'react-router-dom';
import { Files } from '@tapis/tapis-typescript';
import {
  useFiles,
  useFilesQuery,
  useInfiniteFilesQuery,
  useFilesSWRInfinite
} from './hooks/useFiles';
import { useAuth } from './hooks/useAuth';
import { useState } from 'react';

// This example has 3 pages: a public page, a protected
// page, and a login screen. In order to see the protected
// page, you must first login. Pretty standard stuff.
//
// First, visit the public page. Then, visit the protected
// page. You're not yet logged in, so you are redirected
// to the login page. After you login, you are redirected
// back to the protected page.
//
// Notice the URL change each time. If you click the back
// button at this point, would you expect to go back to the
// login page? No! You're already logged in. Try it out,
// and you'll see you go back to the page you visited
// just *before* logging in, the public page.
const queryClient = new QueryClient();

/** For more details on
 * `authContext`, `ProvideAuth`, `useAuth` and `useProvideAuth`
 * refer to: https://usehooks.com/useAuth/
 */

function AuthButton() {
  const { data, error, logout } = useAuth();
  return data && !error ? (
    <p>
      Welcome!
      <button
        onClick={() => {
          logout();
        }}
      >
        Sign out
      </button>
    </p>
  ) : (
    <p>You are not logged in.</p>
  );
}

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
function PrivateRoute({ children, ...rest }: RouteProps) {
  const { data: token } = useAuth();
  return (
    <Route
      {...rest}
      render={({ location }: RouteProps) =>
        token ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}

interface StateType {
  from: {
    pathname: string;
  };
}
function LoginPage() {
  let location = useLocation<StateType>();
  let { from } = location.state || { from: { pathname: '/' } };
  const { login, loginStatus, loginError } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  return (
    <div>
      {loginError && <p>Error! Try logging in again! </p>}
      <p>You must log in to view the page at {from.pathname}</p>
      Username:
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
      ></input>
      <form
        onSubmit={e => {
          e.preventDefault();
          login({ username, password });
        }}
      >
        Password:
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        ></input>
      </form>
      <button onClick={() => login({ username, password })}>
        Log in (mutate) {loginStatus}
      </button>
    </div>
  );
}

function PublicPage() {
  return <h3>Public page</h3>;
}

function ProtectedQueryPage() {
  const { data, error, isLoading, isFetching } = useFilesQuery({
    systemId: 'tapisv3-storage',
    path: ''
  });
  return (
    <>
      <h3>Protected(swr)</h3>
      {isFetching && <div>is fetching...</div>}
      {error && <div>error!</div>}
      {isLoading && <div>loading...</div>}
      <ul>
        {data?.result?.map(file => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    </>
  );
}

function ProtectedInfiniteQueryPage() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteFilesQuery(
    {
      systemId: 'tapisv3-storage',
      path: '',
      limit: 10
    }
  );

  const allPages = data?.pages?.map(page => page.result ?? []) ?? [];
  const concatPages = ([] as Files.FileInfo[]).concat(...allPages);
  const nextPageCallback = () => {
    fetchNextPage();
  };

  return (
    <>
      <h3>Protected(swr)</h3>
      {isLoading && <div>loading...</div>}
      <ul>
        {concatPages.map(file => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
      <button onClick={nextPageCallback}>
        {hasNextPage ? 'fetch next' : 'no more to fetch'}
      </button>
    </>
  );
}

function ProtectedSWRPage() {
  const result = useFiles({ systemId: 'tapisv3-storage', path: '' }) || {};
  return (
    <>
      <h3>Protected(swr)</h3>
      {result.isValidating && <div>validating...</div>}
      <ul>
        {result.data?.result?.map(res => (
          <li key={res.name}>{res.name}</li>
        ))}
      </ul>
    </>
  );
}

function ProtectedInfiniteSWRPage() {
  const { size, setSize, fullListing, reachedEnd } = useFilesSWRInfinite({
    systemId: 'tapisv3-storage',
    path: '',
    limit: 10
  });

  return (
    <>
      <h3>Infinite Scroll(swr)</h3>
      <ul>
        {fullListing.map(file => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
      <button onClick={() => setSize(size + 1)}>
        {reachedEnd ? 'no more to fetch' : 'fetch next'}
      </button>
    </>
  );
}

export default function AuthExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div>
          <AuthButton />

          <ul>
            <li>
              <Link to="/public">Public Page</Link>
            </li>
            <li>
              <Link to="/protected">Protected Page (SWR)</Link>
            </li>
            <li>
              <Link to="/protectedinfiniteswr">
                Protected Page(SWR infinite scroll)
              </Link>
            </li>
            <li>
              <Link to="/protectedquery">Protected Page(react-query)</Link>
            </li>
            <li>
              <Link to="/protectedinfinitequery">
                Protected Page(react-query infinite scroll)
              </Link>
            </li>
          </ul>

          <Switch>
            <Route path="/public">
              <PublicPage />
            </Route>
            <Route path="/login">
              <LoginPage />
            </Route>
            <PrivateRoute path="/protected">
              <ProtectedSWRPage />
            </PrivateRoute>
            <PrivateRoute path="/protectedinfiniteswr">
              <ProtectedInfiniteSWRPage />
            </PrivateRoute>
            <PrivateRoute path="/protectedquery">
              <ProtectedQueryPage />
            </PrivateRoute>
            <PrivateRoute path="/protectedinfinitequery">
              <ProtectedInfiniteQueryPage />
            </PrivateRoute>
          </Switch>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
