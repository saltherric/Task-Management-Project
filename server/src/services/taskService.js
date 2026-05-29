const Task = require("../models/Task");
const Workspace = require("../models/Workspace");
const calculateSmartPriority = require("../utils/calculateSmartPriority");

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
        }
        // validate workspace membership
        const isMember = workspace.members.some(
            member => member.user.toString() === userId.toString()
        );

        if(!isMember){
            throw new Error('Assigned user is not workspace member');
        }
    }
    return task;
};

module.exports = { createTask }