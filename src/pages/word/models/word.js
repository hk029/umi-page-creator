export default {
  namespace: 'word',

  state: {
    text: '',
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(() => 'Awesome!');
      yield put({
        type: 'setText',
        payload: { text: response },
      });
    },
  },

  reducers: {
    setText(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, query }) => {
        if (pathname === '/word') {
          dispatch({ type: 'fetch', payload: query });
        }
      });
    },
  },
};
