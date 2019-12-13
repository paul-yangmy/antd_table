import React from 'react';
import Redirect from 'umi/redirect';
import { connect } from 'dva';
import pathToRegexp from 'path-to-regexp';
import Authorized from '@/utils/Authorized';
import { stringify } from 'querystring';

const getRouteAuthority = (path, routeData) => {
  let authorities;
  routeData.forEach(route => {
    if (route.authority) {
      authorities = route.authority;
    } // match prefix

    if (pathToRegexp(`${route.path}(.*)`).test(path)) {
      // exact match
      if (route.path === path) {
        authorities = route.authority || authorities;
      } // get children authority recursively

      if (route.routes) {
        authorities = getRouteAuthority(path, route.routes) || authorities;
      }
    }
  });
  return authorities;
};

const AuthComponent = ({
  children,
  route = {
    routes: [],
  },
  location = {
    pathname: '',
  },
  user,
}) => {
  const { currentUser } = user;
  const { routes = [] } = route;
  const timeInterval = currentUser.logdate - localStorage.getItem('logInDate') <= 1000000;
  const isLogin = currentUser && currentUser.userid && timeInterval;
  const queryString = stringify({
    redirect: window.location.href,
  });
  return (
    <Authorized
      authority={getRouteAuthority(location.pathname, routes) || ''}
      noMatch={isLogin ? <Redirect to="/exception/403" /> : <Redirect to={`/user/login?${queryString}`} />}
    >
      {children}
    </Authorized>
  );
};

export default connect(({ user }) => ({
  user,
}))(AuthComponent);
