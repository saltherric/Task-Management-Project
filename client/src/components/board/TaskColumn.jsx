import TaskCard from "./TaskCard";

function TaskColumn({
   column,
   tasks
}) {

   return (

      <div className="bg-slate-100 rounded-lg p-3">

         <div className="mb-3">

            <h3 className="font-semibold">
               {column.name}
            </h3>

            <span>
               {tasks.length}
            </span>

         </div>

         <div className="space-y-3">

            {tasks.map(task => (

               <TaskCard
                  key={task._id}
                  task={task}
               />

            ))}

         </div>

      </div>

   );
}

export default TaskColumn;