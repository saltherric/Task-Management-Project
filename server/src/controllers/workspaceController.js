const { createWorkspace: createWorkspaceService } = require("../services/workspaceService");

const createWorkspace = async (req, res, next) => {
    try {
        const workspace = await createWorkspaceService({
            workspaceData: req.body,
            user: req.user,
        });
        res.status(201).json({
            success: true,
            workspace,
        });
    } catch (error) {
        next(error);
    };
}

module.exports = { createWorkspace };