// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   tasks: [
//     {
//       id: 1,
//       title: "Learn React",
//       description: "Practice components",
//       priority: "Medium",
//       status: "Pending",
//     },

//     {
//       id: 2,
//       title: "Build Redux",
//       description: "Create store and slice",
//       priority: "High",
//       status: "In Progress",
//     },

//     {
//       id: 3,
//       title: "Setup Bootstrap",
//       description: "Install bootstrap package",
//       priority: "Low",
//       status: "Completed",
//     }
//   ]
// };

// const taskSlice = createSlice({
//   name: "tasks",
//   initialState,
//   reducers: {

//     addTask: (state, action) => {
//       state.tasks.push(action.payload);
//     },

//     updateTask: (state, action) => {
//       const updatedTask = action.payload;
//       const index = state.tasks.findIndex(
//         task => task.id === updatedTask.id
//       );
//       if (index !== -1) {
//         state.tasks[index] = updatedTask;
//       }
//     },

//     deleteTask: (state, action) => {
//       state.tasks = state.tasks.filter(
//         task => task.id !== action.payload
//       );
//     },

//     changeStatus: (state, action) => {
//       const { id, status } = action.payload;
//       const task = state.tasks.find(
//         task => task.id === id
//       );
//       if (task) {
//         task.status = status;
//       }
//     }
//   },
// });

// export const {
//   addTask,
//   deleteTask,
//   updateTask,
//   changeStatus,
// } = taskSlice.actions;

// export default taskSlice.reducer;