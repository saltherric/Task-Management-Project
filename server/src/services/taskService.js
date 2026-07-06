const Task = require("../models/Task");
const Workspace = require("../models/Workspace");
const calculateSmartPriority = require("../utils/calculateSmartPriority");
const Project = require("../models/Project");
const User = require("../models/User");
const {createNotification} = require("../services/notificationService");
const Column = require("../models/Column");
const { emitToWorkspace } = require("../socket/socketGateway");

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

    await task.populate([
        { path: "project", select: "name" },
        { path: "column", select: "name" },
        { path: "createdBy", select: "username email" },
        { path: "assignedTo", select: "username email avatar" },
    ]);
    
    emitToWorkspace(
        project.workspace.toString(),
        "task:created",
        {
            task,
            projectId: project._id.toString(),
            workspaceId: project.workspace.toString(),
            actorId: user._id.toString(),
        }
    );

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
    .populate("project", "name")
    .sort({ position: 1 });

    return tasks;
};

const updateTask = async ({ taskId, taskData, user }) => {
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

    const oldTask = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        status: task.status,
        tags: task.tags,
    };
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

    await task.save();

    const changes = [];

    const oldDueDate = oldTask.dueDate?.getTime() ?? null;
    const newDueDate = task.dueDate?.getTime() ?? null;

    if (oldTask.title !== task.title) changes.push("title");
    if (oldTask.description !== task.description) changes.push("description");
    if (oldTask.priority !== task.priority) changes.push("priority");
    if (
        JSON.stringify(oldTask.tags) !== JSON.stringify(task.tags)
    ) {
        changes.push("tags");
    }
    if (oldDueDate !== newDueDate) changes.push("due date");

    const sender = await User.findById(user._id)
    .select("username");

    if (changes.length > 0) {
        for (const assignee of task.assignedTo) {
            // Don't notify yourself
            if (assignee.toString() === user._id.toString()) {
                continue;
            }

            await createNotification({
                recipient: assignee,
                sender: user._id,
                workspace: workspace._id,
                project: project._id,
                task: task._id,

                type: "TASK_UPDATED",

                title: "Task Updated",

                message: `${sender.username} updated the ${changes.join(", ")} of "${task.title}".`,

                actionUrl: `/tasks/${task._id}`,
            });
        }
    }

    const populateTask = await Task.findById(taskId)
        .populate("createdBy", "username email")
        .populate("assignedTo", "username email")
        .populate("column", "name")
        .populate("project", "name");

    emitToWorkspace(
        workspace._id.toString(),
        "task:updated",
        {
            task: populateTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: user._id.toString(),
        }
    );
    return populateTask;
};

const deleteTask = async ({ taskId, user }) => {
    const task = await Task.findById(taskId);
    if (!task ) {
        throw new Error("Task not found");
    }

    const project = await Project.findById(task.project);
    const workspace = await Workspace.findById(project.workspace);

    const member = workspace.members.find(
        member => 
            member.user.toString() === user._id.toString()
    );
    if(!member) {
        throw new Error("Access Denied");
    }

    if (
        member.role !== "admin" &&
        task.createdBy.toString() !== user._id.toString()
    ) {
        throw new Error("You do not have permission to delete this task");
    }

    await Task.findByIdAndDelete(taskId);
    emitToWorkspace(
        workspace._id.toString(),
        "task:deleted",
        {
            taskId: task._id.toString(),
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: user._id.toString(),
        }
    );

    return task;
};

const archiveTask = async (taskId, userId) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await Project.findById(task.project).select("workspace");

    task.isArchived = true;
    task.archivedAt = new Date();
    task.archivedBy = userId;

    await task.save();

    const populatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name");

    emitToWorkspace(
        project.workspace.toString(),
        "task:archived",
        {
            task: populatedTask,
            projectId: project._id.toString(),
            workspaceId: project.workspace.toString(),
            actorId: userId.toString(),
        }
    );

    return populatedTask;
};

const unarchiveTask = async (taskId, userId) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await Project.findById(task.project).select("workspace");

    task.isArchived = false;
    task.archivedAt = null;
    task.archivedBy = null;

    await task.save();

    const populatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name");

    emitToWorkspace(
        project.workspace.toString(),
        "task:unarchived",
        {
            task: populatedTask,
            projectId: project._id.toString(),
            workspaceId: project.workspace.toString(),
            actorId: userId.toString(),
        }
    );

    return populatedTask;
};

const getArchivedTasks = async (projectId) => {
    return await Task.find({
        project: projectId,
        isArchived: true,
    })
    .populate("archivedBy", "username email")
    .sort({ archivedAt: -1 });
}

const moveTask = async ({ taskId, columnId, user }) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const project = await Project.findById(task.project);

    if (!project) {
        throw new Error("Project not found");
    }

    const workspace = await Workspace.findById(project.workspace);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const oldColumnId = task.column.toString();

    const oldColumn = await Column.findById(task.column).select("name");
    const newColumn = await Column.findById(columnId).select("name");

    const isMovingToDone =
        newColumn?.name?.trim().toLowerCase() === "done";
    const wasInDone =
        oldColumn?.name?.trim().toLowerCase() === "done";

    task.column = columnId;
    task.completedAt = isMovingToDone
        ? new Date()
        : (wasInDone ? null : task.completedAt);

    await task.save();

    const sender = await User.findById(user._id)
        .select("username");

    if (oldColumnId !== columnId.toString()) {
        for (const assignee of task.assignedTo) {
            if (assignee.toString() === user._id.toString()) {
                continue;
            }

            await createNotification({
                recipient: assignee,
                sender: user._id,
                workspace: workspace._id,
                project: project._id,
                task: task._id,
                type: "TASK_MOVED",
                title: "Task Moved",
                message: `${sender.username} moved task "${task.title}" from "${oldColumn.name}" to "${newColumn.name}".`,
                actionUrl: `/tasks/${task._id}`,
            });
        }
    }

    const populatedTask = await Task.findById(taskId)
        .populate("createdBy", "username email avatar")
        .populate("assignedTo", "username email avatar")
        .populate("column", "name")
        .populate("project", "name");

    emitToWorkspace(
        workspace._id.toString(),
        "task:moved",
        {
            task: populatedTask,
            projectId: project._id.toString(),
            workspaceId: workspace._id.toString(),
            actorId: user._id.toString(),
        }
    );

    return populatedTask;
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask, 
    archiveTask,
    unarchiveTask,
    getArchivedTasks,
    moveTask
};