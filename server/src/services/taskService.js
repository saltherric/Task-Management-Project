const Task = require("../models/Task");
const Workspace = require("../models/Workspace");
const calculateSmartPriority = require("../utils/calculateSmartPriority");
const Project = require("../models/Project");

const createTask = async ({ taskData, user, project, column }) => {
    const smartPriorityScore = calculateSmartPriority(taskData.priority, taskData.dueDate);
    // get last task position
    const lastTask = await Task.findOne({
        column: column._id
    })
        .sort('-position')
        .select('position');

    // calculate next position
    const position = lastTask
        ? lastTask.position + 1
        : 1;
        
    const task = await Task.create({
        title: taskData.title,
        description: taskData.description,
        project: taskData.project,
        column: taskData.column,
        createdBy: user._id,
        assignedTo: taskData.assignedTo,
        status: taskData.status,
        priority: taskData.priority,
        smartPriorityScore,
        tags: taskData.tags,
        dueDate: taskData.dueDate,
        position,
    });

    // validate member in workspace 
    if( taskData.assignedTo && taskData.assignedTo.length > 0 ){
        // get workspace from project
        const workspace = await Workspace.findById( project.workspace );
        for(const userId of taskData.assignedTo){
            // validate user exists
            const user = await User.findById(userId);
            if(!user){
                throw new Error(
                    'Assigned user not found'
                );
            }
            
            // validate workspace membership
            const isMember = workspace.members.some(
                member => member.user.toString() === userId.toString()
            );

            if(!isMember){
                throw new Error('Assigned user is not workspace member');
            }
        }
    }
    return task;
};

const getTasks = async (projectId, user) => {

    const project = await Project.findById(projectId);

    if (!project) {
        throw new Error("Project not found");
    }

    const workspace = await Workspace.findOne({
        _id: project.workspace,
        "members.user": user._id,
    });

    if (!workspace) {
        throw new Error("Access denied");
    }

    const tasks = await Task.find({
        project: projectId,
        isArchived: false,
    })
    .populate("createdBy", "username email")
    .populate("assignedTo", "username email")
    .populate("column", "name")
    .sort({ position: 1 });

    return tasks;
};

const updateTask = async ({
    taskId,
    taskData,
    user,
}) => {

    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await Project.findById(
        task.project
    );

    const workspace = await Workspace.findOne({
        _id: project.workspace,
        "members.user": user._id,
    });

    if (!workspace) {
        throw new Error("Access denied");
    }

    if (taskData.assignedTo) {
        const workspaceMemberIds =
            workspace.members.map(
                member => member.user.toString()
            );

        for (const userId of taskData.assignedTo) {
            const assignedUser = await User.findById(userId);

            if (!assignedUser) {
                throw new Error(
                    "Assigned user not found"
                );
            }

            if (
                !workspaceMemberIds.includes(
                    userId.toString()
                )
            ) {
                throw new Error(
                    "Assigned user is not workspace member"
                );
            }
        }
    }

    const priority = taskData.priority || task.priority;
    const dueDate = taskData.dueDate || task.dueDate;

    task.smartPriorityScore = calculateSmartPriority(
        priority,
        dueDate
    );

    task.title = taskData.title ?? task.title;
    task.description = taskData.description ?? task.description;
    task.priority = taskData.priority ?? task.priority;
    task.status = taskData.status ?? task.status;
    task.assignedTo = taskData.assignedTo ?? task.assignedTo;
    task.tags = taskData.tags ?? task.tags;
    task.dueDate = taskData.dueDate ?? task.dueDate;
    // task.column = taskData.column ?? task.column;

    if (
        task.status === "done" &&
        !task.completedAt
    ) {
        task.completedAt = new Date();
    }

    if (
        task.status !== "done"
    ) {
        task.completedAt = null;
    }

    await task.save();

    return task;
};
module.exports = { createTask, getTasks, updateTask }