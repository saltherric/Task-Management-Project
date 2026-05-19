// import { createSlice, current } from "@reduxjs/toolkit";
// import { getAuthState } from '../../app/auth';

// const initialState = {
//     users: [],
//     ...getAuthState(),
// };

// const authSlice = createSlice ({
//     name: "auth",
//     initialState,
//     reducers: {
//         register: (state, action) => {
//             state.users.push(action.payload);
//         },

//         login: (state, action) => {
//             state.currentUser = action.payload;
//             state.isAuthenticated = true;
//         },

//         logout: (state) => {
//             state.currentUser = null;
//             state.isAuthenticated = false;
//         },
//     },
// });

// export const {
//     register,
//     login,
//     logout
// } = authSlice.actions;

// export default authSlice.reducer;