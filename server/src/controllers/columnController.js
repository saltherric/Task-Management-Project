const { getColumns: getColumnsService } = require("../services/columnService");

const getColumns = async (req, res, next) => {
   try {
      const columns = await getColumnsService({
         projectId: req.params.projectId,
         user: req.user,
      });

      res.status(200).json({
         success: true,
         columns,
      });
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getColumns,
};