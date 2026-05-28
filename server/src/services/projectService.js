const Project = require ("../models/Project");
const Column = require ("../models/Column");

const createProject = async ({ projectData, user}) => {
    const project = await Project.create({
        workspace: projectData.workspace,
        name: projectData.name,
        description: projectData.description,
        createdBy: user._id,
        visibility: projectData.visibility,
        sprintEndDate: projectData.sprintEndDate
    });

    //defaul column
    const defaultColumns = [
        {
            project: project._id,
            name: "To Do",
            position: 0
        },
        {
            project: project._id,
            name: "In Progress",
            position: 1
        },
        {
            project: project._id,
            name: "Review",
            position: 2
        },
        {
            project: project._id,
            name: "Done",
            position: 3
        }
    ];
    await Column.insertMany(defaultColumns);
    return project;
}

module.exports = { createProject };