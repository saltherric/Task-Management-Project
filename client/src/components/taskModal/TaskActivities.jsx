// import React, { useState } from "react";

// export default function TaskActivities({
//   activities = [],
// }) {
//   const [timelineExpanded, setTimelineExpanded] =
//     useState(false);

//   return (
//     <div className="border-t border-[#1C1D22] pt-4 space-y-2">
//       <button
//         onClick={() =>
//           setTimelineExpanded(
//             !timelineExpanded
//           )
//         }
//         className="w-full flex items-center justify-between text-neutral-400 hover:text-neutral-100 transition-colors"
//       >
//         <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
//           Recent Activity Logs
//         </span>

//         {timelineExpanded ? (
//           <i className="fa-solid fa-chevron-down text-neutral-500 text-xs"></i>
//         ) : (
//           <i className="fa-solid fa-chevron-right text-neutral-500 text-xs"></i>
//         )}
//       </button>

//       {timelineExpanded && (
//         <>
//           {activities.length > 0 ? (
//             <div className="relative pl-3 border-l-2 border-[#1E212A] space-y-4 text-xs pt-1.5">
//               {activities
//                 .slice(0, 10)
//                 .map((log, index) => (
//                   <div
//                     key={
//                       log._id ||
//                       log.id ||
//                       index
//                     }
//                     className="relative"
//                   >
//                     <div className="absolute -left-[18px] top-0.5 bg-[#090A0C] border-2 border-indigo-500/50 w-2.5 h-2.5 rounded-full" />

//                     <div className="space-y-0.5">
//                       <p className="text-[11px] text-neutral-300">
//                         <span className="font-bold text-neutral-200">
//                           {log.user ||
//                             "System"}
//                         </span>{" "}
//                         {log.action}
//                       </p>

//                       <span className="text-[9px] text-neutral-500 font-mono block">
//                         {log.timestamp
//                           ? new Date(
//                               log.timestamp
//                             ).toLocaleString()
//                           : "-"}
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           ) : (
//             <div className="bg-[#121316]/50 rounded-xl border border-[#1A1C20] p-3 text-center">
//               <p className="text-[11px] text-neutral-500">
//                 No activity recorded yet
//               </p>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }