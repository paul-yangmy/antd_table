import React from 'react';
import { connect } from 'dva';
import { Redirect } from 'umi';
import { stringify } from 'querystring';
import PageLoading from '@/components/PageLoading';
import moment from 'moment';

class SecurityLayout extends React.Component {
  state = {
    isReady: false,
  };

  componentDidMount() {
    // this.setState({
    //   isReady: true,
    // })
    const { dispatch } = this.props;
    if (dispatch) {
      dispatch({
        type: 'user/fetchCurrent',
        callback: () => {
          this.setState({
            isReady: true,
          });
        },
      });

    }

  }

  render() {
    const { isReady } = this.state;
    const { children, loading, currentUser } = this.props; // You can replace it to your authentication rule (such as check token exists)
    // 你可以把它替换成你自己的登录认证规则（比如判断 token 是否存在）
    // console.log(currentUser)
    currentUser.logdate = moment().valueOf();
    console.log(currentUser.logdate)
    const timeInterval = currentUser.logdate - localStorage.getItem('logInDate') <= 1000000;//1000s
    const isLogin = currentUser && currentUser.userid && timeInterval;
    console.log(isLogin);

    const queryString = stringify({
      redirect: window.location.href,
    });
    console.log(queryString);
    if ((!isLogin && loading) || !isReady) {
      return <PageLoading />;
    }
    if (!isLogin) {
      // return <Redirect to={`/user/login?${queryString}`}></Redirect>;
      return <Redirect to={`/user/login?${queryString}`}></Redirect>;
    }

    return children;
  }
}

export default connect(({ user, loading }) => ({
  currentUser: user.currentUser,
  loading: loading.models.user,
}))(SecurityLayout);
