const { 
    getAvailableAssignees: getAvailableAssigneesService, 
    assignUser: assignUserService,
    removeAssignee: removeAssigneeService,
} = require("../services/assignedToService");

const getAvailableAssignees = async (req, res, next) => {
    try {
        const assignees = await getAvailableAssigneesService(req.params.taskId);
        res.status(200).json({
            success: true,
            assignees
        });
    } catch (error) {
        next(error);
    }
}

const assignUser = async (req, res, next) => {
    try {
        const task = await assignUserService({
            taskId: req.params.taskId,
            userId: req.user
        })
        res.status(201).json({
            success: true,
            task,
        });
    } catch (error) {
        next(error);
    }
}

const removeAssignee = async (req, res, next) => {
    try {
        const task = await removeAssigneeService({
            taskId: req.params.taskId,
            userId: req.params.userId,
        });
        res.status(200).json({
            success: true,
            task
        })
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAvailableAssignees,
    assignUser,
    removeAssignee
}