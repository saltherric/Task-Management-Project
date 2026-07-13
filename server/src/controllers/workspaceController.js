const { createWorkspace: createWorkspaceService, getWorkspaces: getWorkspacesService, getWorkspaceTags: getWorkspaceTagsService, addWorkspaceTag: addWorkspaceTagService  } = require("../services/workspaceService");
const { getWorkspaceMembers: getWorkspaceMembersService, updateWorkspace, deleteWorkspace, getAvailableMembers: getAvailableMembersService, invitesMember: invitesMemberService, updateMemberRole: updateMemberRoleService, leaveWorkspace} = require("../services/InvitedService");
const { emitToWorkspace } = require("../socket/socketGateway");
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

const updateWorkspaceController = async (req, res, next) => {
    try {
        const workspace =  await updateWorkspace({
            workspaceId: req.params.workspaceId,
            workspaceData: req.body,
            user: req.user
        });

        emitToWorkspace(req.params.workspaceId, "workspace:updated", {
            workspaceId: req.params.workspaceId,
            workspace,
        });

        res.status(200).json({
            success: true,
            workspace
        });
    } catch (error) {
        next(error);
    }
}

const deleteWorkspaceController = async (req, res, next) => {
    try {
        emitToWorkspace(req.params.workspaceId, "workspace:deleted", {
            workspaceId: req.params.workspaceId,
        });

        await deleteWorkspace({
            workspaceId: req.params.workspaceId,
            user: req.user,
        });

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

const getTags = async (req, res, next) => {
    try {
        const tags = await getWorkspaceTagsService(
            req.params.workspaceId
        );
        res.status(200).json({
            success: true,
            tags,
        });
    } catch (error) {
        next(error);
    }
};

const createTag = async (req, res, next) => {
    try {
        const tag = await addWorkspaceTagService({
            workspaceId: req.params.workspaceId,
            tagName: req.body.tagName,
        });
        res.status(201).json({
            success: true,
            tag
        });
    } catch (error) {
        next(error);
    }
};

const getWorkspaceMembers = async (req, res, next) => {
    try {
        const members = await getWorkspaceMembersService({
            workspaceId: req.params.workspaceId,
        });
        res.status(200).json({
            success: true,
            members,
        });
    } catch (error) {
        next(error);
    }
}

const getAvailableMembers = async (req, res, next) => {
    try {
        const availableMembers = await getAvailableMembersService({
            workspaceId: req.params.workspaceId
        });
        res.status(200).json({
            success: true,
            availableMembers,
        })
    } catch (error) {
        next(error);
    }
}

const invitesMember = async (req, res, next) => {
    try {console.log(req.body);
        const member = await invitesMemberService({
            workspaceId: req.params.workspaceId,
            userId: req.body.userId,
            role: req.body.role,
            requesterId: req.user._id,
        })
        res.status(201).json({
            success: true,
            member,
        })
    } catch (error) {
         console.error(error);
        next(error);
    }
}

const updateMemberRole = async (req, res, next) => {
    try {
        const roles = await updateMemberRoleService({
            workspaceId: req.params.workspaceId,
            memberId: req.params.memberId,
            role: req.body.role,
            
        })
        
        emitToWorkspace(req.params.workspaceId, "workspace:role_updated", {
            workspaceId: req.params.workspaceId,
            memberId: req.params.memberId,
            role: req.body.role,
        });

        res.status(200).json({
            success: true,
            roles,
        })
    } catch (error) {
        next(error);
    }
}
const leaveWorkspaceController = async (req, res, next) => {
    try {
        const workspace = await leaveWorkspace({
            workspaceId: req.params.workspaceId,
            userId: req.user._id,
        });

        res.status(200).json({
            message: "Left workspace successfully",
            workspace,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    createWorkspace, 
    getWorkspaces, 
    updateWorkspaceController,
    deleteWorkspaceController,
    getTags, 
    createTag, 
    getWorkspaceMembers, 
    getAvailableMembers, 
    invitesMember, 
    updateMemberRole,
    leaveWorkspaceController
};