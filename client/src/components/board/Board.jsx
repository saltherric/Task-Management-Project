import TaskColumn from "./TaskColumn";

function Board({
   columns,
   tasks
}) {

   return (

      <div className="grid grid-cols-4 gap-4">

         {columns.map(column => {

            const columnTasks = tasks.filter(
               task =>
                  task.column === column._id ||
                  task.column?._id === column._id
            );

            return (

               <TaskColumn
                  key={column._id}
                  column={column}
                  tasks={columnTasks}
               />

            );
         })}

      </div>

   );
}

export default Board;