function BoardHeader({ project }) {

   if(!project){
      return null;
   }

   return (
      <div className="mb-6">

         <h1 className="text-2xl font-bold">
            {project.name}
         </h1>

         <p className="text-slate-500">
            {project.description}
         </p>

      </div>
   );
}

export default BoardHeader;