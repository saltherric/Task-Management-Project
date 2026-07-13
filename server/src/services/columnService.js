const Column = require("../models/Column");
const { getProjectForUser } = require("./projectAccessService");

const getColumns = async ({ projectId, user }) => {
    await getProjectForUser({ projectId, userId: user._id });
    return Column.find({ project: projectId }).sort({ position: 1 });
};

module.exports = { getColumns };
