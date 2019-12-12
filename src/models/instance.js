import { query } from '../services/instance';

// const buttonSelection = {
//   regions: [1],
//   sparkVersions: [],
//   sparkTypes: [],
//   slots: [
//     {
//         value: 'NaN',
//     },
//   ],
//   hdfsDatas: [{
//     value: '0',
//   },
//   ],
//   prices: [{
//       value: '0.1',
//       word: 'slot',
//     },
//     {
//       value: '0.0002',
//       word: 'disk',
//     },
//   ],
// };

export default {
  namespace: 'instance',
  state: {
    // buttonSelection,
    instance: [],
  },

  effects: {
    *query({ payload, callback }, { call, put }) {
      const response = yield call(query, payload);
      yield put({
        type: 'save',
        payload: response,
      });
      console.log(response);
      if (callback) callback(response);
    },
  },
  reducers: {
    save(state, action) {
      return {
        ...state,
        instance: action.payload,
      };
    },
  },
};
