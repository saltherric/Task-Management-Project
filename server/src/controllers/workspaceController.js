const { createWorkspace: createWorkspaceService, getWorkspaces: getWorkspacesService } = require("../services/workspaceService");

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

const getWorkspaces = async (req, res, next) => {
    try {
        const workspaces = await getWorkspacesService({
            user: req.user,
        });
        res.status(200).json({
            success: true,
            workspaces,
        });
    } catch (error) {
        next(error);
    }
}
module.exports = { createWorkspace, getWorkspaces };